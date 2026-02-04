/**
 * Indonesian Sentiment Analyzer
 * Simple rule-based sentiment analysis for Indonesian text
 */

export interface SentimentResult {
    score: number;          // -100 to 100
    label: 'positive' | 'negative' | 'neutral';
    isUrgent: boolean;
    intensity: 'low' | 'medium' | 'high';
    details: {
        positiveWords: string[];
        negativeWords: string[];
        intensifiers: string[];
    };
}

// Positive words with weights
export interface SentimentConfig {
    positiveWords?: Record<string, number>;
    negativeWords?: Record<string, number>;
    intensifiers?: Record<string, number>;
    negators?: string[];
    urgencyWords?: string[];
}

// Default dictionaries (Fallbacks)
export const DEFAULT_SENTIMENT_CONFIG: SentimentConfig = {
    positiveWords: {
        'luar biasa': 3, 'sangat bagus': 3, 'mantap': 3, 'keren': 3, 'wow': 3,
        'sempurna': 3, 'hebat': 3, 'amazing': 3, 'excellent': 3, 'love': 3,
        'puas banget': 3, 'super': 3, 'top': 3, 'best': 3, 'terbaik': 3,

        'bagus': 2, 'baik': 2, 'senang': 2, 'suka': 2, 'oke': 2, 'ok': 2,
        'puas': 2, 'recommended': 2, 'rekomen': 2, 'worth': 2, 'nice': 2,
        'good': 2, 'great': 2, 'happy': 2, 'terima kasih': 2, 'makasih': 2,
        'thanks': 2, 'bersyukur': 2, 'alhamdulillah': 2, 'syukur': 2,
        'membantu': 2, 'helpful': 2, 'ramah': 2, 'cepat': 2, 'murah': 2,

        'boleh': 1, 'lumayan': 1, 'cukup': 1, 'standar': 1, 'fair': 1,
        'sip': 1, 'siap': 1, 'yes': 1, 'setuju': 1, 'menarik': 1,
        'enak': 1, 'nyaman': 1, 'aman': 1, 'lancar': 1
    },
    negativeWords: {
        'kecewa berat': 3, 'sangat kecewa': 3, 'parah': 3, 'sampah': 3,
        'terrible': 3, 'awful': 3, 'worst': 3, 'terburuk': 3, 'bohong': 3,
        'nipu': 3, 'penipu': 3, 'scam': 3, 'fraud': 3, 'bangkrut': 3,
        'rugi besar': 3, 'no response': 3, 'tidak merespon': 3,

        'kecewa': 2, 'marah': 2, 'kesal': 2, 'buruk': 2, 'jelek': 2,
        'lambat': 2, 'lama': 2, 'gagal': 2, 'rusak': 2, 'error': 2,
        'tidak bisa': 2, 'gabisa': 2, 'gak bisa': 2, 'susah': 2, 'sulit': 2,
        'ribet': 2, 'repot': 2, 'mahal': 2, 'overpriced': 2, 'kemahalan': 2,
        'komplain': 2, 'complaint': 2, 'bad': 2, 'poor': 2, 'masalah': 2,
        'problem': 2, 'issue': 2, 'keluhan': 2, 'protes': 2, 'benci': 2,

        'kurang': 1, 'tidak puas': 1, 'biasa': 1, 'so-so': 1, 'meh': 1,
        'belum': 1, 'tunggu': 1, 'waiting': 1, 'pending': 1, 'delay': 1,
        'bingung': 1, 'confused': 1, 'tidak jelas': 1, 'unclear': 1
    },
    intensifiers: {
        'sangat': 1.5, 'banget': 1.5, 'sekali': 1.5, 'bgt': 1.5, 'bngt': 1.5,
        'amat': 1.5, 'super': 1.5, 'really': 1.5, 'very': 1.5, 'totally': 1.5,
        'parah': 1.3, 'gila': 1.3, 'pol': 1.3, 'ekstrim': 1.3,
        'agak': 0.7, 'sedikit': 0.7, 'dikit': 0.7, 'lumayan': 0.8
    },
    negators: [
        'tidak', 'bukan', 'tak', 'gak', 'ga', 'nggak', 'kagak', 'belum',
        'jangan', 'tanpa', 'no', 'not', 'never', 'none'
    ],
    urgencyWords: [
        'urgent', 'darurat', 'segera', 'asap', 'sekarang', 'cepat', 'buru-buru',
        'deadline', 'penting', 'emergency', 'tolong', 'help', 'bantuan', 'sos'
    ]
};

export class SentimentAnalyzer {
    private config: SentimentConfig;
    private static defaultInstance = new SentimentAnalyzer();

    constructor(config?: SentimentConfig) {
        this.config = {
            positiveWords: { ...DEFAULT_SENTIMENT_CONFIG.positiveWords, ...(config?.positiveWords || {}) },
            negativeWords: { ...DEFAULT_SENTIMENT_CONFIG.negativeWords, ...(config?.negativeWords || {}) },
            intensifiers: { ...DEFAULT_SENTIMENT_CONFIG.intensifiers, ...(config?.intensifiers || {}) },
            negators: [...(DEFAULT_SENTIMENT_CONFIG.negators || []), ...(config?.negators || [])],
            urgencyWords: [...(DEFAULT_SENTIMENT_CONFIG.urgencyWords || []), ...(config?.urgencyWords || [])]
        };
    }

    /**
     * Analyze sentiment of Indonesian text
     */
    analyze(text: string): SentimentResult {
        if (!text || typeof text !== 'string') return SentimentAnalyzer.getEmptyResult();

        const cleanText = text.toLowerCase();
        const words = cleanText.split(/\s+/);

        let positiveScore = 0;
        let negativeScore = 0;
        let multiplier = 1;

        const foundPositive: string[] = [];
        const foundNegative: string[] = [];
        const foundIntensifiers: string[] = [];

        // Check for urgency
        const isUrgent = this.config.urgencyWords!.some(w => cleanText.includes(w)) || (text.match(/!/g) || []).length >= 2;

        // Intensity checks
        const exclamationCount = (text.match(/!/g) || []).length;
        if (exclamationCount > 0) multiplier *= (1 + exclamationCount * 0.15);
        if ((text.match(/[A-Z]{2,}/g) || []).length > 0) multiplier *= 1.2;
        if (text.match(/(.)\1{2,}/g)) multiplier *= 1.3; // Repetition

        let negateNext = false;

        // Simple word matching loop
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const nextWord = words[i + 1] || '';
            const twoWords = word + ' ' + nextWord;

            if (this.config.negators!.includes(word)) {
                negateNext = true;
                continue;
            }

            if (this.config.intensifiers![word]) {
                multiplier *= this.config.intensifiers![word];
                foundIntensifiers.push(word);
                continue;
            }

            // Check two words first
            let currentWordScore = 0;
            let isPositive = false;
            let matchedWord = "";

            if (this.config.positiveWords![twoWords]) {
                currentWordScore = this.config.positiveWords![twoWords];
                isPositive = true;
                matchedWord = twoWords;
                i++;
            } else if (this.config.negativeWords![twoWords]) {
                currentWordScore = this.config.negativeWords![twoWords];
                isPositive = false;
                matchedWord = twoWords;
                i++;
            } else if (this.config.positiveWords![word]) {
                currentWordScore = this.config.positiveWords![word];
                isPositive = true;
                matchedWord = word;
            } else if (this.config.negativeWords![word]) {
                currentWordScore = this.config.negativeWords![word];
                isPositive = false;
                matchedWord = word;
            }

            if (matchedWord) {
                if (negateNext) {
                    if (isPositive) {
                        negativeScore += currentWordScore;
                        foundNegative.push(`not ${matchedWord}`);
                    } else {
                        positiveScore += currentWordScore;
                        foundPositive.push(`not ${matchedWord}`);
                    }
                    negateNext = false;
                } else {
                    if (isPositive) {
                        positiveScore += currentWordScore;
                        foundPositive.push(matchedWord);
                    } else {
                        negativeScore += currentWordScore;
                        foundNegative.push(matchedWord);
                    }
                }
            }
        }

        const score = (positiveScore - negativeScore) * multiplier;
        const normalizedScore = Math.max(-100, Math.min(100, score * 10));

        // Determine label
        let label: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (normalizedScore > 10) label = 'positive';
        else if (normalizedScore < -10) label = 'negative';

        let intensity: 'low' | 'medium' | 'high' = 'low';
        const absScore = Math.abs(normalizedScore);
        if (absScore > 40) intensity = 'high';
        else if (absScore > 20) intensity = 'medium';

        return {
            score: Math.round(normalizedScore),
            label,
            isUrgent,
            intensity,
            details: { positiveWords: foundPositive, negativeWords: foundNegative, intensifiers: foundIntensifiers }
        };
    }

    // --- Static Helpers for Backward Compatibility ---

    static analyze(text: string): SentimentResult {
        return this.defaultInstance.analyze(text);
    }

    static isNegative(text: string): boolean {
        return this.defaultInstance.analyze(text).label === 'negative';
    }

    static isPositive(text: string): boolean {
        return this.defaultInstance.analyze(text).label === 'positive';
    }

    static isUrgent(text: string): boolean {
        return this.defaultInstance.analyze(text).isUrgent;
    }

    static getPriority(text: string): number {
        const result = this.defaultInstance.analyze(text);
        if (result.isUrgent && result.label === 'negative') return 5;
        if (result.label === 'negative' && result.intensity === 'high') return 5;
        if (result.isUrgent) return 4;
        if (result.label === 'negative' && result.intensity === 'medium') return 4;
        if (result.label === 'negative') return 3;
        if (result.label === 'neutral') return 2;
        return 1;
    }

    static getEmptyResult(): SentimentResult {
        return { score: 0, label: 'neutral', isUrgent: false, intensity: 'low', details: { positiveWords: [], negativeWords: [], intensifiers: [] } };
    }
}

export default SentimentAnalyzer;
