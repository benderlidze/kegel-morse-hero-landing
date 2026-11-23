// Real first/last change dates of content files from git (uncommitted edits count as today).
// Used for translated articles' datePublished/dateModified and sitemap <lastmod> instead of hard-coded dates.
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const first = {};
const last = {};
try {
  const run = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  let date = '';
  for (const line of run('git log --format=@%cs --name-only -- content').split('\n')) {
    if (line.startsWith('@')) { date = line.slice(1); continue; }
    const file = line.trim();
    if (!file) continue;
    if (!last[file]) last[file] = date; // newest commit first
    first[file] = date; // keeps overwriting -> oldest commit
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const line of run('git status --porcelain -- content').split('\n')) {
    const file = line.slice(3).trim().replace(/^"|"$/g, '');
    if (!file) continue;
    last[file] = today;
    if (!first[file]) first[file] = today;
  }
} catch { /* not a git checkout: callers fall back to their defaults */ }

export function gitDates(file) {
  const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
  return { first: first[rel], last: last[rel] };
}
