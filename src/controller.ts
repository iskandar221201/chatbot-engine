import type { AssistantDataItem, AssistantResult, AssistantConfig, UISelectors } from "./types";
import { AssistantEngine } from "./engine";
import { SiteCrawler } from "./crawler";
import { formatCurrency } from "./utils";

export class AssistantController {
    private engine: AssistantEngine;
    private selectors: UISelectors;
    private config: AssistantConfig;

    private elements: Record<string, HTMLElement | null> = {};
    private chatHistory: { type: 'user' | 'assistant', text: string, result?: AssistantResult }[] = [];
    private interactionCount = 0;

    constructor(
        searchData: AssistantDataItem[],
        FuseClass: any = undefined,
        selectors: UISelectors = {} as any,
        config: AssistantConfig = {}
    ) {
        this.engine = new AssistantEngine(searchData, FuseClass, config);
        this.selectors = selectors;
        this.config = config;

        this.initElements();
        this.initEventListeners();
        this.loadHistory();

        this.initCrawler();
    }

    private async initCrawler() {
        if (this.config.autoCrawl !== false && typeof window !== 'undefined') {
            const crawler = new SiteCrawler(window.location.origin, {
                maxDepth: this.config.crawlMaxDepth,
                maxPages: this.config.crawlMaxPages,
                ignorePatterns: this.config.crawlIgnorePatterns,
                autoCrawl: this.config.autoCrawl,
                category: this.config.crawlerCategory || 'Page'
            });

            // 1. Immediate Indexing: Index the current page first!
            try {
                const currentPageData = crawler.processDocument(document, window.location.href, this.config.crawlerCategory || 'Page');
                // Boost: Add Manual Keywords & Priority from config
                const extraKeywords = this.config.crawlerKeywords || [];
                currentPageData.keywords = [...(currentPageData.keywords || []), ...extraKeywords];
                currentPageData.is_recommended = true; // Give it a score boost

                this.engine.addData([currentPageData]);
                console.log("Assistant: Immediate indexing complete", currentPageData);
            } catch (e) {
                console.warn("Assistant: Immediate indexing failed", e);
            }

            // 2. Start deep crawling in background
            crawler.crawlAll().then(pages => {
                if (pages.length > 0) {
                    this.engine.addData(pages);
                    console.log(`Assistant: Background Crawl Complete. Crawled ${pages.length} pages. Data:`, pages);
                }
            });
        }
    }

    private initElements() {
        this.elements.overlay = document.getElementById(this.selectors.overlayId);
        this.elements.input = document.getElementById(this.selectors.inputId);
        this.elements.sendBtn = document.getElementById(this.selectors.sendBtnId);
        this.elements.closeBtn = document.getElementById(this.selectors.closeBtnId);
        this.elements.chatContainer = document.getElementById(this.selectors.chatContainerId);
        this.elements.messagesList = document.getElementById(this.selectors.messagesListId);
        this.elements.typingIndicator = document.getElementById(this.selectors.typingIndicatorId);
        this.elements.welcomeMsg = document.querySelector(`.${this.selectors.welcomeMsgClass}`);
    }

    private initEventListeners() {
        const input = this.elements.input as HTMLInputElement;
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.performAction();
            });
        }

        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener("click", () => this.performAction());
        }

        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener("click", () => this.closeAssistant());
        }

        document.querySelectorAll(`.${this.selectors.quickLinksClass}`).forEach((chip) => {
            const el = chip as HTMLElement;
            el.addEventListener("click", () => {
                if (input && el.dataset.query) {
                    input.value = el.dataset.query;
                    this.performAction();
                }
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.elements.overlay && !this.elements.overlay.classList.contains("hidden")) {
                this.closeAssistant();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                this.openAssistant();
            }
        });

        if (this.elements.overlay) {
            this.elements.overlay.addEventListener("click", (e) => {
                if (e.target === this.elements.overlay) this.closeAssistant();
            });
        }
    }

    public openAssistant() {
        const overlay = this.elements.overlay;
        const input = this.elements.input;
        if (!overlay || !input) return;

        overlay.classList.remove("hidden");
        setTimeout(() => {
            overlay.classList.remove("opacity-0");
            input.focus();
            if (this.elements.welcomeMsg) {
                this.elements.welcomeMsg.classList.remove("opacity-0", "translate-y-4");
            }
        }, 10);
        document.body.style.overflow = "hidden";
    }

    public closeAssistant() {
        const overlay = this.elements.overlay;
        const input = this.elements.input as HTMLInputElement;
        if (!overlay || !input) return;

        overlay.classList.add("opacity-0");
        setTimeout(() => {
            overlay.classList.add("hidden");
            input.value = "";
        }, 300);
        document.body.style.overflow = "";
    }

    private performAction() {
        const input = this.elements.input as HTMLInputElement;
        if (!input) return;
        const query = input.value;
        if (!query.trim()) return;

        input.value = "";
        this.addUserMessage(query);
        this.showTyping();

        setTimeout(async () => {
            this.hideTyping();
            const result = await this.engine.searchWithComparison(query);
            this.addAssistantMessage(query, result);
        }, 1000);
    }

    private showTyping() {
        const indicator = this.elements.typingIndicator;
        if (!indicator) return;
        indicator.classList.remove("hidden");
        setTimeout(() => indicator.classList.remove("opacity-0"), 10);
        this.scrollToBottom();
    }

    private hideTyping() {
        const indicator = this.elements.typingIndicator;
        if (!indicator) return;
        indicator.classList.add("opacity-0");
        setTimeout(() => indicator.classList.add("hidden"), 300);
    }

    private scrollToBottom() {
        const container = this.elements.chatContainer;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }

    private addUserMessage(text: string, save = true) {
        if (!this.elements.messagesList) return;
        const div = document.createElement("div");
        div.className = "bubble-container user opacity-0 translate-y-4 bubble-user";
        const customTemplate = this.config.uiTemplates?.renderUserMessage;
        div.innerHTML = customTemplate ? customTemplate(text) : `
            <div class="bg-gradient-to-br from-primary to-primary-dark text-white p-5 rounded-3xl rounded-tr-none shadow-xl max-w-[85%] border border-white/10">
                <p class="text-sm md:text-base font-semibold tracking-tight">${text}</p>
            </div>`;
        this.elements.messagesList.appendChild(div);

        if (save) {
            this.chatHistory.push({ type: 'user', text });
            this.saveHistory();
        }
    }

    private addAssistantMessage(query: string, result: AssistantResult, save = true) {
        if (!this.elements.messagesList) return;
        this.interactionCount++;

        if (save) {
            this.chatHistory.push({ type: 'assistant', text: query, result });
            this.saveHistory();
        }

        const div = document.createElement("div");
        div.className = "bubble-container assistant opacity-0 translate-y-4 bubble-assistant";

        let responseHTML = this.generateResponseHTML(query, result);

        const customTemplate = this.config.uiTemplates?.renderAssistantContainer;
        div.innerHTML = customTemplate ? customTemplate(responseHTML, result) : `
            <div class="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-primary shrink-0 shadow-lg border border-gray-100 hidden md:flex">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <div class="space-y-3 max-w-[92%] md:max-w-[85%]">
                <div class="bg-white/80 backdrop-blur-md p-6 rounded-3xl rounded-tl-none shadow-2xl border border-white/40 text-dark leading-relaxed">
                    ${responseHTML}
                </div>
            </div>`;

        this.elements.messagesList.appendChild(div);
        this.scrollToBottom();
    }

    private generateResponseHTML(query: string, result: AssistantResult & { comparison?: any }): string {
        const { results, confidence, answer, comparison } = result;
        let html = "";

        // 0. Handle Comparison Results First
        if (comparison && comparison.items && comparison.items.length > 0) {
            if (this.config.uiTemplates?.renderComparison) {
                return this.config.uiTemplates.renderComparison(comparison);
            }

            // Show recommendation
            if (comparison.recommendation) {
                html += `<div class="mb-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
                    <p class="text-xs uppercase tracking-wider text-primary font-bold mb-2">🏆 Rekomendasi Kami</p>
                    <p class="text-base font-bold text-dark">${comparison.recommendation.item.title}</p>
                    ${comparison.recommendation.reasons.length > 0 ? `
                        <ul class="mt-2 text-xs text-gray-600 list-disc list-inside">
                            ${comparison.recommendation.reasons.map((r: string) => `<li>${r}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>`;
            }

            // Show comparison table
            html += `<div class="overflow-x-auto mt-4">${comparison.tableHtml}</div>`;

            // Add CTA buttons for each item
            html += `<div class="flex flex-wrap gap-2 mt-4">`;
            comparison.items.forEach((item: any, idx: number) => {
                const isPrimary = idx === 0;
                html += `<a href="${item.url}" class="px-4 py-2 text-xs font-bold rounded-xl transition-all ${isPrimary ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${item.title}</a>`;
            });
            html += `</div>`;

            return html;
        }

        // 1. Prioritize direct conversational answer
        if (answer) {
            html += `<p class="text-sm md:text-base font-medium mb-4">${this.formatText(answer)}</p>`;

            // Sales-driven: Auto-redirect for contact intent if WhatsApp number is available
            if (result.intent === 'chat_contact' && this.config.whatsappNumber) {
                const waUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent("Halo, saya ingin bertanya tentang: " + query)}`;

                html += `
                <div class="mt-4">
                    <a href="${waUrl}" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#128C7E] transition-all shadow-lg hover:scale-105 active:scale-95">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        Hubungi WhatsApp
                    </a>
                </div>`;

                setTimeout(() => {
                    window.open(waUrl, "_blank");
                }, 2000);
            }
        } else if (results.length > 0) {
            const top = results[0];
            html += `<p class="text-sm md:text-base font-medium mb-4">${this.formatText(top.answer || top.description)}</p>`;
        }

        // 2. Display Result Cards (Chips Upgrade)
        if (results.length > 0) {
            const actionChips = results.filter(r => r.category !== 'Sapaan').slice(0, 3).map((item, idx) => {
                const isPrimary = !!(idx === 0 && (item.price_numeric || item.sale_price || item.is_recommended));

                if (this.config.uiTemplates?.renderResultCard) {
                    return this.config.uiTemplates.renderResultCard(item, idx, isPrimary);
                }

                const ctaText = item.cta_label || (item.category.includes('Produk') || item.category.includes('Layanan') ? "Pesan Sekarang" : "Lihat Detail");

                return `
                <a href="${item.cta_url || item.url}" class="flex gap-4 p-4 ${isPrimary ? 'bg-primary/5 border-primary/40 shadow-lg ring-1 ring-primary/20' : 'bg-white/50 border-gray-100'} hover:bg-white hover:scale-[1.01] hover:shadow-2xl rounded-2xl border transition-all group w-full mb-3 no-underline">
                    ${item.image_url ? `
                        <div class="relative w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                            <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        </div>
                    ` : ''}
                    <div class="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                            <div class="flex items-center justify-between gap-2 mb-1">
                                <span class="text-[9px] font-black text-white bg-primary px-2 py-0.5 rounded-lg uppercase tracking-wider">${item.category}</span>
                                ${item.price_numeric ? `
                                    <div class="text-right">
                                        <span class="text-xs font-extrabold text-primary">${this.formatCurrency(item.sale_price || item.price_numeric)}</span>
                                    </div>
                                ` : ""}
                            </div>
                            <h4 class="font-bold text-dark text-sm leading-tight group-hover:text-primary transition-colors truncate">${item.title}</h4>
                            <p class="text-[11px] text-gray-500 line-clamp-2 leading-snug mt-1">${item.description}</p>
                        </div>
                        <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-50/50">
                            <div class="flex gap-1">
                                ${item.badge_text ? `<span class="text-[8px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">${item.badge_text}</span>` : ""}
                                ${item.is_recommended ? `<span class="text-[8px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">✨ Best</span>` : ""}
                            </div>
                            <span class="text-primary text-[10px] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                ${ctaText}
                                <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M9 5l7 7-7 7"></path></svg>
                            </span>
                        </div>
                    </div>
                </a>`;
            }).join("");

            if (actionChips) {
                html += `<div class="mt-4">${actionChips}</div>`;
            }
        } else if (!answer) {
            html = `<p class="flex items-center gap-2 text-gray-400 italic text-sm"><svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Maaf, saya belum menemukan jawaban yang pas. Silakan hubungi admin kami via WhatsApp.</p>`;
            if (this.config.whatsappNumber) {
                setTimeout(() => {
                    const waUrl = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent("Halo, saya ingin bertanya tentang: " + query)}`;
                    window.open(waUrl, "_blank");
                }, 2000);
            }
        }

        return html;
    }

    private formatText(text: string): string {
        return text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-primary">$1</span>');
    }

    private formatCurrency(amount: number): string {
        return formatCurrency(
            amount,
            this.config.currencySymbol || 'Rp',
            this.config.locale || 'id-ID'
        );
    }

    private saveHistory() {
        localStorage.setItem('assistant_chat_history', JSON.stringify(this.chatHistory));
    }

    private loadHistory() {
        const saved = localStorage.getItem('assistant_chat_history');
        if (saved) {
            try {
                this.chatHistory = JSON.parse(saved);
                this.chatHistory.forEach(msg => {
                    if (msg.type === 'user') this.addUserMessage(msg.text, false);
                    else if (msg.type === 'assistant' && msg.result) this.addAssistantMessage(msg.text, msg.result, false);
                });
            } catch (e) {
                console.error("History load error", e);
            }
        }
    }
}
