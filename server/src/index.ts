import { createApp } from './app';
import { config } from './config/env';

/**
 * Server entry point.
 *
 * Builds the Express app via `createApp()` and starts listening. Also wires
 * graceful-shutdown handlers so SIGINT/SIGTERM close the HTTP server cleanly
 * instead of dropping in-flight requests.
 */

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[server] TaskFlow API listening on http://localhost:${config.port} (${config.nodeEnv})`,
  );
});

function shutdown(signal: NodeJS.Signals): void {
  // eslint-disable-next-line no-console
  console.log(`[server] Received ${signal}, shutting down...`);
  server.close((err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('[server] Error during shutdown:', err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
