/**
 * Middleware Pipeline
 * Interceptor pattern for extreme extensibility.
 * Inspired by Axios interceptors and Express middleware.
 */

import type { AssistantResult } from '../types';

export interface MiddlewareContext {
    query: string;
    originalQuery: string;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    stop: boolean; // Flag to stop processing
}

export type RequestMiddleware = (
    ctx: MiddlewareContext,
    next: () => Promise<void>
) => Promise<void> | void;

export type ResponseMiddleware = (
    result: AssistantResult,
    ctx: MiddlewareContext,
    next: () => Promise<void>
) => Promise<void> | void;

export class MiddlewareManager {
    private requestMiddlewares: RequestMiddleware[] = [];
    private responseMiddlewares: ResponseMiddleware[] = [];

    /**
     * Add a middleware to intercept and modify the REQUEST before processing
     */
    useRequest(middleware: RequestMiddleware): void {
        this.requestMiddlewares.push(middleware);
    }

    /**
     * Add a middleware to intercept and modify the RESPONSE before returning
     */
    useResponse(middleware: ResponseMiddleware): void {
        this.responseMiddlewares.push(middleware);
    }

    /**
     * Execute Request Pipeline
     */
    async executeRequest(query: string, context?: Record<string, any>): Promise<MiddlewareContext> {
        const ctx: MiddlewareContext = {
            query,
            originalQuery: query,
            context: context || {},
            metadata: {},
            stop: false
        };

        const runner = async (index: number) => {
            if (index >= this.requestMiddlewares.length || ctx.stop) return;

            const middleware = this.requestMiddlewares[index];
            try {
                await middleware(ctx, async () => {
                    await runner(index + 1);
                });
            } catch (err) {
                console.error(`Middleware Error (Request #${index}):`, err);
                // Continue pipeline despite error? For now, yes, to avoid total crash.
                await runner(index + 1);
            }
        };

        await runner(0);
        return ctx;
    }

    /**
     * Execute Response Pipeline
     */
    async executeResponse(result: AssistantResult, ctx: MiddlewareContext): Promise<AssistantResult> {
        const runner = async (index: number) => {
            if (index >= this.responseMiddlewares.length) return;

            const middleware = this.responseMiddlewares[index];
            try {
                await middleware(result, ctx, async () => {
                    await runner(index + 1);
                });
            } catch (err) {
                console.error(`Middleware Error (Response #${index}):`, err);
                await runner(index + 1);
            }
        };

        await runner(0);
        return result;
    }
}

export default MiddlewareManager;
