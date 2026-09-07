import { execSync, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Docker Guardian automatically checks if PostgreSQL/Redis containers are running.
 * If stopped, it automatically launches Docker Desktop (on macOS) and runs docker compose up -d.
 */
export async function ensureInfrastructureRunning(): Promise<boolean> {
  const rootDir = path.resolve(__dirname, '../../');
  const composePath = path.join(rootDir, 'docker-compose.yml');

  if (!fs.existsSync(composePath)) {
    return false;
  }

  console.log('[Docker Guardian] Verifying background infrastructure services...');

  // 1. Check if Docker command is available
  try {
    execSync('docker --version', { stdio: 'ignore' });
  } catch {
    console.warn('[Docker Guardian] Docker CLI not found. Running in standalone fallback mode.');
    return false;
  }

  // 2. Check if Docker Daemon is running
  let isDaemonRunning = false;
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 3000 });
    isDaemonRunning = true;
  } catch {
    isDaemonRunning = false;
  }

  // 3. If Docker daemon is stopped, attempt to auto-launch Docker Desktop on macOS
  if (!isDaemonRunning) {
    if (process.platform === 'darwin') {
      console.log('⚡ [Docker Guardian] Docker Desktop is stopped. Automatically launching Docker Desktop in background...');
      try {
        exec('open -a Docker');
      } catch (err: any) {
        console.warn('[Docker Guardian] Could not launch Docker automatically:', err.message);
      }

      // Poll until Docker is ready (up to 20 seconds)
      const maxWaitSeconds = 20;
      for (let i = 0; i < maxWaitSeconds; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          execSync('docker info', { stdio: 'ignore', timeout: 3000 });
          isDaemonRunning = true;
          console.log('✅ [Docker Guardian] Docker Desktop daemon is now ready!');
          break;
        } catch {
          // Keep waiting
        }
      }
    }
  }

  if (!isDaemonRunning) {
    console.warn('[Docker Guardian] Docker daemon could not be started in time. Proceeding with fallback mode.');
    return false;
  }

  // 4. Run docker compose up -d automatically
  try {
    console.log('[Docker Guardian] Ensuring PostgreSQL, Redis, and Elasticsearch containers are active...');
    execSync('docker compose up -d', { cwd: rootDir, stdio: 'ignore', timeout: 15000 });
    console.log('✅ [Docker Guardian] All Docker services (PostgreSQL, Redis, Elasticsearch) are up and running!');
    return true;
  } catch (err: any) {
    console.warn('[Docker Guardian] docker compose up warning:', err.message);
    return false;
  }
}
