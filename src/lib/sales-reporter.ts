/**
 * Sales Performance Reporter
 * Aggregates analytics data into actionable sales reports.
 */

import { AnalyticsEngine, AnalyticsEvent } from "./analytics";

export interface SalesMetric {
    totalRevenuePotential: number; // Based on 'lead_captured' with products that have prices
    totalLeads: number;
    hotLeads: number;
    conversionRate: number; // Leads / Total Sessions (approx)
    topIntents: Record<string, number>;
}

export interface SalesReportConfig {
    currencySymbol?: string;
    avgOrderValue?: number;
    leadConversionRate?: number; // 0.0 to 1.0 (estimated)
    intentMap?: {
        lead?: string;     // default: 'lead_captured'
        price?: string;    // default: 'sales_inquiry'
        order?: string;    // default: 'sales_order'
    }
}

export class SalesReporter {
    private analytics: AnalyticsEngine;
    private config: SalesReportConfig;

    constructor(analytics: AnalyticsEngine, config: SalesReportConfig = {}) {
        this.analytics = analytics;
        this.config = {
            currencySymbol: 'Rp',
            avgOrderValue: 150000,
            leadConversionRate: 0.4,
            ...config,
            intentMap: {
                lead: 'lead_captured',
                price: 'sales_inquiry',
                order: 'sales_order',
                ...(config.intentMap || {})
            }
        };
    }

    /**
     * Generate a snaphost report from current analytics metrics
     */
    generateReport(): SalesMetric {
        const metrics = this.analytics.getMetrics();
        const map = this.config.intentMap!;

        // Note: Real revenue tracking would require 'purchase_completed' events
        // Here we simulate "Potential Revenue" based on Leads captured

        const totalLeads = metrics[map.lead!] || 0;
        const totalSessions = (metrics['search'] || 0) / 3; // Approx 3 searches per session

        return {
            totalRevenuePotential: totalLeads * (this.config.avgOrderValue!),
            totalLeads,
            hotLeads: Math.floor(totalLeads * (this.config.leadConversionRate!)),
            conversionRate: totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0,
            topIntents: {
                'sales.price': metrics[map.price!] || 0,
                'sales.order': metrics[map.order!] || 0
            }
        };
    }

    /**
     * Get HTML Summary for Dashboard
     */
    getHtmlSummary(): string {
        const report = this.generateReport();
        const cur = this.config.currencySymbol;
        return `
            <div class="sales-report-card">
                <h3>📊 Sales Performance</h3>
                <div class="metric-grid">
                    <div class="metric">
                        <span class="label">Leads</span>
                        <span class="value">${report.totalLeads}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Potential Rev</span>
                        <span class="value">${cur} ${report.totalRevenuePotential.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

export default SalesReporter;
