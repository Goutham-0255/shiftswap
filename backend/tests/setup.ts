import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Runs once before all tests: a brand-new SQLite test database built from the migrations.
// It is a separate file (prisma/test.db), so tests never touch your dev data.
export default function setup() {
  fs.rmSync(path.join(__dirname, '../prisma/test.db'), { force: true });
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  });
}
