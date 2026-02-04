/**
 * DevModeUI - Diagnostic HUD
 * A floating overlay for developers to inspect engine state in real-time.
 */

import { AssistantResult } from "../types";

export class DevModeUI {
    private container: HTMLElement | null = null;
    private crawlerContainer: HTMLElement | null = null;
    private isVisible: boolean = false;

    constructor() {
        if (typeof document !== 'undefined') {
            this.initContainer();
        }
    }

    private initContainer() {
        this.container = document.createElement('div');
        this.container.id = 'aib-dev-hud';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 80vh;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            color: #f8fafc;
            border-radius: 16px;
            padding: 20px;
            font-family: 'Inter', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            z-index: 999999;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            display: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(this.container);

        // Crawler Status Container (inside main HUD)
        this.crawlerContainer = document.createElement('div');
        this.crawlerContainer.id = 'aib-crawler-hud';
        this.crawlerContainer.style.cssText = `
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.1);
        `;
        this.crawlerContainer.innerHTML = `
            <p style="color: #94a3b8; font-weight: bold; margin-bottom: 8px; font-size: 9px; text-transform: uppercase;">Crawler Status</p>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 4px; color: #64748b; font-style: italic;">
                Initializing discovery...
            </div>
        `;
        this.container.appendChild(this.crawlerContainer);
    }

    public update(result: AssistantResult) {
        if (!this.container) return;

        this.isVisible = true;
        this.container.style.display = 'block';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8;">Dev Mode (HUD)</span>
                <span style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Intent: ${result.intent}</span>
            </div>
        `;

        // 1. Diagnostics (Timings)
        if (result.diagnostics && result.diagnostics.length > 0) {
            html += `<div style="margin-bottom: 15px;">
                <p style="color: #94a3b8; font-weight: bold; margin-bottom: 8px; font-size: 9px; text-transform: uppercase;">Pipeline Performance</p>
                <div style="display: flex; flex-direction: column; gap: 4px;">`;

            result.diagnostics.forEach(event => {
                const duration = event.duration ? event.duration.toFixed(2) : '-';
                const color = event.duration && event.duration > 10 ? '#f87171' : (event.duration && event.duration > 5 ? '#fbbf24' : '#34d399');

                html += `
                    <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px;">
                        <span style="color: #cbd5e1;">${event.id}</span>
                        <span style="color: ${color}; font-weight: bold;">${duration}ms</span>
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        // 2. Score Breakdown (Top Result)
        if (result.scoreBreakdown) {
            html += `<div>
                <p style="color: #94a3b8; font-weight: bold; margin-bottom: 8px; font-size: 9px; text-transform: uppercase;">Top Result Scoring</p>
                <div style="display: flex; flex-direction: column; gap: 4px;">`;

            Object.entries(result.scoreBreakdown).forEach(([key, value]) => {
                if (value === 0) return;
                const isNegative = value < 0;

                html += `
                    <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px;">
                        <span style="color: #cbd5e1;">${key}</span>
                        <span style="color: ${isNegative ? '#f87171' : '#38bdf8'}; font-weight: bold;">${value > 0 ? '+' : ''}${value}</span>
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        // 3. Confidence Meter
        html += `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #94a3b8;">Total Confidence</span>
                    <span style="font-weight: bold; color: #38bdf8;">${result.confidence}%</span>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${result.confidence}%; height: 100%; background: #38bdf8;"></div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        // Re-append crawler container because innerHTML clears it
        this.container.appendChild(this.crawlerContainer!);
    }

    public updateCrawlerStatus(progress: { url: string, totalIndexed: number, status: string }) {
        if (!this.container || !this.crawlerContainer) return;

        this.isVisible = true;
        this.container.style.display = 'block';
        this.crawlerContainer.style.display = 'block';

        const statusColors: Record<string, string> = {
            crawling: '#38bdf8',
            indexed: '#34d399',
            ignored: '#94a3b8',
            failed: '#f87171'
        };

        this.crawlerContainer.innerHTML = `
            <p style="color: #94a3b8; font-weight: bold; margin-bottom: 8px; font-size: 9px; text-transform: uppercase;">Crawler Status</p>
            <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #cbd5e1;">Items Indexed</span>
                    <span style="color: #34d399; font-weight: bold;">${progress.totalIndexed}</span>
                </div>
                <div style="font-size: 9px; color: #94a3b8; word-break: break-all; margin-top: 4px;">
                    <span style="color: ${statusColors[progress.status] || '#cbd5e1'}; font-weight: bold;">[${progress.status.toUpperCase()}]</span> 
                    ${progress.url.replace(window.location.origin, '') || '/'}
                </div>
            </div>
        `;
    }

    public toggle() {
        if (!this.container) return;
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
}

export default DevModeUI;
