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
        Fuse: any,
        selectors: UISelectors,
        config: AssistantConfig
    ) {
        this.engine = new AssistantEngine(searchData, Fuse, config);
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

        setTimeout(() => {
            this.hideTyping();
            const result = this.engine.search(query);
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
        div.className = "flex justify-end gap-4 opacity-0 translate-y-2 transition-all duration-300";
        div.innerHTML = `<div class="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[85%]"><p class="text-sm md:text-base font-medium">${text}</p></div>`;
        this.elements.messagesList.appendChild(div);
        setTimeout(() => div.classList.remove("opacity-0", "translate-y-2"), 10);
        this.scrollToBottom();

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
        div.className = "flex gap-4 opacity-0 translate-y-2 transition-all duration-500";

        let responseHTML = this.generateResponseHTML(query, result);

        div.innerHTML = `
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-accent shrink-0 shadow-lg hidden md:flex">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <div class="space-y-3 max-w-[90%] md:max-w-[85%]">
                <div class="bg-white p-6 rounded-3xl rounded-tl-none shadow-xl border border-gray-100 text-dark leading-relaxed relative">
                    ${responseHTML}
                </div>
            </div>`;

        this.elements.messagesList.appendChild(div);
        setTimeout(() => div.classList.remove("opacity-0", "translate-y-2"), 10);
        this.scrollToBottom();
    }

    private generateResponseHTML(query: string, result: AssistantResult): string {
        const { results, confidence } = result;
        let html = "";

        if (results.length > 0) {
            const top = results[0];
            html += `<p class="text-sm md:text-base font-medium">${this.formatText(top.answer || top.description)}</p>`;

            // Visual Chips for results
            const actionChips = results.filter(r => r.category !== 'Sapaan').slice(0, 3).map(item => `
                <a href="${item.url}" class="flex items-center justify-between gap-3 p-4 bg-white hover:bg-primary/5 rounded-2xl border border-gray-100 hover:border-primary/40 transition-all group w-full shadow-sm hover:shadow-md mb-2">
                    <div class="text-left w-full">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[8px] font-black text-white bg-primary px-1.5 py-0.5 rounded uppercase">${item.category}</span>
                            ${item.is_recommended ? `<span class="text-[8px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded uppercase animate-pulse">Rekomendasi</span>` : ""}
                            ${item.price_numeric ? `<span class="text-[10px] font-bold text-primary">Rp ${(item.price_numeric / 1000000).toFixed(1)}Jt-an</span>` : ""}
                        </div>
                        <h4 class="font-bold text-dark text-sm leading-tight">${item.title}</h4>
                    </div>
                </a>`).join("");

            if (actionChips) {
                html += `<div class="mt-4">${actionChips}</div>`;
            }
        } else {
            html = `<p class="text-sm">Maaf, saya belum menemukan jawaban yang pas untuk **"${query}"**. Silakan hubungi admin kami via WhatsApp.</p>`;
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
