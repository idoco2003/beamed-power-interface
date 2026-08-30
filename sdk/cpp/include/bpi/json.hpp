// SPDX-License-Identifier: Apache-2.0
//
// A JSON value and parser, small enough to read in one sitting.
//
// Written rather than vendored on purpose. The repository carries no committed
// dependencies, and more importantly RFC 8785 needs control over how numbers are
// re-serialised — a general-purpose JSON library will hand back a double and
// print it its own way, which is precisely the interoperability surface this SDK
// exists to test. Owning the parser means owning the round trip.
//
// Object members are held in a std::map ordered by UTF-16 code unit, so a value
// is in canonical key order the moment it is parsed. See jcs.hpp for why that
// ordering is not the same as sorting the UTF-8 bytes.
#pragma once

#include <cstdint>
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

namespace bpi {

/** UTF-8 in, UTF-16 out. Needed because RFC 8785 orders keys by UTF-16 code
 *  unit, and a supplementary character's first code unit is a high surrogate
 *  (0xD800..0xDBFF) which sorts BELOW U+E000..U+FFFF — the opposite of the code
 *  point order that comparing UTF-8 bytes would give. */
inline std::u16string utf8_to_utf16(const std::string& s) {
    std::u16string out;
    out.reserve(s.size());
    for (size_t i = 0; i < s.size();) {
        unsigned char c = static_cast<unsigned char>(s[i]);
        char32_t cp;
        int len;
        if (c < 0x80) { cp = c; len = 1; }
        else if ((c & 0xE0) == 0xC0) { cp = c & 0x1F; len = 2; }
        else if ((c & 0xF0) == 0xE0) { cp = c & 0x0F; len = 3; }
        else if ((c & 0xF8) == 0xF0) { cp = c & 0x07; len = 4; }
        else { cp = 0xFFFD; len = 1; }
        if (i + len > s.size()) { cp = 0xFFFD; len = 1; }
        for (int k = 1; k < len; ++k) cp = (cp << 6) | (static_cast<unsigned char>(s[i + k]) & 0x3F);
        i += len;
        if (cp >= 0x10000) {
            cp -= 0x10000;
            out.push_back(static_cast<char16_t>(0xD800 + (cp >> 10)));
            out.push_back(static_cast<char16_t>(0xDC00 + (cp & 0x3FF)));
        } else {
            out.push_back(static_cast<char16_t>(cp));
        }
    }
    return out;
}

/** Key ordering for RFC 8785 section 3.2.3. */
struct KeyLess {
    bool operator()(const std::string& a, const std::string& b) const {
        return utf8_to_utf16(a) < utf8_to_utf16(b);
    }
};

class Json;
using Object = std::map<std::string, Json, KeyLess>;
using Array = std::vector<Json>;

class Json {
public:
    enum class Type { Null, Bool, Number, String, Array, Object };

    Json() : type_(Type::Null) {}
    Json(std::nullptr_t) : type_(Type::Null) {}
    Json(bool b) : type_(Type::Bool), bool_(b) {}
    Json(double d) : type_(Type::Number), num_(d) {}
    Json(std::string s) : type_(Type::String), str_(std::move(s)) {}
    Json(const char* s) : type_(Type::String), str_(s) {}
    Json(Array a) : type_(Type::Array), arr_(std::move(a)) {}
    Json(Object o) : type_(Type::Object), obj_(std::move(o)) {}

    Type type() const { return type_; }
    bool is_null() const { return type_ == Type::Null; }
    bool is_object() const { return type_ == Type::Object; }
    bool is_string() const { return type_ == Type::String; }
    bool is_number() const { return type_ == Type::Number; }

    bool as_bool() const { return bool_; }
    double as_number() const { return num_; }
    const std::string& as_string() const { return str_; }
    const Array& as_array() const { return arr_; }
    const Object& as_object() const { return obj_; }
    Object& as_object() { return obj_; }

    /** Member lookup that never throws. Returns nullptr when absent, which is
     *  what a validator wants: a missing field is a verdict, not an exception. */
    const Json* find(const std::string& key) const {
        if (type_ != Type::Object) return nullptr;
        auto it = obj_.find(key);
        return it == obj_.end() ? nullptr : &it->second;
    }

    /** Parse. Throws std::runtime_error with an offset on malformed input. */
    static Json parse(const std::string& text);

private:
    Type type_;
    bool bool_ = false;
    double num_ = 0;
    std::string str_;
    Array arr_;
    Object obj_;

    friend class Parser;
};

class Parser {
public:
    explicit Parser(const std::string& s) : s_(s) {}

    Json parse() {
        ws();
        Json v = value();
        ws();
        if (i_ != s_.size()) fail("trailing content");
        return v;
    }

private:
    const std::string& s_;
    size_t i_ = 0;

    [[noreturn]] void fail(const std::string& why) const {
        throw std::runtime_error("json: " + why + " at offset " + std::to_string(i_));
    }
    void ws() {
        while (i_ < s_.size() && (s_[i_] == ' ' || s_[i_] == '\t' || s_[i_] == '\n' || s_[i_] == '\r')) ++i_;
    }
    char peek() const { return i_ < s_.size() ? s_[i_] : '\0'; }
    bool lit(const char* w) {
        size_t n = std::char_traits<char>::length(w);
        if (s_.compare(i_, n, w) != 0) return false;
        i_ += n;
        return true;
    }

    Json value() {
        switch (peek()) {
            case '{': return object();
            case '[': return array();
            case '"': return Json(string());
            case 't': if (lit("true")) return Json(true); fail("expected true");
            case 'f': if (lit("false")) return Json(false); fail("expected false");
            case 'n': if (lit("null")) return Json(nullptr); fail("expected null");
            default: return number();
        }
    }

    Json object() {
        ++i_;  // '{'
        Object o;
        ws();
        if (peek() == '}') { ++i_; return Json(std::move(o)); }
        for (;;) {
            ws();
            if (peek() != '"') fail("expected a key");
            std::string k = string();
            ws();
            if (peek() != ':') fail("expected ':'");
            ++i_;
            ws();
            o.emplace(std::move(k), value());
            ws();
            if (peek() == ',') { ++i_; continue; }
            if (peek() == '}') { ++i_; return Json(std::move(o)); }
            fail("expected ',' or '}'");
        }
    }

    Json array() {
        ++i_;  // '['
        Array a;
        ws();
        if (peek() == ']') { ++i_; return Json(std::move(a)); }
        for (;;) {
            ws();
            a.push_back(value());
            ws();
            if (peek() == ',') { ++i_; continue; }
            if (peek() == ']') { ++i_; return Json(std::move(a)); }
            fail("expected ',' or ']'");
        }
    }

    void push_utf8(std::string& out, char32_t cp) {
        if (cp < 0x80) out += static_cast<char>(cp);
        else if (cp < 0x800) {
            out += static_cast<char>(0xC0 | (cp >> 6));
            out += static_cast<char>(0x80 | (cp & 0x3F));
        } else if (cp < 0x10000) {
            out += static_cast<char>(0xE0 | (cp >> 12));
            out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
            out += static_cast<char>(0x80 | (cp & 0x3F));
        } else {
            out += static_cast<char>(0xF0 | (cp >> 18));
            out += static_cast<char>(0x80 | ((cp >> 12) & 0x3F));
            out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
            out += static_cast<char>(0x80 | (cp & 0x3F));
        }
    }

    unsigned hex4() {
        if (i_ + 4 > s_.size()) fail("truncated \\u escape");
        unsigned v = 0;
        for (int k = 0; k < 4; ++k) {
            char c = s_[i_ + k];
            v <<= 4;
            if (c >= '0' && c <= '9') v |= static_cast<unsigned>(c - '0');
            else if (c >= 'a' && c <= 'f') v |= static_cast<unsigned>(c - 'a' + 10);
            else if (c >= 'A' && c <= 'F') v |= static_cast<unsigned>(c - 'A' + 10);
            else fail("bad hex in \\u escape");
        }
        i_ += 4;
        return v;
    }

    std::string string() {
        ++i_;  // opening quote
        std::string out;
        for (;;) {
            if (i_ >= s_.size()) fail("unterminated string");
            char c = s_[i_];
            if (c == '"') { ++i_; return out; }
            if (c != '\\') { out += c; ++i_; continue; }
            ++i_;
            switch (peek()) {
                case '"': out += '"'; ++i_; break;
                case '\\': out += '\\'; ++i_; break;
                case '/': out += '/'; ++i_; break;
                case 'b': out += '\b'; ++i_; break;
                case 'f': out += '\f'; ++i_; break;
                case 'n': out += '\n'; ++i_; break;
                case 'r': out += '\r'; ++i_; break;
                case 't': out += '\t'; ++i_; break;
                case 'u': {
                    ++i_;
                    unsigned u = hex4();
                    // Surrogate pairs are rejoined here, so the in-memory string
                    // is well-formed UTF-8 and re-serialisation is symmetric.
                    if (u >= 0xD800 && u <= 0xDBFF && i_ + 1 < s_.size() && s_[i_] == '\\' && s_[i_ + 1] == 'u') {
                        size_t save = i_;
                        i_ += 2;
                        unsigned lo = hex4();
                        if (lo >= 0xDC00 && lo <= 0xDFFF) {
                            push_utf8(out, 0x10000 + ((u - 0xD800) << 10) + (lo - 0xDC00));
                            break;
                        }
                        i_ = save;
                    }
                    push_utf8(out, u);
                    break;
                }
                default: fail("unknown escape");
            }
        }
    }

    Json number() {
        size_t start = i_;
        if (peek() == '-') ++i_;
        while (i_ < s_.size() && ((s_[i_] >= '0' && s_[i_] <= '9') || s_[i_] == '.' ||
                                  s_[i_] == 'e' || s_[i_] == 'E' || s_[i_] == '+' || s_[i_] == '-')) ++i_;
        if (i_ == start) fail("expected a value");
        return Json(std::stod(s_.substr(start, i_ - start)));
    }
};

inline Json Json::parse(const std::string& text) { return Parser(text).parse(); }

}  // namespace bpi
