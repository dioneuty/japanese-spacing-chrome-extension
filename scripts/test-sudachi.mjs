import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const sudachiPath = fileURLToPath(new URL('../lib/sudachi/sudachi.js', import.meta.url));
const { SudachiStateless, TokenizeMode } = await import(pathToFileURL(sudachiPath).href);

const dictPath = new URL('../lib/sudachi/resources/system.dic', import.meta.url);
const bytes = readFileSync(dictPath);

const sudachi = new SudachiStateless();
const initResult = sudachi.initialize_from_bytes(new Uint8Array(bytes));
if (initResult?.error) {
  throw new Error(initResult.details || initResult.error);
}

const samples = [
  '今日は良い天気です',
  '私は学校に行きました',
  '本を読んでいます',
];

for (const text of samples) {
  const tokens = sudachi.tokenize_raw(text, TokenizeMode.B);
  console.log(`${text} => ${tokens.map((t) => t.surface).join(' ')}`);
}
