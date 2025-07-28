/**
 * Logging utility for Grafana plugins.
 * 
 * This logger is designed to be completely silent by default to avoid
 * console logging violations during plugin validation.
 * 
 * Logging can be enabled by setting localStorage.setItem('CLI-LLM-debug', 'true')
 * in the browser console for debugging purposes.
 */

export interface Logger {
  log: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class PluginLogger implements Logger {
  private prefix = '[CLI-LLM]';
  
  // Check if debug mode is enabled via localStorage
  private isDebugEnabled(): boolean {
    try {
      return typeof window !== 'undefined' && 
             window.localStorage && 
             window.localStorage.getItem('CLI-LLM-debug') === 'true';
    } catch {
      return false;
    }
  }

  log(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.info(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(`${this.prefix} ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.error(`${this.prefix} ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug(`${this.prefix} ${message}`, ...args);
    }
  }
}

// Export a singleton instance
export const logger: Logger = new PluginLogger();

// For backward compatibility and easier migration
export default logger;
