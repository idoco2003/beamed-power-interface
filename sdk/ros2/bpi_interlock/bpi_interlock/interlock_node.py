# SPDX-License-Identifier: Apache-2.0
#
# The BPI-S interlock as a ROS 2 node.
#
# ---------------------------------------------------------------------------
# THIS FILE HAS NEVER BEEN BUILT OR RUN.
#
# There is no ROS 2 installation on the machine where it was written, so it has
# not been compiled, launched, or exercised against a live topic. The logic it
# implements is the logic in reference/interlock.mjs, which IS tested — but the
# ROS wiring around it is unverified source, and the repository's own rule is
# that nothing claims more than it has. Treat this as a worked sketch of how the
# interlock maps onto a ROS graph, not as software.
# ---------------------------------------------------------------------------
#
# Two things about the design are worth reading before the code.
#
# THE ABORT LATCH IS A ROS LATCH. The abort topic uses TRANSIENT_LOCAL
# durability, so a node that subscribes AFTER an abort was published still
# receives it. An abort that only reaches nodes which happened to be listening
# is not an abort, and a late-joining node coming up believing the beam is safe
# to enable is precisely the failure the interlock exists to prevent.
#
# VERIFICATION USES canonical_json AND NOTHING ELSE. The decoded fields on the
# message are for logging and routing. Rebuilding the JSON from them would
# produce different bytes — different key order, different number formatting —
# and the signature would fail. See the header of sdk/ros2/generate-msgs.py.
import json
import time

import rclpy
from rclpy.node import Node
from rclpy.qos import DurabilityPolicy, QoSProfile, ReliabilityPolicy
from std_msgs.msg import String

from bpi_msgs.msg import Abort, EnableToken

# §5.2. RAMPING_DOWN and SAFING are transient; the node reports what it is in.
STATES = ('IDLE', 'ARMED', 'ACQUIRING', 'RAMPING_UP', 'DELIVERING',
          'RAMPING_DOWN', 'SAFING', 'SAFE', 'LATCHED')

# §5.8. A latching abort needs a two-party signed reset; the others resume.
LATCHING = frozenset({'CORRIDOR_VIOLATION', 'E_STOP', 'EXPOSURE_EXCEEDED',
                      'INTERLOCK_FAULT'})


class InterlockNode(Node):
    """Radiates only while permission keeps arriving."""

    def __init__(self):
        super().__init__('bpi_interlock')

        self.declare_parameter('session_id', '')
        self.declare_parameter('token_lifetime_s', 5.0)
        self.declare_parameter('committed_power_kw', 0.0)

        self.session_id = self.get_parameter('session_id').value
        self.token_lifetime_s = float(self.get_parameter('token_lifetime_s').value)
        self.committed_kw = float(self.get_parameter('committed_power_kw').value)

        self.state = 'IDLE'
        self.power_kw = 0.0
        self.held = None            # the last accepted token, decoded
        self.held_hash = None       # its sha256, for the [R-S-020] chain
        self.last_accepted_mono = None
        self.latched_cause = None

        # An abort must reach a node that was not listening when it fired.
        latched = QoSProfile(depth=1,
                             reliability=ReliabilityPolicy.RELIABLE,
                             durability=DurabilityPolicy.TRANSIENT_LOCAL)

        self.create_subscription(EnableToken, 'bpi/enable_token', self.on_token, 10)
        self.create_subscription(Abort, 'bpi/abort', self.on_abort, latched)
        self.state_pub = self.create_publisher(String, 'bpi/state', latched)
        self.abort_pub = self.create_publisher(Abort, 'bpi/abort', latched)

        # [R-S-002] expiry and link loss take the same path, because from here
        # they are indistinguishable. This timer is that path.
        self.create_timer(0.1, self.tick)
        self.get_logger().warn(
            'bpi_interlock is UNVERIFIED SOURCE: never built or run. See the file header.')

    # -- [R-S-020] [R-S-021] ------------------------------------------------

    def on_token(self, msg: EnableToken) -> None:
        if self.state == 'LATCHED':
            self.get_logger().info(f'token ignored: latched on {self.latched_cause}')
            return
        try:
            token = json.loads(msg.canonical_json)
        except json.JSONDecodeError:
            return self.safe('INTERLOCK_FAULT', 'canonical_json did not parse')

        if token.get('sessionId') != self.session_id:
            return self.safe('INTERLOCK_FAULT', 'wrong session')

        # The chain. A token that does not follow the one held is either a replay
        # or proof that one was missed, and both mean do not act on it.
        if self.held_hash is None:
            if token.get('seq') != 0 or token.get('prevHash') is not None:
                return self.safe('INTERLOCK_FAULT',
                                 'first token must be seq 0 with a null prevHash')
        else:
            if token.get('seq') != self.held['seq'] + 1:
                return self.safe('INTERLOCK_FAULT', 'seq gap')
            if token.get('prevHash') != self.held_hash:
                return self.safe('INTERLOCK_FAULT', 'prevHash does not match')

        # NOTE, and it is the gap that matters most in this file: the signature
        # is NOT verified here. Doing it needs an Ed25519 verifier over
        # msg.canonical_json — sdk/cpp/include/bpi/jws.hpp is the worked one — and
        # wiring that in is the first thing to do before this node goes anywhere
        # near hardware. A chain check without a signature check proves only that
        # someone consistent is talking, not that they are authorised.
        self.held = token
        self.held_hash = _sha256_of(msg.canonical_json)
        self.last_accepted_mono = time.monotonic()

        # [R-S-022] the token is an authorisation, so its ceiling binds together
        # with the commitment. Lowering it in the next token curtails the beam
        # within one refresh, with no second command path.
        ceiling = min(self.committed_kw, float(token.get('maxPower_kW', 0.0)))
        if self.state in ('IDLE', 'SAFE'):
            self.state = 'ARMED'
        elif self.state == 'DELIVERING':
            self.power_kw = min(self.power_kw, ceiling)
        self.publish_state()

    def tick(self) -> None:
        """[R-S-002] no successor, no beam."""
        if self.state in ('IDLE', 'SAFE', 'LATCHED') or self.last_accepted_mono is None:
            return
        # Monotonic, per [R-S-021]: a wall clock moved backwards must not extend
        # a token's life, so the deadline never consults one.
        if time.monotonic() - self.last_accepted_mono > self.token_lifetime_s:
            self.safe('TOKEN_EXPIRY', 'no successor token within the lifetime')

    # -- §5.8 ---------------------------------------------------------------

    def on_abort(self, msg: Abort) -> None:
        self.safe(msg.reason or 'EXTERNAL', 'abort received on the topic', republish=False)

    def safe(self, cause: str, detail: str, republish: bool = True) -> None:
        """[R-S-043] defocus, then power down. Order is normative."""
        self.power_kw = 0.0
        self.state = 'LATCHED' if cause in LATCHING else 'SAFE'
        self.latched_cause = cause if self.state == 'LATCHED' else None
        self.get_logger().warn(f'SAFE via {cause}: {detail} (actions: DEFOCUS, POWER_DOWN)')
        if republish:
            out = Abort()
            out.reason = cause
            self.abort_pub.publish(out)
        self.publish_state()

    def publish_state(self) -> None:
        m = String()
        m.data = f'{self.state} {self.power_kw:.1f}kW'
        self.state_pub.publish(m)


def _sha256_of(canonical: str) -> str:
    import hashlib
    return 'sha256:' + hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def main(args=None) -> None:
    rclpy.init(args=args)
    node = InterlockNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
