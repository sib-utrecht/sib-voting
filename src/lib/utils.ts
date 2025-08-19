import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const LOCALE = "en-NL";
export const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });
export const numberFormat = new Intl.NumberFormat(LOCALE);
export const eurFormat = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
