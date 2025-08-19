export const LOCALE = "en-NL";

export const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const numberFormat = new Intl.NumberFormat(LOCALE);
