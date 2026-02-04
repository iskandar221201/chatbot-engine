import { AssistantEngine } from '../src/engine';
import { AssistantConfig } from '../src/types';

/**
 * Enterprise Bot Configuration Example
 * This file demonstrates how to configure the engine for highly relevant and 
 * sophisticated interactions without any hardcoded logic.
 */

export const enterpriseConfig: AssistantConfig = {
    // 1. Core NLP & Triggers
    nlp: {
        trainingData: {
            'sales_promo': ['ada promo apa', 'diskon hari ini', 'lagi ada sale gak'],
            'chat_support': ['bantuan teknis', 'cara pakai', 'kendala aplikasi']
        }
    },

    // 2. Adaptive Sentiment Tuning
    // Prefix response tone based on customer emotion
    sentimentPrefixes: {
        negative: [
            "Mohon maaf banget ya kak atas kendalanya.",
            "Aduh, saya mengerti itu sangat tidak nyaman.",
            "Waduh, maaf ya kak, saya usahakan bantu berikan solusi terbaik."
        ],
        positive: [
            "Wah, semangat banget denger Kakak puas! ",
            "Terima kasih banyak ya kak, seneng banget bisa bantu! "
        ]
    },

    // 3. Smart Reference Resolution (Anaphora)
    // Triggers that will cause the bot to remember the last item discussed
    referenceTriggers: [
        'harganya', 'berapa', 'speknya', 'warnanya', 'readystok', 'lokasinya'
    ],

    // 4. Sales Psychology & Objection Handling
    salesPsychology: {
        enableFomo: true,
        enableSocialProof: true,
        crossSellRules: [
            {
                triggerCategory: 'Produk A',
                suggestCategory: 'Aksesoris',
                messageTemplate: 'Sekalian ambil aksesoris ini kak biar makin optimal?'
            }
        ]
    },

    // 5. Custom UI & Templates
    answerTemplates: {
        price: "Harganya {price} aja kak untuk {title}. Cukup terjangkau kan?",
        features: "Fitur unggulan {title} itu ada {features}. Mantap banget buat Kakak.",
        noResults: "Aduh, sepertinya saya belum punya info soal itu. Mau tanya yang lain?"
    }
};

const mockData = [
    {
        title: "Super Gadget X",
        category: "Gadget",
        description: "Gadget tercanggih tahun ini",
        price_numeric: 5000000,
        is_recommended: true,
        keywords: ["smartphone", "hp", "gadget"],
        url: "/produk/super-gadget-x"
    }
];

const engine = new AssistantEngine(mockData, undefined, enterpriseConfig);
console.log("Enterprise Bot Initialized with zero hardcoding.");
