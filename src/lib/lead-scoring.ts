/**
 * Lead Scoring System
 * Score potential customers based on their queries and behavior
 */

import { SentimentAnalyzer } from './sentiment';
import { NumberParser } from './number-parser';

export interface LeadScoreResult {
    score: number;           // 0-100
    grade: 'hot' | 'warm' | 'cold';
    signals: LeadSignal[];
    recommendation: string;
}

export interface LeadSignal {
    type: string;
    weight: number;
    description: string;
}

export interface LeadScoringConfig {
    weights?: {
        intent?: number;
        urgency?: number;
        budget?: number;
        engagement?: number;
        sentiment?: number;
    };
    hotThreshold?: number;
    warmThreshold?: number;
    budgetIndicators?: string[];
    buyingIntentWords?: string[];
    urgencyWords?: string[];
}

// Default buying intent words
const DEFAULT_BUYING_INTENT = [
    'beli', 'order', 'pesan', 'bayar', 'checkout', 'mau ambil', 'booking',
    'deal', 'setuju', 'ok', 'oke', 'jadi', 'fix', 'lanjut', 'proses'
];

// High-value intent words
const HIGH_VALUE_INTENT = [
    'premium', 'terbaik', 'paling bagus', 'rekomendasi', 'unggulan',
    'paket lengkap', 'full', 'all-in', 'vip', 'eksklusif'
];

// Urgency indicators
const DEFAULT_URGENCY = [
    'sekarang', 'hari ini', 'segera', 'urgent', 'buru-buru', 'cepat',
    'asap', 'deadline', 'besok', 'malam ini'
];

// Budget indicators
const DEFAULT_BUDGET_INDICATORS = [
    'budget', 'anggaran', 'dana', 'uang', 'maksimal', 'minimal',
    'range', 'kisaran', 'harga', 'biaya', 'bayar'
];

// Engagement signals (questions = engaged)
const ENGAGEMENT_PATTERNS = [
    /\?/,                    // Questions
    /bagaimana|gimana/i,     // How questions
    /apa saja|apa aja/i,     // What's included
    /bisa|boleh|dapat/i,     // Can I
    /ada.*promo/i,           // Promo inquiry
    /kapan|berapa lama/i     // Timeline questions
];

export class LeadScoring {
    private config: LeadScoringConfig;

    constructor(config: LeadScoringConfig = {}) {
        this.config = {
            weights: {
                intent: 30,
                urgency: 25,
                budget: 20,
                engagement: 15,
                sentiment: 10,
                ...config.weights
            },
            hotThreshold: 70,
            warmThreshold: 40,
            buyingIntentWords: DEFAULT_BUYING_INTENT,
            urgencyWords: DEFAULT_URGENCY,
            budgetIndicators: DEFAULT_BUDGET_INDICATORS,
            ...config
        };
    }

    /**
     * Calculate lead score from a query
     */
    score(query: string, context?: {
        messageCount?: number;
        sessionDuration?: number;
        previousQueries?: string[];
    }): LeadScoreResult {
        const signals: LeadSignal[] = [];
        let totalScore = 0;
        const weights = this.config.weights!;

        // 1. Intent Analysis
        const intentScore = this.analyzeIntent(query);
        if (intentScore.score > 0) {
            signals.push({
                type: 'intent',
                weight: intentScore.score,
                description: intentScore.reason
            });
            totalScore += (intentScore.score / 100) * weights.intent!;
        }

        // 2. Urgency Detection
        const urgencyScore = this.detectUrgency(query);
        if (urgencyScore.score > 0) {
            signals.push({
                type: 'urgency',
                weight: urgencyScore.score,
                description: urgencyScore.reason
            });
            totalScore += (urgencyScore.score / 100) * weights.urgency!;
        }

        // 3. Budget Signals
        const budgetScore = this.analyzeBudget(query);
        if (budgetScore.score > 0) {
            signals.push({
                type: 'budget',
                weight: budgetScore.score,
                description: budgetScore.reason
            });
            totalScore += (budgetScore.score / 100) * weights.budget!;
        }

        // 4. Engagement Level
        const engagementScore = this.measureEngagement(query, context);
        if (engagementScore.score > 0) {
            signals.push({
                type: 'engagement',
                weight: engagementScore.score,
                description: engagementScore.reason
            });
            totalScore += (engagementScore.score / 100) * weights.engagement!;
        }

        // 5. Sentiment Analysis
        const sentiment = SentimentAnalyzer.analyze(query);
        const sentimentScore = sentiment.label === 'positive' ? 80 :
            sentiment.label === 'neutral' ? 50 : 20;
        signals.push({
            type: 'sentiment',
            weight: sentimentScore,
            description: `${sentiment.label} sentiment detected`
        });
        totalScore += (sentimentScore / 100) * weights.sentiment!;

        // Calculate grade
        const finalScore = Math.min(100, Math.round(totalScore));
        let grade: 'hot' | 'warm' | 'cold';
        if (finalScore >= this.config.hotThreshold!) {
            grade = 'hot';
        } else if (finalScore >= this.config.warmThreshold!) {
            grade = 'warm';
        } else {
            grade = 'cold';
        }

        // Generate recommendation
        const recommendation = this.generateRecommendation(grade, signals);

        return {
            score: finalScore,
            grade,
            signals,
            recommendation
        };
    }

    private analyzeIntent(query: string): { score: number; reason: string } {
        const queryLower = query.toLowerCase();
        const buyingWords = this.config.buyingIntentWords || DEFAULT_BUYING_INTENT;

        // Check for high-value intent
        const highValueMatch = HIGH_VALUE_INTENT.some(word => queryLower.includes(word));
        if (highValueMatch) {
            return { score: 100, reason: 'High-value product interest detected' };
        }

        // Check for buying intent
        const buyingMatch = buyingWords.filter(word => queryLower.includes(word));
        if (buyingMatch.length > 0) {
            const score = Math.min(100, 60 + buyingMatch.length * 15);
            return { score, reason: `Buying intent: ${buyingMatch.join(', ')}` };
        }

        // Check for product inquiry
        if (/harga|fitur|spek|detail|info/i.test(queryLower)) {
            return { score: 40, reason: 'Product inquiry detected' };
        }

        return { score: 0, reason: '' };
    }

    private detectUrgency(query: string): { score: number; reason: string } {
        const queryLower = query.toLowerCase();
        const urgencyWords = this.config.urgencyWords || DEFAULT_URGENCY;

        // Check exclamation marks
        const exclamations = (query.match(/!/g) || []).length;
        let score = exclamations * 10;

        // Check urgency words
        const matches = urgencyWords.filter(word => queryLower.includes(word));
        if (matches.length > 0) {
            score += 50 + matches.length * 20;
        }

        // Check caps (urgency indicator)
        if (/[A-Z]{3,}/.test(query)) {
            score += 20;
        }

        if (score > 0) {
            return {
                score: Math.min(100, score),
                reason: matches.length > 0 ? `Urgency words: ${matches.join(', ')}` : 'Emphasis detected'
            };
        }

        return { score: 0, reason: '' };
    }

    private analyzeBudget(query: string): { score: number; reason: string } {
        const queryLower = query.toLowerCase();
        const indicators = this.config.budgetIndicators || DEFAULT_BUDGET_INDICATORS;

        // Check if budget is mentioned
        const hasBudgetWord = indicators.some(word => queryLower.includes(word));

        // Try to extract a number
        const extractedBudget = NumberParser.parse(query);

        if (extractedBudget && extractedBudget > 0) {
            const formatted = NumberParser.formatCurrency(extractedBudget);
            return {
                score: 90,
                reason: `Budget mentioned: ${formatted}`
            };
        }

        if (hasBudgetWord) {
            return { score: 50, reason: 'Budget discussion initiated' };
        }

        return { score: 0, reason: '' };
    }

    private measureEngagement(query: string, context?: {
        messageCount?: number;
        sessionDuration?: number;
        previousQueries?: string[];
    }): { score: number; reason: string } {
        let score = 0;
        const reasons: string[] = [];

        // Pattern-based engagement
        for (const pattern of ENGAGEMENT_PATTERNS) {
            if (pattern.test(query)) {
                score += 15;
                break;
            }
        }

        // Context-based engagement
        if (context) {
            if (context.messageCount && context.messageCount > 3) {
                score += Math.min(30, context.messageCount * 5);
                reasons.push(`${context.messageCount} messages`);
            }

            if (context.sessionDuration && context.sessionDuration > 60) {
                score += Math.min(20, context.sessionDuration / 30);
                reasons.push('Extended session');
            }

            if (context.previousQueries && context.previousQueries.length > 2) {
                score += 20;
                reasons.push('Multi-query session');
            }
        }

        // Query length (longer = more engaged)
        if (query.length > 50) {
            score += 15;
            reasons.push('Detailed query');
        }

        if (score > 0) {
            return {
                score: Math.min(100, score),
                reason: reasons.length > 0 ? reasons.join(', ') : 'Engaged inquiry'
            };
        }

        return { score: 0, reason: '' };
    }

    private generateRecommendation(grade: 'hot' | 'warm' | 'cold', signals: LeadSignal[]): string {
        const topSignal = signals.sort((a, b) => b.weight - a.weight)[0];

        switch (grade) {
            case 'hot':
                return 'Prioritaskan! Lead ini siap untuk closing. Berikan penawaran langsung dan fast response.';
            case 'warm':
                if (topSignal?.type === 'budget') {
                    return 'Lead tertarik dengan harga. Tunjukkan value proposition dan opsi pembayaran.';
                }
                if (topSignal?.type === 'intent') {
                    return 'Lead menunjukkan minat. Berikan info detail dan benefit produk.';
                }
                return 'Follow up dengan penawaran menarik dan ajak diskusi kebutuhan.';
            case 'cold':
                return 'Lead masih eksplorasi. Berikan informasi edukatif dan bangun kepercayaan.';
            default:
                return 'Follow up sesuai konteks percakapan.';
        }
    }

    /**
     * Quick check if lead is hot
     */
    static isHotLead(query: string): boolean {
        const scorer = new LeadScoring();
        return scorer.score(query).grade === 'hot';
    }

    /**
     * Get lead grade only
     */
    static getGrade(query: string): 'hot' | 'warm' | 'cold' {
        const scorer = new LeadScoring();
        return scorer.score(query).grade;
    }
}

export default LeadScoring;
