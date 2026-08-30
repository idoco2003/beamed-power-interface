// SPDX-License-Identifier: Apache-2.0
//
// A BPI token verifier that speaks the bpi-validate harness contract.
//
//   echo '{"token":…,"context":…,"publicKey":…,"keyId":…}' | bpi-verify
//   {"accepted":false,"reason":"prevHash does not match the held token"}
//
// Driven by the same runner an outside implementer would use:
//
//   node tools/bpi-validate.mjs vectors --exec "./sdk/cpp/build/bpi-verify"
//
// This is the author's second implementation, not an independent one, so it does
// NOT close OBJECTIONS.md O-1. What it does is exercise the specification in a
// different language, with a different JSON parser and a different crypto
// library, which is where canonicalisation disagreements actually live.
#include <sodium.h>

#include <cmath>
#include <cstdio>
#include <ctime>
#include <iostream>
#include <sstream>
#include <string>

#include "bpi/jcs.hpp"
#include "bpi/json.hpp"
#include "bpi/jws.hpp"

using namespace bpi;

/** Milliseconds since the epoch from an RFC 3339 UTC timestamp, NaN if it does
 *  not parse. §2.2 requires UTC with a trailing Z, so nothing else is accepted. */
static double parse_iso8601_ms(const std::string& s) {
    int y, mo, d, h, mi;
    double sec = 0;
    char zone = 0;
    // Fractional seconds are optional; the examples carry milliseconds.
    if (std::sscanf(s.c_str(), "%4d-%2d-%2dT%2d:%2d:%lf%c", &y, &mo, &d, &h, &mi, &sec, &zone) < 6) {
        return std::nan("");
    }
    if (zone != 'Z' && zone != 0) return std::nan("");
    std::tm tm{};
    tm.tm_year = y - 1900;
    tm.tm_mon = mo - 1;
    tm.tm_mday = d;
    tm.tm_hour = h;
    tm.tm_min = mi;
    tm.tm_sec = 0;
    const time_t t = timegm(&tm);
    if (t == static_cast<time_t>(-1)) return std::nan("");
    return static_cast<double>(t) * 1000.0 + sec * 1000.0;
}

static void answer(bool accepted, const std::string& reason) {
    std::printf("{\"accepted\":%s,\"reason\":%s}\n", accepted ? "true" : "false",
                es_string(reason).c_str());
}

/** The verdict. Written against the published vector context alone — the same
 *  discipline tools/bpi-validate.mjs follows — so it proves the vectors are
 *  sufficient for someone who has only this repository. */
static void verify(const Json& in) {
    const Json* token = in.find("token");
    const Json* ctx = in.find("context");
    const Json* pub = in.find("publicKey");
    if (!token || !ctx || !pub) return answer(false, "harness input is missing token, context or publicKey");

    const Json* msgType = token->find("msgType");
    if (!msgType || !msgType->is_string() || msgType->as_string() != "EnableToken") {
        return answer(false, "not an EnableToken");
    }

    const Json* tSession = token->find("sessionId");
    const Json* cSession = ctx->find("sessionId");
    if (!tSession || !cSession || !tSession->is_string() || !cSession->is_string() ||
        tSession->as_string() != cSession->as_string()) {
        return answer(false, "wrong session");
    }

    // [R-S-020] the hash chain. Checked before the signature, though the order is
    // not fixed by the specification — see DISPOSITIONS F-7, which is why the
    // vectors accept more than one reason where an input is invalid twice over.
    const Json* held = ctx->find("heldToken");
    const Json* seq = token->find("seq");
    const Json* prevHash = token->find("prevHash");
    if (held && !held->is_null()) {
        const Json* heldSeq = held->find("seq");
        const Json* heldHash = held->find("hash");
        const long expected = static_cast<long>(heldSeq ? heldSeq->as_number() : 0) + 1;
        const long got = static_cast<long>(seq ? seq->as_number() : -1);
        if (got != expected) {
            return answer(false, "seq gap: expected " + std::to_string(expected) + ", got " +
                                     std::to_string(got));
        }
        if (!prevHash || !prevHash->is_string() || !heldHash || !heldHash->is_string() ||
            prevHash->as_string() != heldHash->as_string()) {
            return answer(false, "prevHash does not match the held token");
        }
    } else if (!seq || seq->as_number() != 0 || !prevHash || !prevHash->is_null()) {
        return answer(false, "first token must be seq 0 with a null prevHash");
    }

    const VerifyResult sig = verify_detached(*token, pub->as_string());
    if (!sig.ok) return answer(false, sig.reason);

    // [R-S-021] act on whichever expires first. The monotonic bound is the one
    // that survives a wall clock someone has moved backwards.
    const Json* notAfter = token->find("notAfter");
    const Json* nowMs = ctx->find("nowMs");
    const double deadline = notAfter && notAfter->is_string() ? parse_iso8601_ms(notAfter->as_string())
                                                             : std::nan("");
    if (std::isnan(deadline)) return answer(false, "notAfter is not an RFC 3339 UTC timestamp");
    const bool wallExpired = nowMs && nowMs->as_number() > deadline;

    const Json* lastAccepted = ctx->find("lastAcceptedMonotonicMs");
    const Json* monotonic = ctx->find("monotonicMs");
    const Json* lifetime = ctx->find("tokenLifetimeS");
    const bool monoExpired = lastAccepted && !lastAccepted->is_null() && monotonic && lifetime &&
                             (monotonic->as_number() - lastAccepted->as_number()) >
                                 lifetime->as_number() * 1000.0;

    if (wallExpired && monoExpired) return answer(false, "expired on both clocks");
    if (wallExpired) return answer(false, "expired: notAfter has passed");
    if (monoExpired) return answer(false, "expired: monotonic lifetime exceeded");

    answer(true, "valid");
}

int main() {
    if (sodium_init() < 0) {
        answer(false, "libsodium failed to initialise");
        return 1;
    }
    std::ostringstream buf;
    buf << std::cin.rdbuf();
    try {
        verify(Json::parse(buf.str()));
    } catch (const std::exception& e) {
        // A malformed input is a verdict, not a crash. An implementation that
        // aborts here has failed the vector, and saying so is more useful than
        // a stack trace the runner would have to interpret.
        answer(false, std::string("input did not parse: ") + e.what());
    }
    return 0;
}
