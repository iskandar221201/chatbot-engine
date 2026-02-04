/**
 * NLP Classifier (Naive Bayes)
 * Lightweight intent classification for better natural language understanding.
 */

export interface ClassifierDocument {
    text: string;
    label: string;
}

export interface ClassificationResult {
    intent: string;
    confidence: number;
    allScores: Record<string, number>;
}

export interface NLPConfig {
    useClassifier?: boolean;
    classifierThreshold?: number;
    trainingData?: Record<string, string[]>;
}

// Default Training Data
export const DEFAULT_INTENTS: Record<string, string[]> = {
    'sales.price': ['berapa harganya', 'price list', 'murah gak', 'harganya berapa', 'cek harga'],
    'sales.order': ['cara beli', 'mau order', 'pesan sekarang', 'checkout', 'beli dong'],
    'sales.promo': ['ada diskon', 'kode promo', 'voucher', 'potongan harga'],
    'support.complaint': ['barang rusak', 'kecewa', 'komplain', 'belum sampai', 'lama banget'],
    'support.help': ['bantuan', 'customer service', 'admin', 'tanya dong'],
    'greeting': ['halo', 'hi', 'selamat pagi', 'siang', 'malam']
};

export class NLPClassifier {
    private wordCounts: Map<string, Map<string, number>> = new Map(); // label -> word -> count
    private labelCounts: Map<string, number> = new Map(); // label -> doc count
    private vocab: Set<string> = new Set();
    private totalDocuments: number = 0;
    private config: NLPConfig;

    constructor(config: NLPConfig = {}) {
        this.config = config;
        this.trainData(config.trainingData || DEFAULT_INTENTS);
    }

    private trainData(data: Record<string, string[]>) {
        for (const [intent, phrases] of Object.entries(data)) {
            phrases.forEach(phrase => this.train(phrase, intent));
        }
    }

    /**
     * Train the classifier with a document
     */
    train(text: string, label: string): void {
        const tokens = this.tokenize(text);

        if (!this.wordCounts.has(label)) {
            this.wordCounts.set(label, new Map());
        }

        const labelMap = this.wordCounts.get(label)!;

        tokens.forEach(token => {
            labelMap.set(token, (labelMap.get(token) || 0) + 1);
            this.vocab.add(token);
        });

        this.labelCounts.set(label, (this.labelCounts.get(label) || 0) + 1);
        this.totalDocuments++;
    }

    /**
     * Classify text into an intent
     */
    classify(text: string): ClassificationResult {
        const tokens = this.tokenize(text);
        const scores: Record<string, number> = {};
        let maxScore = -Infinity;
        let bestLabel = 'unknown';

        this.labelCounts.forEach((_, label) => {
            scores[label] = this.calculateLogProbability(tokens, label);
            if (scores[label] > maxScore) {
                maxScore = scores[label];
                bestLabel = label;
            }
        });

        // Normalize scores to simulated confidence (0-1) for UI
        // This is a rough approximation since Naive Bayes output is log-likelihood
        const confidence = this.calculateConfidence(scores);

        return {
            intent: bestLabel,
            confidence,
            allScores: scores
        };
    }

    private calculateLogProbability(tokens: string[], label: string): number {
        const labelDocCount = this.labelCounts.get(label) || 0;
        let logProb = Math.log(labelDocCount / this.totalDocuments);

        const labelWordMap = this.wordCounts.get(label)!;
        const totalWordsInLabel = Array.from(labelWordMap.values()).reduce((a, b) => a + b, 0);
        const vocabSize = this.vocab.size;

        tokens.forEach(token => {
            // Laplace Smoothing (+1)
            const wordCount = labelWordMap.get(token) || 0;
            const wordProb = (wordCount + 1) / (totalWordsInLabel + vocabSize);
            logProb += Math.log(wordProb);
        });

        return logProb;
    }

    private calculateConfidence(scores: Record<string, number>): number {
        // Softmax-like normalization for visualization
        const values = Object.values(scores);
        if (values.length === 0) return 0;

        const max = Math.max(...values);
        const expSum = values.reduce((sum, val) => sum + Math.exp(val - max), 0);
        const probs = values.map(val => Math.exp(val - max) / expSum);

        return Math.max(...probs);
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2); // Ignore short words
    }
}

export default NLPClassifier;
