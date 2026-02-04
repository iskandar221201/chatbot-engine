/**
 * Custom UI Templates for Assistant-in-a-Box
 * Dedicated file for UI rendering overrides.
 */
window.ASSISTANT_TEMPLATES = {
    // Custom User Message Styling
    renderUserMessage: (text) => `
        <div class="flex flex-col items-end animate-in slide-in-from-right-4 duration-300">
            <div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[90%] border border-indigo-400/30">
                <p class="text-sm font-medium tracking-tight">${text}</p>
            </div>
            <div class="flex items-center gap-1 mt-1 opacity-60">
                <span class="text-[9px] uppercase font-black tracking-widest text-indigo-900">Verified User</span>
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
        </div>`,

    // Custom Assistant Container (Bubble Wrapper)
    renderAssistantContainer: (contentHTML, result) => `
        <div class="flex gap-4 items-start animate-in slide-in-from-left-4 duration-500">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-indigo-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            </div>
            <div class="flex-1 space-y-2">
                <div class="bg-white p-5 rounded-2xl rounded-tl-none border border-indigo-100 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.1)] text-slate-700 leading-relaxed relative overflow-hidden min-w-[200px]">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div class="relative z-10">${contentHTML}</div>
                </div>
            </div>
        </div>`,

    // Custom Result Card Styling
    renderResultCard: (item, idx, isPrimary) => {
        const price = item.sale_price || item.price_numeric;
        const currency = window.app?.config?.currencySymbol || 'Rp';

        return `
        <div class="relative group mt-4 animate-in fade-in zoom-in-95 duration-500" style="animation-delay: ${idx * 150}ms">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <a href="${item.cta_url || item.url}" class="relative flex flex-col bg-white border border-indigo-50 rounded-2xl overflow-hidden shadow-sm no-underline hover:shadow-xl transition-all duration-300">
                ${item.image_url ? `
                    <div class="relative h-40 overflow-hidden">
                        <img src="${item.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                        <div class="absolute top-3 left-3 flex gap-2">
                            <span class="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-indigo-600 text-[9px] font-black rounded-lg uppercase shadow-sm">${item.category}</span>
                            ${item.is_recommended ? '<span class="px-2 py-0.5 bg-amber-400 text-white text-[9px] font-black rounded-lg uppercase shadow-sm">✨ Featured</span>' : ''}
                        </div>
                    </div>
                ` : ''}
                <div class="p-5">
                    <h4 class="text-slate-900 font-extrabold text-base mb-1 group-hover:text-indigo-600 transition-colors">${item.title}</h4>
                    <p class="text-slate-500 text-xs mb-4 line-clamp-2 font-medium leading-relaxed">${item.description}</p>
                    <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mulai dari</span>
                            <span class="text-indigo-600 font-black text-lg">${price ? `${currency} ${price.toLocaleString()}` : 'Hubungi Kami'}</span>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-12">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7-7 7M5 12h16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
    }
};
