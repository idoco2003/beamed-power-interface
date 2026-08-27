// SPDX-License-Identifier: Apache-2.0
//
// RFC 8785 JSON Canonicalization Scheme.
//
// A signature is only as good as the bytes it was computed over. Two
// implementations that serialise the same object differently produce different
// signatures and will accuse each other of forgery, so the canonicalisation is
// an interoperability surface rather than an implementation detail.
//
// Three rules do the work:
//   - object keys sorted by UTF-16 code unit, which is not the same as sorting
//     by code point once you leave the BMP
//   - numbers serialised as ECMAScript Number::toString
//   - no insignificant whitespace, and the RFC 8259 string escapes only
//
// JavaScript gives us the number rule for free, because Number::toString IS the
// ECMAScript rule. That is the strongest argument for canonicalising here rather
// than in Python, where matching it takes real work.

const ESCAPES = {
  '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r',
  '"': '\\"', '\\': '\\\\',
};

function str(s) {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ESCAPES[ch]) out += ESCAPES[ch];
    else if (c < 0x20) out += '\\u' + c.toString(16).padStart(4, '0');
    else out += ch;
  }
  return out + '"';
}

/** Sort by UTF-16 code unit, which is what RFC 8785 section 3.2.3 specifies.
 *  JavaScript's default string comparison already does exactly this. */
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function canonicalize(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('NaN and Infinity are not JSON');
    // Number::toString, except that negative zero serialises as 0.
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (typeof value === 'string') return str(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort(byCodeUnit);
    return '{' + keys.map((k) => str(k) + ':' + canonicalize(value[k])).join(',') + '}';
  }
  throw new TypeError('cannot canonicalize ' + typeof value);
}
