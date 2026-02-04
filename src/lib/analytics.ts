/**
 * Analytics & Telemetry System
 * Enterprise-grade event tracking and hooks
 */

export type AnalyticsEventType =
    | 'search'
    | 'lead_captured'
    | 'no_result'
    | 'error'
    | 'feedback'
    | 'sales_conversion'
    | 'performance';

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    payload: any;
    timestamp: number;
    sessionId?: string;
    metadata?: Record<string, any>;
}

export type AnalyticsHandler = (event: AnalyticsEvent) => void;

export interface AnalyticsConfig {
    enabled?: boolean;
    logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
    sampleRate?: number; // 0.0 to 1.0 (default 1.0)
}

export class AnalyticsEngine {
    private handlers: Set<AnalyticsHandler> = new Set();
    private config: Required<AnalyticsConfig>;
    private metrics: Map<string, number> = new Map();

    constructor(config: AnalyticsConfig = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            logger: config.logger ?? console.log,
            sampleRate: config.sampleRate ?? 1.0
        };
    }

    /**
     * Subscribe to analytics events
     * Useful for hooking into Google Analytics, Mixpanel, Datadog, etc.
     */
    onEvent(handler: AnalyticsHandler): () => void {
        this.handlers.add(handler);
        // Return unsubscribe function
        return () => this.handlers.delete(handler);
    }

    /**
     * Track an event
     */
    track(type: AnalyticsEventType, payload: any, sessionId?: string, metadata?: Record<string, any>): void {
        if (!this.config.enabled) return;

        // Sampling check
        if (Math.random() > this.config.sampleRate) return;

        const event: AnalyticsEvent = {
            type,
            payload,
            timestamp: Date.now(),
            sessionId,
            metadata
        };

        // Update internal metrics (lightweight aggregation)
        this.updateInternalMetrics(type);

        // Broadcast to handlers
        // We use setTimeout to not block the main execution thread
        setTimeout(() => {
            try {
                this.handlers.forEach(handler => handler(event));
            } catch (err) {
                // Prevent analytics capabilities from crashing the app
                this.config.logger('Analytics handler error', 'error');
            }
        }, 0);
    }

    /**
     * Get aggregated internal metrics
     */
    getMetrics(): Record<string, number> {
        return Object.fromEntries(this.metrics);
    }

    /**
     * Reset internal metrics
     */
    resetMetrics(): void {
        this.metrics.clear();
    }

    private updateInternalMetrics(type: AnalyticsEventType): void {
        const current = this.metrics.get(type) || 0;
        this.metrics.set(type, current + 1);
    }
}

export const defaultAnalytics = new AnalyticsEngine();
export default AnalyticsEngine;
