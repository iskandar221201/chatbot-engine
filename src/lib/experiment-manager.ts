/**
 * Experiment Manager (A/B Testing Engine)
 * Data-driven sales optimization via rapid experimentation.
 */

export interface Experiment {
    id: string;
    variants: string[]; // e.g., ['control', 'aggressive', 'friendly']
    weights?: number[]; // e.g., [0.5, 0.25, 0.25]
}

export class ExperimentManager {
    private experiments: Map<string, Experiment> = new Map();
    private assignments: Map<string, string> = new Map(); // ExpId -> Variant
    private userId: string;

    constructor(userId?: string) {
        // Generate or use existing userId for consistent assignment
        this.userId = userId || this.generateUserId();
    }

    /**
     * Define a new experiment
     */
    register(id: string, variants: string[] = ['A', 'B'], weights?: number[]): void {
        this.experiments.set(id, { id, variants, weights });
    }

    /**
     * Get assigned variant for this user
     * Deterministic assignment based on UserID hash
     */
    getVariant(experimentId: string): string {
        // Return cached assignment if exists
        const key = `${this.userId}:${experimentId}`;

        // Check if experiment exists
        const exp = this.experiments.get(experimentId);
        if (!exp) {
            console.warn(`Experiment ${experimentId} not found, defaulting to 'control'`);
            return 'control';
        }

        // Deterministic Hash Assignment
        const hash = this.simpleHash(key);
        const normalized = hash % 100; // 0-99

        // Weight distribution logic
        let cumulative = 0;
        const weights = exp.weights || exp.variants.map(() => 100 / exp.variants.length);

        for (let i = 0; i < exp.variants.length; i++) {
            cumulative += weights[i];
            if (normalized < cumulative) {
                return exp.variants[i];
            }
        }

        return exp.variants[0];
    }

    /**
     * Get config value based on active variant
     * Useful for switching prompts, weights, or UI texts
     */
    getConfig<T>(experimentId: string, configs: Record<string, T>): T {
        const variant = this.getVariant(experimentId);
        return configs[variant] ?? configs['control'] ?? Object.values(configs)[0];
    }

    private generateUserId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

export default ExperimentManager;
