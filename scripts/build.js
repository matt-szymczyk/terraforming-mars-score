import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const source = resolve('site');
const output = resolve('dist');
const names = (await readdir(source)).sort();
const files = new Map();
const hash = createHash('sha256');
for (const name of names) {
  const content = await readFile(resolve(source, name));
  files.set(name, content);
  hash.update(name).update(content);
}
const version = hash.digest('hex').slice(0, 16);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [name, content] of files) {
  const built = name === 'sw.js' ? content.toString().replace('__BUILD_VERSION__', version) : content;
  await writeFile(resolve(output, name), built);
}
await writeFile(resolve(output, '.nojekyll'), '');
console.log('Built ' + names.length + ' static assets. Offline cache version: ' + version);
