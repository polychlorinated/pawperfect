// server/utils.ts
// General utilities shared by server code without dragging in dev-only dependencies

/**
 * Logs a timestamped message with optional source.
 */
export function log(message: string, source = 'server'): void {
  const time = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${time} [${source}] ${message}`);
}