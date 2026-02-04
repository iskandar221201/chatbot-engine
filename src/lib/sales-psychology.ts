/**
 * Sales Psychology Engine
 * Triggers psychological buying signals: Cross-sell, FOMO, Social Proof
 */

import type { AssistantDataItem } from '../types';

export interface CrossSellRule {
    triggerCategory: string;
    suggestCategory: string;
    messageTemplate: string;
}

export interface SalesPsychologyConfig {
    enableFomo?: boolean;
    enableSocialProof?: boolean;
    enableCrossSell?: boolean;
    fomoThreshold?: number; // Show FOMO if stock below this (simulated)
    crossSellRules?: CrossSellRule[];
}

// Default Cross-Sell Rules
const DEFAULT_CROSS_SELLS: CrossSellRule[] = [
    {
        triggerCategory: 'Laptop',
        suggestCategory: 'Aksesoris',
        messageTemplate: 'Biar makin lengkap, sekalian tambah aksesori ini kak?'
    },
    {
        triggerCategory: 'HP',
        suggestCategory: 'Casing',
        messageTemplate: 'Lindungi HP baru kakak dengan casing premium ini yuk!'
    },
    {
        triggerCategory: 'Fashion',
        suggestCategory: 'Tas',
        messageTemplate: 'Outfit ini bakal makin kece kalau dipadukan sama tas ini.'
    }
];

export class SalesPsychology {
    private config: Required<SalesPsychologyConfig>;

    constructor(config: SalesPsychologyConfig = {}) {
        this.config = {
            enableFomo: config.enableFomo ?? true,
            enableSocialProof: config.enableSocialProof ?? true,
            enableCrossSell: config.enableCrossSell ?? true,
            fomoThreshold: config.fomoThreshold ?? 10,
            crossSellRules: config.crossSellRules ?? DEFAULT_CROSS_SELLS
        };
    }

    /**
     * Generate FOMO text for a specific item
     */
    getFomoSignal(item: AssistantDataItem): string | null {
        if (!this.config.enableFomo) return null;

        // Simulation: If no real stock data, use deterministic random based on title length
        // In real app, this would check item.stock
        const stockLevel = (item.title.length % 15) + 1;

        if (stockLevel < 5) {
            return `🔥 Stok menipis! Sisa ${stockLevel} unit lagi.`;
        } else if (stockLevel < this.config.fomoThreshold) {
            return `⚡ Laris manis! Banyak yang cari produk ini.`;
        }

        // Time-based FOMO
        const hour = new Date().getHours();
        if (hour >= 18 && hour <= 23) {
            return `⏰ Promo malam berakhir sebentar lagi!`;
        }

        return null;
    }

    /**
     * Generate Social Proof text
     */
    getSocialProof(item: AssistantDataItem): string | null {
        if (!this.config.enableSocialProof) return null;

        // Deterministic simulation
        const buyers = (item.title.length * 3) % 50 + 5;
        const viewers = (item.title.length * 7) % 20 + 2;

        const templates = [
            `👀 ${viewers} orang sedang melihat produk ini.`,
            `✅ Terjual ${buyers} unit minggu ini.`,
            `⭐ Favorit pelanggan bulan ini.`,
            `top_rated` in item ? `🏆 Produk rating tertinggi!` : null
        ];

        // Pick one based on day of month to rotate
        const index = new Date().getDate() % templates.length;
        return templates[index];
    }

    /**
     * Get Cross-Sell suggestions based on current item
     */
    getCrossSell(currentItem: AssistantDataItem, allItems: AssistantDataItem[]): AssistantDataItem[] {
        if (!this.config.enableCrossSell) return [];

        const rule = this.config.crossSellRules.find(r =>
            r.triggerCategory.toLowerCase() === currentItem.category?.toLowerCase()
        );

        if (!rule) return [];

        // Find items in suggested category
        const suggestions = allItems.filter(i =>
            i.category?.toLowerCase() === rule.suggestCategory.toLowerCase() &&
            i.title !== currentItem.title // Don't suggest same item
        );

        // Return top 2
        return suggestions.slice(0, 2);
    }

    /**
     * Get persuasive call-to-action message
     */
    getPersuasiveCTA(grade: 'hot' | 'warm' | 'cold'): string {
        switch (grade) {
            case 'hot':
                return "Amankan sekarang sebelum kehabisan! Stok rebutan lho kak.";
            case 'warm':
                return "Mumpung masih ada promo, mau saya bantu pesankan?";
            default:
                return "Boleh dilihat-lihat dulu kak, jamin gak nyesel.";
        }
    }

    /**
     * Get a random closing question to nudge the user toward a purchase
     */
    getClosingQuestion(): string {
        const questions = [
            "Mau saya bantu proses pesenannya kak?",
            "Gimana kak, tertarik buat ambil promo hari ini?",
            "Mau langsung amankan stoknya sekarang?",
            "Detailnya sudah jelas kak? Mau sekalian saya buatkan invoicenya?",
            "Ada lagi yang bikin kakak ragu? Saya bantu jelasin ya."
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    /**
     * Get a sympathetic prefix for objection handling
     */
    getObjectionPrefix(): string {
        const prefixes = [
            "Saya benar-benar mengerti kekhawatiran Kakak.",
            "Wajar kok kak kalau kakak tanya soal itu. Begini penjelasannya...",
            "Tenang kak, banyak juga yang awalnya ragu tapi akhirnya puas banget.",
            "Kritik kakak jadi masukan berharga buat kami.",
            "Maaf banget ya kak kalau ada yang kurang pas."
        ];
        return prefixes[Math.floor(Math.random() * prefixes.length)];
    }
}

export default SalesPsychology;
