// SPDX-License-Identifier: Apache-2.0
//
// Detached JWS verification over the RFC 8785 canonicalisation, per [R-C-015].
//
// Deliberately built on libsodium rather than OpenSSL, because the JavaScript
// side is OpenSSL-backed through node:crypto. Two implementations sharing a
// crypto library would agree for reasons that have nothing to do with the
// specification being clear.
//
// What is signed, and what is not: [R-C-015] computes the signature over the
// message "with the sig.value member absent". sig.alg and sig.keyId stay IN. A
// signature that did not cover the key id it was made with could be replayed
// under a different key id by anyone able to edit the message.
#pragma once

#include <sodium.h>

#include <string>
#include <vector>

#include "jcs.hpp"
#include "json.hpp"

namespace bpi {

inline const char* B64U = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

inline std::string b64u_encode(const unsigned char* p, size_t n) {
    std::string out;
    for (size_t i = 0; i < n; i += 3) {
        const unsigned v = (static_cast<unsigned>(p[i]) << 16) |
                           (i + 1 < n ? static_cast<unsigned>(p[i + 1]) << 8 : 0u) |
                           (i + 2 < n ? static_cast<unsigned>(p[i + 2]) : 0u);
        out += B64U[(v >> 18) & 63];
        out += B64U[(v >> 12) & 63];
        if (i + 1 < n) out += B64U[(v >> 6) & 63];
        if (i + 2 < n) out += B64U[v & 63];
    }
    return out;  // base64url is unpadded
}

inline std::string b64u_encode(const std::string& s) {
    return b64u_encode(reinterpret_cast<const unsigned char*>(s.data()), s.size());
}

/** Decodes base64url and, tolerantly, standard base64 — PEM bodies use the
 *  latter and it costs two lines to accept both. Returns false on a bad byte. */
inline bool b64_decode(const std::string& in, std::vector<unsigned char>& out) {
    auto val = [](char c) -> int {
        if (c >= 'A' && c <= 'Z') return c - 'A';
        if (c >= 'a' && c <= 'z') return c - 'a' + 26;
        if (c >= '0' && c <= '9') return c - '0' + 52;
        if (c == '-' || c == '+') return 62;
        if (c == '_' || c == '/') return 63;
        return -1;
    };
    out.clear();
    unsigned buf = 0;
    int bits = 0;
    for (char c : in) {
        if (c == '=' || c == '\n' || c == '\r') continue;
        const int v = val(c);
        if (v < 0) return false;
        buf = (buf << 6) | static_cast<unsigned>(v);
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push_back(static_cast<unsigned char>((buf >> bits) & 0xFF));
        }
    }
    return true;
}

/** Raw 32-byte Ed25519 key out of a PEM SubjectPublicKeyInfo.
 *
 * libsodium wants the bare key; PEM gives DER. An Ed25519 SPKI is a fixed
 * 44 bytes whose first twelve are the algorithm identifier, so the check is a
 * prefix compare rather than a DER parser. */
inline bool ed25519_from_pem(const std::string& pem, unsigned char out[32]) {
    const std::string begin = "-----BEGIN PUBLIC KEY-----";
    const std::string end = "-----END PUBLIC KEY-----";
    const size_t b = pem.find(begin);
    const size_t e = pem.find(end);
    if (b == std::string::npos || e == std::string::npos) return false;
    const std::string body = pem.substr(b + begin.size(), e - b - begin.size());

    std::vector<unsigned char> der;
    if (!b64_decode(body, der) || der.size() != 44) return false;
    static const unsigned char kSpkiPrefix[12] = {
        0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
    };
    for (int i = 0; i < 12; ++i) {
        if (der[static_cast<size_t>(i)] != kSpkiPrefix[i]) return false;
    }
    for (int i = 0; i < 32; ++i) out[i] = der[static_cast<size_t>(12 + i)];
    return true;
}

/** The exact bytes a signature is computed over. */
inline std::string signing_input(const Json& message, const std::string& keyId) {
    Object covered = message.as_object();
    auto sig = covered.find("sig");
    if (sig != covered.end()) {
        // Everything but sig.value survives into the signed payload.
        Object trimmed;
        for (const auto& [k, v] : sig->second.as_object()) {
            if (k != "value") trimmed.emplace(k, v);
        }
        sig->second = Json(std::move(trimmed));
    }
    const std::string payload = canonicalize(Json(std::move(covered)));

    // NOT canonicalised: the JavaScript side builds this with JSON.stringify, so
    // the member order is alg then kid, as written. Canonicalising it here would
    // sort them the same way by luck, and relying on that is how a subtle
    // divergence gets shipped.
    const std::string header = "{\"alg\":\"EdDSA\",\"kid\":" + es_string(keyId) + "}";
    return b64u_encode(header) + "." + b64u_encode(payload);
}

struct VerifyResult {
    bool ok;
    std::string reason;
};

/** Verify a detached JWS. The reason is load-bearing: the conformance vectors
 *  compare it, so "rejected" alone is not a passing answer. */
inline VerifyResult verify_detached(const Json& message, const std::string& publicKeyPem) {
    const Json* sig = message.find("sig");
    const Json* value = sig ? sig->find("value") : nullptr;
    if (!value || !value->is_string()) return {false, "no sig.value"};

    const std::string& v = value->as_string();
    const size_t d1 = v.find('.');
    const size_t d2 = v.find('.', d1 == std::string::npos ? d1 : d1 + 1);
    if (d1 == std::string::npos || d2 == std::string::npos || d2 != d1 + 1) {
        return {false, "not a detached JWS compact serialisation"};
    }
    const std::string protectedB64 = v.substr(0, d1);
    const std::string sigB64 = v.substr(d2 + 1);

    std::vector<unsigned char> headerBytes;
    if (!b64_decode(protectedB64, headerBytes)) return {false, "protected header is not JSON"};
    Json header;
    try {
        header = Json::parse(std::string(headerBytes.begin(), headerBytes.end()));
    } catch (const std::exception&) {
        return {false, "protected header is not JSON"};
    }

    const Json* alg = header.find("alg");
    if (!alg || !alg->is_string() || alg->as_string() != "EdDSA") {
        return {false, "alg is " + (alg && alg->is_string() ? alg->as_string() : std::string("absent")) +
                           ", expected EdDSA"};
    }
    const Json* kid = header.find("kid");
    const Json* keyId = sig->find("keyId");
    if (!kid || !keyId || !kid->is_string() || !keyId->is_string() ||
        kid->as_string() != keyId->as_string()) {
        return {false, "protected kid does not match sig.keyId"};
    }

    unsigned char pk[32];
    if (!ed25519_from_pem(publicKeyPem, pk)) return {false, "public key is not an Ed25519 SPKI"};

    std::vector<unsigned char> sigBytes;
    if (!b64_decode(sigB64, sigBytes) || sigBytes.size() != 64) {
        return {false, "signature does not verify"};
    }

    const std::string tbs = signing_input(message, keyId->as_string());
    const int rc = crypto_sign_verify_detached(
        sigBytes.data(), reinterpret_cast<const unsigned char*>(tbs.data()), tbs.size(), pk);
    return rc == 0 ? VerifyResult{true, "signature verifies"}
                   : VerifyResult{false, "signature does not verify"};
}

}  // namespace bpi
