export function formatCurrency(amount: number, symbol: string = 'Rp', locale: string = 'id-ID'): string {
    // Custom formatting for Indonesia (Millions/Jt)
    if (locale === 'id-ID' && amount >= 1000000) {
        return `${symbol} ${(amount / 1000000).toFixed(1)}Jt`;
    }

    // Standard formatting for other locales or smaller amounts
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currencyDisplay: 'symbol',
            currency: 'IDR' // Base format, symbol replaced below
        }).format(amount).replace('IDR', symbol);
    } catch (e) {
        return `${symbol} ${amount.toLocaleString(locale)}`;
    }
}
