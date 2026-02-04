/**
 * Indonesian Number Parser
 * Parses Indonesian number words and shorthand formats
 */

// Basic number words
const UNITS: Record<string, number> = {
    'nol': 0, 'kosong': 0,
    'satu': 1, 'se': 1, 'esa': 1,
    'dua': 2,
    'tiga': 3,
    'empat': 4,
    'lima': 5,
    'enam': 6,
    'tujuh': 7,
    'delapan': 8,
    'sembilan': 9
};

const TEENS: Record<string, number> = {
    'sepuluh': 10,
    'sebelas': 11,
    'duabelas': 12, 'dua belas': 12,
    'tigabelas': 13, 'tiga belas': 13,
    'empatbelas': 14, 'empat belas': 14,
    'limabelas': 15, 'lima belas': 15,
    'enambelas': 16, 'enam belas': 16,
    'tujuhbelas': 17, 'tujuh belas': 17,
    'delapanbelas': 18, 'delapan belas': 18,
    'sembilanbelas': 19, 'sembilan belas': 19
};

const TENS: Record<string, number> = {
    'sepuluh': 10,
    'duapuluh': 20, 'dua puluh': 20,
    'tigapuluh': 30, 'tiga puluh': 30,
    'empatpuluh': 40, 'empat puluh': 40,
    'limapuluh': 50, 'lima puluh': 50,
    'enampuluh': 60, 'enam puluh': 60,
    'tujuhpuluh': 70, 'tujuh puluh': 70,
    'delapanpuluh': 80, 'delapan puluh': 80,
    'sembilanpuluh': 90, 'sembilan puluh': 90
};

// Multipliers
const MULTIPLIERS: Record<string, number> = {
    'ratus': 100, 'seratus': 100,
    'ribu': 1000, 'seribu': 1000, 'rb': 1000, 'k': 1000,
    'juta': 1000000, 'sejuta': 1000000, 'jt': 1000000, 'm': 1000000,
    'miliar': 1000000000, 'milyar': 1000000000, 'b': 1000000000,
    'triliun': 1000000000000, 't': 1000000000000
};

// Special fractions
const FRACTIONS: Record<string, number> = {
    'setengah': 0.5,
    'seperempat': 0.25,
    'sepertiga': 0.333333
};

export class NumberParser {
    /**
     * Parse Indonesian number expression to numeric value
     */
    static parse(text: string): number | null {
        if (!text || typeof text !== 'string') return null;

        let cleanText = text.toLowerCase().trim();

        // Remove common prefixes
        cleanText = cleanText.replace(/^(rp\.?|idr|usd|\$)\s*/i, '');
        cleanText = cleanText.replace(/,-$/, '');

        // 1. Try direct numeric parsing first (1000, 1.500.000, 1,5)
        const directMatch = cleanText.match(/^[\d.,]+$/);
        if (directMatch) {
            return this.parseNumeric(cleanText);
        }

        // 2. Try shorthand format (2jt, 500rb, 1.5m, 2,5juta)
        const shorthandResult = this.parseShorthand(cleanText);
        if (shorthandResult !== null) {
            return shorthandResult;
        }

        // 3. Try word format (dua juta, seratus ribu)
        const wordResult = this.parseWords(cleanText);
        if (wordResult !== null) {
            return wordResult;
        }

        return null;
    }

    /**
     * Parse numeric string with Indonesian formatting
     */
    private static parseNumeric(text: string): number | null {
        // Indonesian uses . as thousand separator and , as decimal
        // Check if it looks like Indonesian format (dots as thousands)
        if (text.includes('.') && !text.includes(',')) {
            // Could be thousand separator or decimal
            const parts = text.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                // Thousand separator (e.g., 1.500.000)
                return parseInt(text.replace(/\./g, ''));
            }
        }

        // Replace Indonesian decimal comma with period
        let normalized = text.replace(/\./g, '').replace(',', '.');
        const result = parseFloat(normalized);
        return isNaN(result) ? null : result;
    }

    /**
     * Parse shorthand formats (2jt, 500rb, 1.5m)
     */
    private static parseShorthand(text: string): number | null {
        // Pattern: number + optional decimal + multiplier suffix
        const patterns = [
            /(\d+(?:[.,]\d+)?)\s*(juta|jt)/i,
            /(\d+(?:[.,]\d+)?)\s*(ribu|rb|k)/i,
            /(\d+(?:[.,]\d+)?)\s*(miliar|milyar|m(?!enit|eter))/i,
            /(\d+(?:[.,]\d+)?)\s*(triliun|t(?!ahun|anggal))/i,
            /(\d+(?:[.,]\d+)?)\s*(ratus)/i
        ];

        const multiplierValues: Record<string, number> = {
            'juta': 1000000, 'jt': 1000000,
            'ribu': 1000, 'rb': 1000, 'k': 1000,
            'miliar': 1000000000, 'milyar': 1000000000, 'm': 1000000,
            'triliun': 1000000000000, 't': 1000000000000,
            'ratus': 100
        };

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const numStr = match[1].replace(',', '.');
                const num = parseFloat(numStr);
                const suffix = match[2].toLowerCase();
                const multiplier = multiplierValues[suffix] || 1;
                return num * multiplier;
            }
        }

        return null;
    }

    /**
     * Parse word-based numbers (dua juta lima ratus ribu)
     */
    private static parseWords(text: string): number | null {
        let total = 0;
        let current = 0;
        let hasMatch = false;

        // Normalize text
        const words = text.split(/\s+/);

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const nextWord = words[i + 1] || '';
            const twoWords = word + ' ' + nextWord;

            // Check fractions first
            if (FRACTIONS[word]) {
                current += FRACTIONS[word];
                hasMatch = true;
                continue;
            }

            // Check teens (dua belas, etc.)
            if (TEENS[twoWords]) {
                current += TEENS[twoWords];
                hasMatch = true;
                i++; // Skip next word
                continue;
            }
            if (TEENS[word]) {
                current += TEENS[word];
                hasMatch = true;
                continue;
            }

            // Check tens (dua puluh, etc.)
            if (TENS[twoWords]) {
                current += TENS[twoWords];
                hasMatch = true;
                i++;
                continue;
            }
            if (word === 'puluh') {
                current *= 10;
                hasMatch = true;
                continue;
            }

            // Check units
            if (UNITS[word] !== undefined) {
                current += UNITS[word];
                hasMatch = true;
                continue;
            }

            // Check multipliers
            if (MULTIPLIERS[word]) {
                if (current === 0) current = 1; // "sejuta" = 1 juta
                const multiplier = MULTIPLIERS[word];
                if (multiplier >= 1000) {
                    current *= multiplier;
                    total += current;
                    current = 0;
                } else {
                    current *= multiplier;
                }
                hasMatch = true;
                continue;
            }

            // Check for embedded numbers (angka)
            const numMatch = word.match(/^\d+$/);
            if (numMatch) {
                current += parseInt(word);
                hasMatch = true;
            }
        }

        total += current;

        return hasMatch ? total : null;
    }

    /**
     * Format number to Indonesian currency string
     */
    static formatCurrency(value: number, symbol = 'Rp', locale = 'id-ID'): string {
        try {
            return symbol + ' ' + value.toLocaleString(locale);
        } catch {
            return symbol + ' ' + value.toLocaleString();
        }
    }

    /**
     * Format number to Indonesian words (for small numbers)
     */
    static toWords(value: number): string {
        if (value === 0) return 'nol';
        if (value < 0) return 'minus ' + this.toWords(Math.abs(value));

        const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
        const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
            'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

        if (value < 10) return units[value];
        if (value < 20) return teens[value - 10];
        if (value < 100) {
            const tens = Math.floor(value / 10);
            const unit = value % 10;
            return units[tens] + ' puluh' + (unit ? ' ' + units[unit] : '');
        }
        if (value < 1000) {
            const hundreds = Math.floor(value / 100);
            const rest = value % 100;
            return (hundreds === 1 ? 'seratus' : units[hundreds] + ' ratus') + (rest ? ' ' + this.toWords(rest) : '');
        }
        if (value < 1000000) {
            const thousands = Math.floor(value / 1000);
            const rest = value % 1000;
            return (thousands === 1 ? 'seribu' : this.toWords(thousands) + ' ribu') + (rest ? ' ' + this.toWords(rest) : '');
        }
        if (value < 1000000000) {
            const millions = Math.floor(value / 1000000);
            const rest = value % 1000000;
            return (millions === 1 ? 'satu juta' : this.toWords(millions) + ' juta') + (rest ? ' ' + this.toWords(rest) : '');
        }

        return value.toLocaleString('id-ID');
    }
}

export default NumberParser;
