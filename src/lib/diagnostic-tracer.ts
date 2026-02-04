/**
 * Diagnostic Tracer
 * Deep observability for the search pipeline.
 * Captures timings, internal counts, and logic branches.
 */

export interface DiagnosticEvent {
    id: string;
    timestamp: number;
    duration?: number;
    meta?: Record<string, any>;
}

export class DiagnosticTracer {
    private events: DiagnosticEvent[] = [];
    private startTime: number = 0;
    private activePoints: Map<string, number> = new Map();

    constructor() {
        this.startTime = performance.now();
    }

    /**
     * Start a timed operation point
     */
    public start(id: string): void {
        this.activePoints.set(id, performance.now());
    }

    /**
     * Stop a timed operation point and record it
     */
    public stop(id: string, meta?: Record<string, any>): void {
        const start = this.activePoints.get(id);
        if (start) {
            this.events.push({
                id,
                timestamp: start,
                duration: performance.now() - start,
                meta
            });
            this.activePoints.delete(id);
        }
    }

    /**
     * Record a simple point event
     */
    public record(id: string, meta?: Record<string, any>): void {
        this.events.push({
            id,
            timestamp: performance.now(),
            meta
        });
    }

    /**
     * Get all recorded events
     */
    public getEvents(): DiagnosticEvent[] {
        return [...this.events];
    }

    /**
     * Reset the tracer
     */
    public reset(): void {
        this.events = [];
        this.activePoints.clear();
        this.startTime = performance.now();
    }
}

export default DiagnosticTracer;
