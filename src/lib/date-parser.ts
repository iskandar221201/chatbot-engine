/**
 * Indonesian Date Parser
 * Parses relative and absolute date expressions in Indonesian
 */

export interface ParsedDate {
    date: Date;
    original: string;
    timeHint?: 'pagi' | 'siang' | 'sore' | 'malam';
    confidence: number;
}

// Day name mappings
const DAY_NAMES: Record<string, number> = {
    'minggu': 0, 'ahad': 0,
    'senin': 1,
    'selasa': 2,
    'rabu': 3,
    'kamis': 4,
    'jumat': 5, 'jum\'at': 5, 'jumaah': 5,
    'sabtu': 6
};

// Month name mappings
const MONTH_NAMES: Record<string, number> = {
    'januari': 0, 'jan': 0,
    'februari': 1, 'feb': 1, 'peb': 1,
    'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'mei': 4,
    'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6,
    'agustus': 7, 'agt': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'oktober': 9, 'okt': 9,
    'november': 10, 'nov': 10, 'nop': 10,
    'desember': 11, 'des': 11
};

// Relative date keywords
const RELATIVE_DATES: Record<string, number> = {
    'kemarin': -1, 'kmrn': -1, 'kmarin': -1,
    'hari ini': 0, 'sekarang': 0, 'skrg': 0,
    'besok': 1, 'bsk': 1, 'besuk': 1,
    'lusa': 2
};

// Time hints
const TIME_HINTS: Record<string, 'pagi' | 'siang' | 'sore' | 'malam'> = {
    'pagi': 'pagi',
    'siang': 'siang',
    'sore': 'sore',
    'malam': 'malam',
    'subuh': 'pagi',
    'petang': 'sore'
};

export class DateParser {
    /**
     * Parse Indonesian date expression
     */
    static parse(text: string): ParsedDate | null {
        if (!text || typeof text !== 'string') return null;

        const cleanText = text.toLowerCase().trim();
        const now = new Date();
        let result: Date | null = null;
        let confidence = 0;
        let timeHint: 'pagi' | 'siang' | 'sore' | 'malam' | undefined;

        // Extract time hint
        for (const [hint, value] of Object.entries(TIME_HINTS)) {
            if (cleanText.includes(hint)) {
                timeHint = value;
                break;
            }
        }

        // 1. Try relative dates first ("besok", "lusa", etc.)
        for (const [keyword, offset] of Object.entries(RELATIVE_DATES)) {
            if (cleanText.includes(keyword)) {
                result = new Date(now);
                result.setDate(result.getDate() + offset);
                confidence = 95;
                break;
            }
        }

        // 2. Try "minggu depan", "bulan depan" patterns
        if (!result) {
            const weekMatch = cleanText.match(/minggu\s+(depan|ini)/);
            if (weekMatch) {
                result = new Date(now);
                const offset = weekMatch[1] === 'depan' ? 7 : 0;
                result.setDate(result.getDate() + offset);
                confidence = 85;
            }

            const monthMatch = cleanText.match(/bulan\s+(depan|ini)/);
            if (monthMatch) {
                result = new Date(now);
                const offset = monthMatch[1] === 'depan' ? 1 : 0;
                result.setMonth(result.getMonth() + offset);
                confidence = 85;
            }
        }

        // 3. Try day names ("senin", "selasa depan")
        if (!result) {
            for (const [dayName, dayIndex] of Object.entries(DAY_NAMES)) {
                if (cleanText.includes(dayName)) {
                    result = new Date(now);
                    const currentDay = result.getDay();
                    let daysToAdd = dayIndex - currentDay;

                    // If "depan" is mentioned or day has passed, go to next week
                    if (cleanText.includes('depan') || daysToAdd < 0) {
                        daysToAdd += 7;
                    }
                    // If it's today and no "depan", keep it as today
                    if (daysToAdd === 0 && !cleanText.includes('depan')) {
                        daysToAdd = 0;
                    }

                    result.setDate(result.getDate() + daysToAdd);
                    confidence = 80;
                    break;
                }
            }
        }

        // 4. Try absolute dates ("tanggal 5", "tgl 10 januari", "15 maret 2024")
        if (!result) {
            // Pattern: tanggal/tgl + number + optional month + optional year
            const dateMatch = cleanText.match(/(?:tanggal|tgl|tg|)\s*(\d{1,2})(?:\s+(\w+))?(?:\s+(\d{4}))?/);
            if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                if (day >= 1 && day <= 31) {
                    result = new Date(now);
                    result.setDate(day);
                    confidence = 75;

                    // Check for month
                    if (dateMatch[2]) {
                        const monthName = dateMatch[2].toLowerCase();
                        if (MONTH_NAMES[monthName] !== undefined) {
                            result.setMonth(MONTH_NAMES[monthName]);
                            confidence = 85;
                        }
                    }

                    // Check for year
                    if (dateMatch[3]) {
                        result.setFullYear(parseInt(dateMatch[3]));
                        confidence = 95;
                    }

                    // If date has passed and no month specified, assume next month
                    if (!dateMatch[2] && result < now) {
                        result.setMonth(result.getMonth() + 1);
                    }
                }
            }
        }

        // 5. Try ISO-like formats (2024-01-15, 15/01/2024)
        if (!result) {
            const isoMatch = cleanText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoMatch) {
                result = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
                confidence = 100;
            }

            const slashMatch = cleanText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (slashMatch) {
                result = new Date(parseInt(slashMatch[3]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
                confidence = 100;
            }
        }

        if (!result || isNaN(result.getTime())) return null;

        // Reset time to start of day
        result.setHours(0, 0, 0, 0);

        return {
            date: result,
            original: text,
            timeHint,
            confidence
        };
    }

    /**
     * Format date to Indonesian string
     */
    static format(date: Date, includeDay = true): string {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        if (includeDay) {
            return `${dayName}, ${day} ${month} ${year}`;
        }
        return `${day} ${month} ${year}`;
    }

    /**
     * Get relative description (e.g., "2 hari lagi", "kemarin")
     */
    static getRelative(date: Date): string {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'hari ini';
        if (diffDays === 1) return 'besok';
        if (diffDays === 2) return 'lusa';
        if (diffDays === -1) return 'kemarin';
        if (diffDays > 0 && diffDays <= 7) return `${diffDays} hari lagi`;
        if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} hari yang lalu`;
        if (diffDays > 7 && diffDays <= 30) return `${Math.ceil(diffDays / 7)} minggu lagi`;
        if (diffDays < -7 && diffDays >= -30) return `${Math.ceil(Math.abs(diffDays) / 7)} minggu yang lalu`;

        return DateParser.format(date, false);
    }
}

export default DateParser;
