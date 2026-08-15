import { cp, mkdir, writeFile } from 'node:fs/promises';
await mkdir('dist/server', { recursive: true });
await mkdir('dist/client', { recursive: true });
await cp('dist/assets', 'dist/client/assets', { recursive: true });
await cp('dist/images', 'dist/client/images', { recursive: true });
await cp('dist/index.html', 'dist/client/index.html');
await writeFile('dist/server/index.js', `export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n`);
