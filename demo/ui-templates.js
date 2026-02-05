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
        const currency = item.currency || 'Rp';

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
                    <h4 class="text-slate-900 font-extrabold text-base mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">${item.title}</h4>
                    <p class="text-slate-500 text-xs mb-4 line-clamp-2 font-medium leading-relaxed">${item.description}</p>
                    <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mulai dari</span>
                            <span class="text-indigo-600 font-black text-base">${price ? `${currency} ${price.toLocaleString()}` : 'Hubungi Kami'}</span>
                        </div>
                        <div class="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-12">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7-7 7M5 12h16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
    },

    // Custom Comparison View (Table & Recommendation)
    renderComparison: (comparison) => {
        let html = `
        <div class="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">`;

        // 1. Recommendation Card
        if (comparison.recommendation) {
            html += `
            <div class="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl border border-white/20 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-3 py-1 bg-amber-400/90 text-[10px] font-black uppercase tracking-widest rounded-full text-amber-950 shadow-sm">🏆 Rekomendasi Utama</span>
                    </div>
                    <h3 class="text-white font-extrabold text-xl mb-2">${comparison.recommendation.item.title}</h3>
                    <ul class="space-y-1.5">
                        ${comparison.recommendation.reasons.map(r => `
                            <li class="text-indigo-50 text-xs font-medium flex items-center gap-2">
                                <svg class="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                                ${r}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>`;
        }

        // 2. Premium Comparison Table
        html += `
        <div class="bg-white border border-indigo-50 rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
            <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-100">
                <table class="w-full text-left border-collapse table-auto min-w-[700px] comparison-table">
                    <thead>
                        <tr class="bg-indigo-50/50">
                            <th class="p-4 w-40 min-w-[160px] text-[10px] font-black uppercase tracking-widest text-indigo-400 border-b border-indigo-100 italic shrink-0">Spesifikasi</th>
                            ${comparison.items.map(item => `
                                <th class="p-4 min-w-[140px] text-[11px] font-black uppercase tracking-widest text-indigo-900 border-b border-indigo-100">
                                    <div class="truncate" title="${item.title}">
                                        ${item.title.split(' (')[0]}
                                        ${item.isRecommended ? '<span class="ml-1 text-amber-500">✨</span>' : ''}
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-indigo-50">
                        ${comparison.attributeLabels.map(attr => {
            const labels = {
                "kecepatan": "Latensi / Kecepatan",
                "koneksi": "Mode Koneksi",
                "keamanan": "Privasi Data",
                "biaya": "Skema Biaya",
                "price": "Harga Estimasi",
                "harga": "Harga Estimasi",
                "material": "Lingkup Materi"
            };
            const label = labels[attr.toLowerCase()] || attr.charAt(0).toUpperCase() + attr.slice(1);

            return `
                            <tr class="group hover:bg-slate-50 transition-colors">
                                <td class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap bg-slate-50/30">${label}</td>
                                ${comparison.items.map(item => {
                const val = item.attributes[attr];
                let displayVal = val !== undefined && val !== null ? val : '-';
                if (typeof val === 'boolean') {
                    displayVal = val
                        ? '<div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg></div>'
                        : '<div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"><svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></div>';
                }
                return `
                                    <td class="p-4 align-top">
                                        <div class="text-[11px] font-bold text-slate-700 leading-normal break-words">${displayVal}</div>
                                    </td>`;
            }).join('')}
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="bg-indigo-50/30 p-2 text-center text-[9px] text-indigo-300 font-bold uppercase tracking-widest border-t border-indigo-50 md:hidden">
                ← Geser untuk tabel lengkap →
            </div>
        </div>

        <!-- 3. Action Buttons -->
        <div class="grid grid-cols-2 gap-3 mt-4">
            ${comparison.items.map((item, idx) => `
                <a href="${item.url}" class="px-4 py-3 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border ${idx === 0 ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 shadow-indigo-200' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 shadow-slate-100'} ring-1 ring-black/5">
                    Pilih ${item.title.split(' ')[0]}
                </a>
            `).join('')}
        </div>
        </div>`;
        return html;
    }
};
