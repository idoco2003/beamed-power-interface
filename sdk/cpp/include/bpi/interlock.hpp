// SPDX-License-Identifier: Apache-2.0
//
// The derived quantities of BPI-S, in C++.
//
// These are the numbers a segment operator has to compute correctly to size a
// site, and they are the ones the specification derives rather than asserts. The
// point of having them in two languages is not redundancy: it is that a value
// which comes out differently here has found either a bug or an ambiguity in how
// §5.5 is worded, and both are worth knowing before someone pours concrete.
#pragma once

#include <string>

namespace bpi {

struct Profile {
    std::string profileId;
    double tokenLifetimeS;
    double tokenRefreshHz;
    double abortToSafeS;
    double corridorHalfAngleDeg;
};

/** [R-S-024] the dead-man buffer: how far an intruder travels during the
 *  worst-case unsafe window, which is the token's whole life plus the time to
 *  reach a safe state after it lapses. At the STANDARD profile and a declared
 *  250 m/s this is 1,350 m, and that number sets the keep-out volume. */
inline double dead_man_buffer_m(const Profile& p, double intruderSpeedMaxMs) {
    return intruderSpeedMaxMs * (p.tokenLifetimeS + p.abortToSafeS);
}

/** [R-C-022] a segment whose command path is too slow may not deliver. Three
 *  round trips inside one token lifetime, so a lost refresh can still be
 *  recovered before the token lapses. */
inline bool command_path_admissible(const Profile& p, double latencyMsP99) {
    return p.tokenLifetimeS * 1000.0 >= 3.0 * latencyMsP99;
}

/** [R-S-033] SGP4 general-perturbations elements are inadmissible as the
 *  corridor reference, and bar an L2 or L3 conformance claim. */
inline bool ephemeris_admissible_for_corridor(const std::string& source) {
    return source != "SGP4_GP";
}

}  // namespace bpi
