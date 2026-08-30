// SPDX-License-Identifier: Apache-2.0
//
// JSON in on stdin, RFC 8785 canonical form out on stdout.
//
// Exists so the two implementations can be diffed over every file in the
// repository rather than over the two the vectors happen to sign. A
// canonicaliser that agrees on the test cases and diverges on real documents has
// agreed about nothing.
#include <iostream>
#include <sstream>

#include "bpi/jcs.hpp"
#include "bpi/json.hpp"

int main() {
    std::ostringstream buf;
    buf << std::cin.rdbuf();
    try {
        std::cout << bpi::canonicalize(bpi::Json::parse(buf.str()));
    } catch (const std::exception& e) {
        std::cerr << "bpi-canon: " << e.what() << "\n";
        return 1;
    }
    return 0;
}
