import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const rulesPath = fileURLToPath(new URL('../lib/sudachi/bunsetsu-rules.js', import.meta.url));
const { SudachiStateless, TokenizeMode } = await import('sudachi-wasm333/sudachi.js');
const { groupIntoBunsetsu } = await import(pathToFileURL(rulesPath).href);

const dictPath = new URL('../lib/sudachi/resources/system.dic', import.meta.url);
const bytes = readFileSync(dictPath);

const sudachi = new SudachiStateless();
sudachi.initialize_from_bytes(new Uint8Array(bytes));

const cases = [
  ['今日は良い天気です', '今日は 良い 天気です'],
  ['私は学校に行きました', '私は 学校に 行きました'],
  ['本を読んでいます', '本を 読んで います'],
  ['予想している', '予想して いる'],
  ['入っていない', '入って いない'],
  ['得るとした', '得ると した'],
  ['なり得るとした', 'なり得ると した'],
  ['影響したとみられる', '影響したと みられる'],
  ['途牛によると', '途牛に よると'],
  ['東京タワーに行きたい', '東京タワーに 行き たい'],
  ['日本語を勉強することが好きです', '日本語を 勉強する ことが 好きです'],
  ['彼は来ないでしょう', '彼は 来ないでしょう'],
  ['雨が降っている', '雨が 降って いる'],
  ['早く帰りたいと思う', '早く 帰り たいと 思う'],
  ['とても楽しかった', 'とても 楽しかった'],
  ['本当に大変だ', '本当に 大変だ'],
  ['「こんにちは」と言った', '「こんにちは」と 言った'],
  ['北京市にある', '北京市に ある'],
  ['事態になり', '事態に なり'],
  ['確かにいるだろう', '確かに いるだろう'],
];

let failed = 0;
for (const [input, expected] of cases) {
  const tokens = sudachi.tokenize_raw(input, TokenizeMode.B);
  const actual = groupIntoBunsetsu(tokens);
  const ok = actual === expected;
  if (!ok) {
    failed += 1;
  }
  console.log(`${ok ? 'OK' : 'NG'} ${input}`);
  console.log(`  expected: ${expected}`);
  console.log(`  actual:   ${actual}`);
}

process.exit(failed > 0 ? 1 : 0);
