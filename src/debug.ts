/**
 * Debug logging for rserve-ts.
 *
 * In Node: set RSERVE_TS_DEBUG env var.
 * In browser: set localStorage.setItem('RSERVE_TS_DEBUG', '*')
 *
 * Values: '*' for all tags, or comma-separated tags: 'ocap,parse,call'
 *
 * Tags:
 *   - ocap: OCAP function wrapping (promisify transform)
 *   - parse: schema parsing of OCAP results
 *   - call: individual OCAP function calls and results
 */

function getDebugConfig(): string {
  try {
    if (typeof process !== "undefined" && process.env?.RSERVE_TS_DEBUG) {
      return process.env.RSERVE_TS_DEBUG;
    }
  } catch {
    // process may not be available in browser
  }
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("RSERVE_TS_DEBUG") ?? "";
    }
  } catch {
    // localStorage may not be available
  }
  return "";
}

export function rtsDebugEnabled(tag: string): boolean {
  const config = getDebugConfig();
  if (!config) return false;
  if (config === "*") return true;
  return config.split(",").includes(tag);
}

export function rtsDebug(tag: string, ...args: unknown[]): void {
  if (!rtsDebugEnabled(tag)) return;
  console.log(`[rserve-ts:${tag}]`, ...args);
}
