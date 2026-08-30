// SPDX-License-Identifier: Apache-2.0
//
// The same RFC 8785 vectors tools/test-jcs.mjs runs, in C++.
//
// Running identical vectors through two independently written canonicalisers in
// two languages is the only way to find out whether the specification is
// implementable or merely implemented. Where these disagree, one of them is
// wrong and the specification has to say which.
#include <cmath>
#include <cstdio>
#include <string>

#include "bpi/jcs.hpp"
#include "bpi/json.hpp"

static int failures = 0;

static void check(const char* name, const std::string& got, const std::string& want) {
    const bool ok = got == want;
    if (!ok) ++failures;
    std::printf("  %s  %s\n", ok ? "ok  " : "FAIL", name);
    if (!ok) {
        std::printf("        got : %s\n", got.c_str());
        std::printf("        want: %s\n", want.c_str());
    }
}

int main() {
    using namespace bpi;

    // RFC 8785 section 3.2.3. Keys pinned by their UTF-8 bytes so no editor or
    // normalisation pass can quietly change the data underneath the test.
    const std::string K_nul(1, '\0');                      // U+0000
    const std::string K_cr = "\r";                         // U+000D
    const std::string K_one = "1";
    const std::string K_odia = "\xC3\xB6";                 // U+00F6  ö
    const std::string K_euro = "\xE2\x82\xAC";             // U+20AC  €
    const std::string K_emoji = "\xF0\x9F\x98\x82";        // U+1F602 face with tears of joy
    const std::string K_dalet = "\xEF\xAC\xB3";            // U+FB33  precomposed, NOT dalet + dagesh

    Object o;
    o.emplace(K_euro, Json("Euro Sign"));
    o.emplace(K_cr, Json("Carriage Return"));
    o.emplace(K_dalet, Json("Hebrew Letter Dalet With Dagesh"));
    o.emplace(K_one, Json("One"));
    o.emplace(K_emoji, Json("Emoji: Smiley"));
    o.emplace(K_nul, Json("Control"));
    o.emplace(K_odia, Json("Latin Small Letter O With Diaeresis"));

    // The ordering under test: U+FB33 sorts AFTER the emoji, because the emoji's
    // first UTF-16 code unit is the high surrogate 0xD83D. Sorting by code point
    // would put U+1F602 last and get this backwards.
    const std::string want =
        std::string("{") +
        "\"\\u0000\":\"Control\"," +
        "\"\\r\":\"Carriage Return\"," +
        "\"1\":\"One\"," +
        "\"" + K_odia + "\":\"Latin Small Letter O With Diaeresis\"," +
        "\"" + K_euro + "\":\"Euro Sign\"," +
        "\"" + K_emoji + "\":\"Emoji: Smiley\"," +
        "\"" + K_dalet + "\":\"Hebrew Letter Dalet With Dagesh\"" +
        "}";
    check("RFC 8785 3.2.3 key ordering", canonicalize(Json(o)), want);

    // ECMAScript Number::toString. The same list tools/test-jcs.mjs asserts.
    struct { double v; const char* want; } nums[] = {
        {0.0, "0"}, {-0.0, "0"}, {1.0, "1"}, {-1.0, "-1"}, {0.1, "0.1"},
        {1e30, "1e+30"}, {1e-7, "1e-7"}, {1.0 / 3.0, "0.3333333333333333"},
        {9007199254740992.0, "9007199254740992"}, {1e21, "1e+21"},
        // Beyond the JS list, because C++ is where these go wrong.
        {95000.0, "95000"}, {1e-6, "0.000001"}, {123456789012345678901.0, "123456789012345680000"},
        {5e-324, "5e-324"}, {1.7976931348623157e308, "1.7976931348623157e+308"},
    };
    for (const auto& n : nums) {
        check((std::string("number ") + n.want).c_str(), canonicalize(Json(n.v)), n.want);
    }

    check("nested + array",
          canonicalize(Json::parse(R"({"b":[1,{"d":2,"c":3}],"a":null})")),
          R"({"a":null,"b":[1,{"c":3,"d":2}]})");

    // Round trip: parsing a canonical form and re-canonicalising is a fixed
    // point. If it is not, the parser and the serialiser disagree about
    // something, and a signature computed over either is worthless.
    const char* sample = R"({"a":"\u00f6","b":[true,false,null],"c":{"z":1,"y":2},"d":-0.5})";
    const std::string once = canonicalize(Json::parse(sample));
    const std::string twice = canonicalize(Json::parse(once));
    check("canonicalisation is a fixed point", twice, once);

    // Surrogate pairs survive parse and re-serialise as UTF-8, not as escapes.
    check("escaped surrogate pair round trips",
          canonicalize(Json::parse(R"({"k":"\ud83d\ude02"})")),
          std::string("{\"k\":\"") + K_emoji + "\"}");

    std::printf(failures ? "\nJCS (C++): %d failure(s)\n" : "\nJCS (C++): all vectors pass\n", failures);
    return failures ? 1 : 0;
}
