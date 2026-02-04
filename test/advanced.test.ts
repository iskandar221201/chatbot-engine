import { describe, it, expect } from 'vitest';
import { NLPClassifier } from '../src/lib/nlp-classifier';
import { SalesReporter } from '../src/lib/sales-reporter';
import { AnalyticsEngine } from '../src/lib/analytics';

describe('NLPClassifier', () => {
    const classifier = new NLPClassifier();

    it('should classify sales intents', () => {
        const result = classifier.classify('berapa harganya gan?');
        expect(result.intent).toBe('sales.price');
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify support intents', () => {
        const result = classifier.classify('barang saya rusak parah');
        expect(result.intent).toBe('support.complaint');
    });

    it('should classify mixed wording correctly', () => {
        // "cara pesan" -> sales.order
        const result = classifier.classify('gimana cara pesan barang ini');
        expect(result.intent).toBe('sales.order');
    });
});

describe('SalesReporter', () => {
    it('should generate metric report', async () => {
        const analytics = new AnalyticsEngine();

        // Simulate data
        analytics.track('search', {});
        analytics.track('search', {});
        analytics.track('search', {});
        analytics.track('lead_captured', { value: 1000 }); // Lead 1
        analytics.track('lead_captured', { value: 2000 }); // Lead 2

        await new Promise(r => setTimeout(r, 10)); // Process queue

        const reporter = new SalesReporter(analytics);
        const report = reporter.generateReport();

        expect(report.totalLeads).toBe(2);
        expect(report.conversionRate).toBeGreaterThan(0);
        expect(report.topIntents).toBeDefined();
    });

    it('should generate HTML summary', () => {
        const analytics = new AnalyticsEngine();
        const reporter = new SalesReporter(analytics);
        const html = reporter.getHtmlSummary();

        expect(html).toContain('sales-report-card');
        expect(html).toContain('Leads');
    });
});
