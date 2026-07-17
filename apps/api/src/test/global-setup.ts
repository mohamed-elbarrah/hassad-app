import { execSync } from 'child_process';
import * as path from 'path';

export async function setup(): Promise<void> {
  process.env.DATABASE_URL =
    'postgresql://hassad:hassad_dev_password@localhost:5432/hassad_e2e';

  console.log('\n[global-setup] Resetting test database...');

  execSync('npx prisma migrate reset --force', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'inherit',
  });

  console.log('[global-setup] Database reset + seed complete.\n');
}

export async function teardown(): Promise<void> {
  // nothing to do — next run wipes the test DB
}
