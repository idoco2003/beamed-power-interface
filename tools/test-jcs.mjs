// SPDX-License-Identifier: Apache-2.0
// Checks tools/lib/jcs.mjs against the worked examples in RFC 8785.
import { canonicalize } from './lib/jcs.mjs';

let fail = 0;
const check = (name, got, want) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}`);
  if (!ok) { console.log('        got :', got); console.log('        want:', want); }
};

// RFC 8785 section 3.2.3, the key-ordering example, with every tricky key pinned
// by code point so no editor or normalisation step can silently change the data.
//
// The ordering this vector exists to prove: U+FB33 (0xFB33) sorts AFTER the emoji,
// whose first UTF-16 code unit is the high surrogate 0xD83D. Sorting by code point
// instead of code unit would put U+1F602 (0x1F602) last and get this backwards.
const K = {
  nul:   String.fromCodePoint(0x0000),
  cr:    String.fromCodePoint(0x000D),
  one:   '1',
  odia:  String.fromCodePoint(0x00F6),  // ö
  euro:  String.fromCodePoint(0x20AC),  // €
  emoji: String.fromCodePoint(0x1F602), // face with tears of joy
  dalet: String.fromCodePoint(0xFB33),  // precomposed, NOT ד + dagesh
};
const obj = {};
obj[K.euro]  = 'Euro Sign';
obj[K.cr]    = 'Carriage Return';
obj[K.dalet] = 'Hebrew Letter Dalet With Dagesh';
obj[K.one]   = 'One';
obj[K.emoji] = 'Emoji: Smiley';
obj[K.nul]   = 'Control';
obj[K.odia]  = 'Latin Small Letter O With Diaeresis';

const want = '{'
  + '"' + '\\u0000' + '":"Control",'
  + '"' + '\\r' + '":"Carriage Return",'
  + '"1":"One",'
  + '"' + K.odia + '":"Latin Small Letter O With Diaeresis",'
  + '"' + K.euro + '":"Euro Sign",'
  + '"' + K.emoji + '":"Emoji: Smiley",'
  + '"' + K.dalet + '":"Hebrew Letter Dalet With Dagesh"'
  + '}';
check('RFC 8785 3.2.3 key ordering', canonicalize(obj), want);

// ECMAScript Number::toString, which RFC 8785 section 3.2.2.3 adopts wholesale.
for (const [v, want] of [[0, '0'], [-0, '0'], [1, '1'], [-1, '-1'], [0.1, '0.1'],
                         [1e30, '1e+30'], [1e-7, '1e-7'], [1 / 3, '0.3333333333333333'],
                         [9007199254740992, '9007199254740992'], [1e21, '1e+21']]) {
  check('number ' + want, canonicalize(v), want);
}

check('nested + array', canonicalize({ b: [1, { d: 2, c: 3 }], a: null }),
  '{"a":null,"b":[1,{"c":3,"d":2}]}');
check('undefined dropped', canonicalize({ a: 1, b: undefined }), '{"a":1}');

console.log(fail ? '\n' + fail + ' failure(s)' : '\nJCS: all vectors pass');
process.exit(fail ? 1 : 0);
