import type { Currency } from "../types";

const localeMap: Record<Currency, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE'
};

export const getCurrencyFormatter = (currency: Currency = 'BRL') => {
    const locale = localeMap[currency] || 'pt-BR';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    });
};