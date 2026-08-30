// SPDX-License-Identifier: Apache-2.0
//
// The same derived-quantity assertions reference/test-interlock.mjs makes.
// Identical inputs, identical expected values, a different language.
#include <cstdio>
#include <string>

#include "bpi/interlock.hpp"

static int failures = 0;

static void check(const char* name, bool ok) {
    if (!ok) ++failures;
    std::printf("  %s  %s\n", ok ? "ok  " : "FAIL", name);
}

int main() {
    using namespace bpi;
    const Profile STANDARD{"STANDARD", 5.0, 1.0, 0.4, 0.2};
    const Profile FAST{"FAST", 1.0, 10.0, 0.32, 0.2};

    check("[R-S-024] buffer is 1,350 m at 250 m/s (STANDARD)",
          dead_man_buffer_m(STANDARD, 250.0) == 1350.0);
    check("[R-S-024] buffer is 330 m at 250 m/s (FAST)",
          dead_man_buffer_m(FAST, 250.0) == 330.0);
    check("[R-C-022] a 2 s p99 command path may not deliver",
          command_path_admissible(STANDARD, 2000.0) == false);
    check("[R-C-022] a 300 ms p99 command path may",
          command_path_admissible(STANDARD, 300.0) == true);
    check("[R-C-022] FAST needs a p99 under 333 ms, so 400 ms is barred",
          command_path_admissible(FAST, 400.0) == false);
    check("[R-S-033] SGP4 is inadmissible for the corridor",
          ephemeris_admissible_for_corridor("SGP4_GP") == false);
    check("[R-S-033] GNSS onboard is admissible",
          ephemeris_admissible_for_corridor("GNSS_ONBOARD") == true);

    std::printf(failures ? "\ninterlock (C++): %d failure(s)\n" : "\ninterlock (C++): all pass\n",
                failures);
    return failures ? 1 : 0;
}
