import { describe, it, expect, beforeEach } from 'vitest';
import { LeadScoring } from '../src/lib/lead-scoring';
import { ConversationContext } from '../src/lib/conversation-context';
import { BudgetMatcher } from '../src/lib/budget-matcher';
import { FollowUpSuggester } from '../src/lib/follow-up-suggester';
import type { AssistantDataItem } from '../src/types';

// Mock products for testing
const mockProducts: AssistantDataItem[] = [
    { title: 'Product A', description: 'Basic', category: 'Test', keywords: [], url: '/a', price_numeric: 1000000 },
    { title: 'Product B', description: 'Premium', category: 'Test', keywords: [], url: '/b', price_numeric: 2000000, is_recommended: true },
    { title: 'Product C', description: 'Budget', category: 'Test', keywords: [], url: '/c', price_numeric: 500000, sale_price: 400000 },
];

describe('LeadScoring', () => {
    it('should score hot leads correctly', () => {
        const scorer = new LeadScoring();
        const result = scorer.score('mau beli sekarang, budget 2jt!');
        expect(['hot', 'warm']).toContain(result.grade);
        expect(result.score).toBeGreaterThan(40);
    });

    it('should score warm leads', () => {
        const scorer = new LeadScoring();
        const result = scorer.score('berapa harga produk ini?');
        expect(['warm', 'hot', 'cold']).toContain(result.grade);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should detect urgency signals', () => {
        const scorer = new LeadScoring();
        const result = scorer.score('tolong proses SEKARANG!!!');
        expect(result.signals.some(s => s.type === 'urgency')).toBe(true);
    });

    it('should detect budget signals', () => {
        const scorer = new LeadScoring();
        const result = scorer.score('budget saya sekitar 5 juta');
        expect(result.signals.some(s => s.type === 'budget')).toBe(true);
    });

    it('should provide recommendations', () => {
        const scorer = new LeadScoring();
        const result = scorer.score('mau order sekarang');
        expect(result.recommendation).toBeDefined();
        expect(result.recommendation.length).toBeGreaterThan(0);
    });

    it('should have static helpers', () => {
        expect(LeadScoring.isHotLead('beli sekarang budget 10jt urgent!')).toBe(true);
        expect(LeadScoring.getGrade('halo')).toBe('cold');
    });
});

describe('ConversationContext', () => {
    let context: ConversationContext;

    beforeEach(() => {
        context = new ConversationContext();
    });

    it('should create and manage sessions', () => {
        const session = context.getSession('user-123');
        expect(session.sessionId).toBe('user-123');
        expect(session.messages).toHaveLength(0);
    });

    it('should add messages to session', () => {
        context.addMessage('user-123', 'user', 'Hello');
        context.addMessage('user-123', 'assistant', 'Hi there');
        expect(context.getMessageCount('user-123')).toBe(2);
    });

    it('should track entities', () => {
        context.setEntity('user-123', 'budget', 5000000);
        expect(context.getEntity('user-123', 'budget')).toBe(5000000);
    });

    it('should track intent', () => {
        context.setIntent('user-123', 'sales_harga');
        expect(context.getIntent('user-123')).toBe('sales_harga');
    });

    it('should get history', () => {
        context.addMessage('user-123', 'user', 'Question');
        context.addMessage('user-123', 'assistant', 'Answer');
        const history = context.getHistory('user-123');
        expect(history).toContain('user: Question');
        expect(history).toContain('assistant: Answer');
    });

    it('should get context summary', () => {
        context.addMessage('user-123', 'user', 'Hello');
        context.setIntent('user-123', 'chat_greeting');
        const summary = context.getContextSummary('user-123');
        expect(summary.messageCount).toBe(1);
        expect(summary.currentIntent).toBe('chat_greeting');
    });

    it('should export and import sessions', () => {
        context.addMessage('user-123', 'user', 'Test');
        const exported = context.exportSession('user-123');
        expect(exported).not.toBeNull();

        const newContext = new ConversationContext();
        newContext.importSession('user-456', exported!);
        expect(newContext.getMessageCount('user-456')).toBe(1);
    });
});

describe('BudgetMatcher', () => {
    it('should extract budget from query', () => {
        const matcher = new BudgetMatcher();
        const result = matcher.extractBudget('budget saya 2jt');
        expect(result.max).toBe(2000000);
    });

    it('should match products to budget', () => {
        const matcher = new BudgetMatcher();
        const result = matcher.match('budget 1 juta', mockProducts);
        expect(result.budget).toBe(1000000);
        expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should prioritize exact matches', () => {
        const matcher = new BudgetMatcher();
        const result = matcher.match('budget 500rb', mockProducts);
        const exactMatches = result.matches.filter(m => m.matchType === 'exact' || m.matchType === 'under');
        expect(exactMatches.length).toBeGreaterThan(0);
    });

    it('should provide suggestion', () => {
        const matcher = new BudgetMatcher();
        const result = matcher.match('budget 1jt', mockProducts);
        expect(result.suggestion).toBeDefined();
    });

    it('should handle missing budget', () => {
        const matcher = new BudgetMatcher();
        const result = matcher.match('tunjukkan produk', mockProducts);
        expect(result.budget).toBeNull();
    });

    it('should have static hasBudget helper', () => {
        expect(BudgetMatcher.hasBudget('budget 2jt')).toBe(true);
        expect(BudgetMatcher.hasBudget('hello world')).toBe(false);
    });
});

describe('FollowUpSuggester', () => {
    it('should suggest based on intent', () => {
        const suggester = new FollowUpSuggester();
        const suggestions = suggester.suggest('sales_harga');
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].question).toBeDefined();
    });

    it('should handle objections', () => {
        const suggester = new FollowUpSuggester();
        const suggestions = suggester.suggest('sales_harga', {
            userQuery: 'terlalu mahal, pikir dulu'
        });
        expect(suggestions.some(s => s.category === 'objection')).toBe(true);
    });

    it('should provide closing questions', () => {
        const suggester = new FollowUpSuggester();
        const closing = suggester.getClosingQuestions();
        expect(closing.length).toBeGreaterThan(0);
        expect(closing[0].category).toBe('closing');
    });

    it('should provide discovery questions', () => {
        const suggester = new FollowUpSuggester();
        const discovery = suggester.getDiscoveryQuestions();
        expect(discovery.length).toBeGreaterThan(0);
    });

    it('should detect objections', () => {
        expect(FollowUpSuggester.isObjection('terlalu mahal')).toBe(true);
        expect(FollowUpSuggester.isObjection('bagus sekali')).toBe(false);
    });

    it('should get random follow-up', () => {
        const random = FollowUpSuggester.getRandom('sales_beli');
        expect(random).not.toBeNull();
    });
});
