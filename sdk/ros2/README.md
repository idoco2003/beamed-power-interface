<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# BPI for ROS 2

Messages generated from `schemas/0.2/`, the BPI-S interlock as a node, and the derived
keep-out volume as a Gazebo world.

## Read this first

**Nothing in this directory has been built or run.** There is no ROS 2 installation on the
machine where it was written. `bpi_msgs` has not been through `rosidl`, `bpi_interlock` has
not been launched, and `keepout.sdf` has not been opened in Gazebo. The message files are
generated and their generator *is* checked — `tools/check-consistency.sh` fails the build
if they drift from the schemas — but the ROS wiring around them is unverified source.

This repository's rule is that nothing claims more than it has, so: treat this as a worked
sketch of how BPI maps onto a ROS graph. A first build will find things. Please open a
discussion when it does.

## The design decision worth arguing with

Every message carries **`string canonical_json`** — the exact RFC 8785 bytes the signature
was computed over — and the decoded fields beside it are for routing and display only.

The obvious alternative is to map each JSON field to a ROS field and let the type system
carry the message. **It cannot work for anything signed.** A signature is over specific
bytes. Decode them into a ROS message, publish, re-encode on the far side, and you get
bytes differing in key order, in number formatting, or in which absent-versus-null
distinction survived. The signature then fails and the receiver concludes it is under
attack when it is only being helped.

ROS IDL also cannot express three things BPI depends on:

- a **nullable** field — `prevHash` is string-or-null, and null at `seq` 0 is legal and
  meaningful under `[R-S-020]`
- a **conditional shape** — the `if`/`then`/`else` on `article21.applicability`
- **absent** as distinct from **empty**

A generator that flattened those would emit messages that look conformant and are not.

*This generalises past ROS, and it is the concrete reason the Protobuf proposal in the
outside architecture review was not adopted: any transport that re-serialises a BPI message
breaks its signature unless it re-canonicalises byte-identically. Carrying the signed bytes
verbatim is the only construction that survives a round trip.* Recorded as
`DISPOSITIONS.md` F-9.

## Layout

| Path | What | Verified? |
|---|---|---|
| `generate-msgs.py` | Generates `bpi_msgs/msg/*.msg` from the schemas | yes — runs, and `--check` is in the build |
| `bpi_msgs/` | 14 message definitions, generated | generated, never compiled |
| `bpi_interlock/` | The interlock as an `rclpy` node | **no — never built or run** |
| `worlds/keepout.sdf` | The `[R-S-024]` buffer at 1:1 | XML well-formedness only |

## The node, and its one important gap

`bpi_interlock` checks the session, the `seq` and the `[R-S-020]` hash chain, holds the
`[R-S-021]` deadline on a **monotonic** clock so a wall clock moved backwards cannot extend
a token's life, and publishes abort with `TRANSIENT_LOCAL` durability so a node that
subscribes *after* an abort still receives it. An abort that only reaches nodes which
happened to be listening is not an abort.

**It does not verify the signature.** That needs an Ed25519 verifier over
`canonical_json`; `sdk/cpp/include/bpi/jws.hpp` is the worked one. A chain check without a
signature check proves that someone consistent is talking, not that they are authorised.
This is the first thing to fix and it is said in the source as well as here.

## Gazebo

`worlds/keepout.sdf` renders the `[R-S-024]` keep-out volume at 1:1 — a 5.2 m rectenna
inside a 1,350 m radius of land nobody may enter while the beam is live. The radius is
derived, not chosen, and the world file carries the arithmetic:
5000 ms token + 100 ms detect + 50 ms defocus + 250 ms ramp = 5.4 s, at 250 m/s.

**There is deliberately no Gazebo plugin.** A plugin is compiled C++ that cannot be built
or run here, and shipping unbuildable safety-adjacent code into a repository whose entire
posture is *don't claim what you haven't verified* would be the wrong trade. Declarative
SDF can be read and checked by eye; a plugin cannot. What a real integration needs is an
intruder-detection model publishing into `bpi/abort` on breach of the volume above — which
is a contribution worth having, from someone who can run it.

## Building it, if you have ROS 2

```sh
python3 sdk/ros2/generate-msgs.py          # refresh messages from the schemas
colcon build --packages-select bpi_msgs bpi_interlock
ros2 run bpi_interlock interlock --ros-args -p session_id:=s1 -p committed_power_kw:=95000
```
