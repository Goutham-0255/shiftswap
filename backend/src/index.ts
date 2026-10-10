import { createApp } from './app';
import { env } from './config/env';
import { seedIfEmpty } from './db/seed';

async function main() {
  await seedIfEmpty();

  const server = createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  // shutdown: finish in-flight requests before the process exits.
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

main().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
