/**
 * Structured Logger
 * Enterprise-grade JSON logger with redaction and levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
}

export interface LoggerConfig {
    level?: LogLevel;
    redactKeys?: string[];
    json?: boolean;
    transports?: ((entry: LogEntry) => void)[]; // Support custom transports (file, cloud)
}

const LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export class Logger {
    private config: Required<LoggerConfig>;

    constructor(config: LoggerConfig = {}) {
        this.config = {
            level: config.level ?? 'info',
            redactKeys: config.redactKeys ?? ['password', 'token', 'apiKey', 'secret', 'creditCard'],
            json: config.json ?? true, // Default to JSON for enterprise
            transports: config.transports ?? [this.consoleTransport.bind(this)]
        };
    }

    debug(message: string, context?: Record<string, any>) {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, any>) {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context);
    }

    error(message: string, error?: Error, context?: Record<string, any>) {
        this.log('error', message, { ...context, error });
    }

    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        if (LEVELS[level] < LEVELS[this.config.level]) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: context ? this.redact(context) : undefined
        };

        // Extract error object for special handling
        if (context && context.error instanceof Error) {
            entry.error = context.error;
            // Clean context of the error object to avoid duplication if printed
            if (entry.context) delete entry.context.error;
        }

        this.config.transports.forEach(transport => transport(entry));
    }

    private redact(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => this.redact(item));
        }

        const copy: any = {};
        for (const key in obj) {
            if (this.config.redactKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                copy[key] = '[REDACTED]';
            } else {
                copy[key] = this.redact(obj[key]);
            }
        }
        return copy;
    }

    private consoleTransport(entry: LogEntry) {
        if (this.config.json) {
            console.log(JSON.stringify(entry));
        } else {
            const time = entry.timestamp.split('T')[1].replace('Z', '');
            const level = entry.level.toUpperCase().padEnd(5);
            console.log(`[${time}] ${level} ${entry.message}`, entry.context || '', entry.error || '');
        }
    }
}

// Default global logger
export const logger = new Logger();
export default Logger;
