import type { AssistantDataItem, AssistantResult, AssistantConfig, UISelectors } from "./types";
import { AssistantEngine } from "./engine";

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
            const result = await this.engine.search(query);
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
        div.innerHTML = `
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

        div.innerHTML = `
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

    private generateResponseHTML(query: string, result: AssistantResult): string {
        const { results, confidence, answer } = result;
        let html = "";

        // 1. Prioritize direct conversational answer
        if (answer) {
            html += `<p class="text-sm md:text-base font-medium mb-4">${this.formatText(answer)}</p>`;
        } else if (results.length > 0) {
            const top = results[0];
            html += `<p class="text-sm md:text-base font-medium mb-4">${this.formatText(top.answer || top.description)}</p>`;
        }

        // 2. Display Result Cards (Chips Upgrade)
        if (results.length > 0) {
            const actionChips = results.filter(r => r.category !== 'Sapaan').slice(0, 3).map((item, idx) => {
                const isPrimary = idx === 0 && (item.price_numeric || item.sale_price || item.is_recommended);
                const ctaText = item.cta_label || (item.category.includes('Produk') || item.category.includes('Layanan') ? "Pesan Sekarang" : "Lihat Detail");

                return `
                <a href="${item.cta_url || item.url}" class="flex flex-col gap-3 p-5 ${isPrimary ? 'bg-primary/5 border-primary/40 shadow-lg ring-1 ring-primary/20' : 'bg-white/50 border-gray-100'} hover:bg-white hover:scale-[1.02] hover:shadow-2xl rounded-3xl border transition-all group w-full mb-3">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-wrap gap-2">
                            <span class="text-[9px] font-black text-white bg-primary px-2 py-1 rounded-lg uppercase tracking-wider">${item.category}</span>
                            ${item.badge_text ? `<span class="text-[9px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg uppercase tracking-wider">${item.badge_text}</span>` : ""}
                            ${item.is_recommended ? `<span class="text-[9px] font-bold text-white bg-orange-500 px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">✨ Unggulan</span>` : ""}
                        </div>
                        ${item.price_numeric ? `
                            <div class="text-right">
                                ${item.sale_price ? `<span class="text-[10px] text-gray-400 line-through block">Rp ${(item.price_numeric / 1000000).toFixed(1)}Jt</span>` : ""}
                                <span class="text-sm font-extrabold text-primary">Rp ${((item.sale_price || item.price_numeric) / 1000000).toFixed(1)}Jt</span>
                            </div>
                        ` : ""}
                    </div>
                    <h4 class="font-extrabold text-dark text-base leading-tight group-hover:text-primary transition-colors">${item.title}</h4>
                    <p class="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">${item.description}</p>
                    <div class="flex items-center justify-end mt-2 pt-2 border-t border-gray-50">
                        <span class="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 group-hover:bg-primary group-hover:text-white transition-all">
                            ${ctaText}
                            <svg class="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
                        </span>
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
