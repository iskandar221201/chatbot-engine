import { describe, it, expect, vi } from 'vitest';
import { MiddlewareManager } from '../src/lib/middleware';
import { Logger } from '../src/lib/logger';
import { AppError, ValidationError } from '../src/lib/errors';
import type { AssistantResult } from '../src/types';

describe('MiddlewareManager', () => {
    it('should modify request context', async () => {
        const manager = new MiddlewareManager();

        manager.useRequest(async (ctx, next) => {
            ctx.query = ctx.query + ' appended';
            await next();
        });

        const ctx = await manager.executeRequest('original');
        expect(ctx.query).toBe('original appended');
    });

    it('should modify response result', async () => {
        const manager = new MiddlewareManager();

        manager.useResponse(async (result, ctx, next) => {
            result.intent = 'modified';
            await next();
        });

        const initialResult: AssistantResult = {
            results: [],
            intent: 'original',
            entities: {},
            confidence: 0
        };

        const finalResult = await manager.executeResponse(
            initialResult,
            { query: '', originalQuery: '', stop: false }
        );

        expect(finalResult.intent).toBe('modified');
    });

    it('should handle middleware errors gracefully', async () => {
        const manager = new MiddlewareManager();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        manager.useRequest(async () => {
            throw new Error('Middleware failed');
        });

        // Should not throw
        await manager.executeRequest('test');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('Logger', () => {
    it('should redact sensitive information', () => {
        const spy = vi.fn();
        const logger = new Logger({ transports: [spy], json: true });

        logger.info('User login', { password: 'secret123', email: 'test@example.com' });

        const entry = spy.mock.calls[0][0];
        expect(entry.context.password).toBe('[REDACTED]');
        expect(entry.context.email).toBe('test@example.com');
    });

    it('should respect log levels', () => {
        const spy = vi.fn();
        const logger = new Logger({ transports: [spy], level: 'error' });

        logger.info('info message'); // Should be ignored
        logger.error('error message');

        expect(spy).toBeCalledTimes(1);
        expect(spy.mock.calls[0][0].message).toBe('error message');
    });
});

describe('AppError', () => {
    it('should create standardized errors', () => {
        const err = new ValidationError('Invalid input', { field: 'email' });

        expect(err).toBeInstanceOf(Error);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.statusCode).toBe(400);
        expect(err.metadata?.field).toBe('email');
    });
});
