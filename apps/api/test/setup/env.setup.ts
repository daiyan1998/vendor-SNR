import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Loads .env.test (a developer's local, gitignored test-DB config) without
// overriding any env var already set — CI sets DATABASE_URL/NODE_ENV itself
// and never checks out a .env.test file, so this must be a no-op there.
const envPath = path.resolve(import.meta.dirname, '../../.env.test');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (process.env[key] !== undefined) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}
