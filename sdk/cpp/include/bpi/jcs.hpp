// SPDX-License-Identifier: Apache-2.0
//
// RFC 8785 JSON Canonicalization Scheme, in C++.
//
// tools/lib/jcs.mjs carries this remark: "JavaScript gives us the number rule
// for free, because Number::toString IS the ECMAScript rule. That is the
// strongest argument for canonicalising here rather than in Python, where
// matching it takes real work."
//
// This file is that real work, and it is the reason the C++ SDK exists. A
// signature is only as good as the bytes it was computed over; two
// implementations that serialise the same object differently will accuse each
// other of forgery. Canonicalisation is an interoperability surface, and an
// interoperability surface with one implementation has never been tested.
//
// Two rules do all the damage:
//
//   KEY ORDER is by UTF-16 code unit, not by code point and not by UTF-8 byte.
//   They diverge above the BMP: a supplementary character begins with a high
//   surrogate (0xD800..0xDBFF), which sorts BELOW U+E000..U+FFFF. RFC 8785's own
//   worked example turns on exactly this — an emoji must sort before U+FB33.
//   Handled in json.hpp by the map comparator.
//
//   NUMBERS are ECMAScript Number::toString, implemented here.
#pragma once

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <stdexcept>
#include <string>

#include "json.hpp"

namespace bpi {

/** Shortest decimal digits that round-trip to the same double.
 *
 * Written as a widening search rather than with std::to_chars because it is
 * portable to every standard library and, more usefully, it is obviously
 * correct: the first precision whose parse-back is bit-identical IS the shortest
 * round-tripping representation, by construction. Seventeen significant digits
 * always suffice for a binary64.
 *
 * Fills `digits` with the significand digits and returns the decimal exponent E
 * from the d.ddde±XX form.
 */
inline int shortest_digits(double x, std::string& digits) {
    char buf[64];
    for (int p = 1; p <= 17; ++p) {
        std::snprintf(buf, sizeof buf, "%.*e", p - 1, x);
        if (std::strtod(buf, nullptr) == x) break;
    }
    // buf is now "-d.ddde±XX" or "de±XX".
    const char* s = buf;
    if (*s == '-') ++s;
    digits.clear();
    for (; *s && *s != 'e' && *s != 'E'; ++s) {
        if (*s != '.') digits += *s;
    }
    // Trailing zeros are not significant and would inflate k, changing which
    // formatting branch applies below.
    while (digits.size() > 1 && digits.back() == '0') digits.pop_back();
    return std::atoi(s + 1);
}

/** ECMAScript Number::toString, radix 10, which RFC 8785 section 3.2.2.3 adopts
 *  wholesale. The branch numbering follows ECMA-262. */
inline std::string es_number(double x) {
    if (std::isnan(x) || std::isinf(x)) throw std::runtime_error("NaN and Infinity are not JSON");
    if (x == 0) return "0";  // also the -0 case: RFC 8785 serialises it as 0
    std::string sign;
    if (x < 0) { sign = "-"; x = -x; }

    std::string d;
    int e = shortest_digits(x, d);
    const int k = static_cast<int>(d.size());
    const int n = e + 1;  // d.ddd x 10^e  ==  s x 10^(n-k), so n = e + 1

    if (k <= n && n <= 21) return sign + d + std::string(static_cast<size_t>(n - k), '0');
    if (0 < n && n <= 21) return sign + d.substr(0, static_cast<size_t>(n)) + "." + d.substr(static_cast<size_t>(n));
    if (-6 < n && n <= 0) return sign + "0." + std::string(static_cast<size_t>(-n), '0') + d;

    const int exp = n - 1;
    const std::string expPart = (exp >= 0 ? "e+" : "e-") + std::to_string(exp >= 0 ? exp : -exp);
    if (k == 1) return sign + d + expPart;
    return sign + d.substr(0, 1) + "." + d.substr(1) + expPart;
}

/** RFC 8259 string escaping, which RFC 8785 narrows to the shortest forms. */
inline std::string es_string(const std::string& s) {
    std::string out = "\"";
    for (size_t i = 0; i < s.size(); ++i) {
        unsigned char c = static_cast<unsigned char>(s[i]);
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b"; break;
            case '\t': out += "\\t"; break;
            case '\n': out += "\\n"; break;
            case '\f': out += "\\f"; break;
            case '\r': out += "\\r"; break;
            default:
                if (c < 0x20) {
                    char buf[8];
                    std::snprintf(buf, sizeof buf, "\\u%04x", c);
                    out += buf;
                } else {
                    out += static_cast<char>(c);  // UTF-8 passes through
                }
        }
    }
    return out + "\"";
}

/** Canonicalise. Object members are already in UTF-16 code unit order because
 *  Object is a map with that comparator, so this is a straight walk. */
inline std::string canonicalize(const Json& v) {
    switch (v.type()) {
        case Json::Type::Null: return "null";
        case Json::Type::Bool: return v.as_bool() ? "true" : "false";
        case Json::Type::Number: return es_number(v.as_number());
        case Json::Type::String: return es_string(v.as_string());
        case Json::Type::Array: {
            std::string out = "[";
            bool first = true;
            for (const auto& e : v.as_array()) {
                if (!first) out += ",";
                first = false;
                out += canonicalize(e);
            }
            return out + "]";
        }
        case Json::Type::Object: {
            std::string out = "{";
            bool first = true;
            for (const auto& [key, val] : v.as_object()) {
                if (!first) out += ",";
                first = false;
                out += es_string(key) + ":" + canonicalize(val);
            }
            return out + "}";
        }
    }
    throw std::runtime_error("cannot canonicalize");
}

}  // namespace bpi
