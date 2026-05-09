/**
 * Centralised user-facing strings.
 *
 * The pattern is intentionally lightweight — no library, no JSX-in-strings
 * complexity, just a flat object. Components import `t()` and call it with
 * a dotted key. The active locale is picked once at boot and cached.
 *
 * To add a new locale: copy `en` to e.g. `es`, translate, register it in the
 * `bundles` map, and `setLocale('es')` will pick it up. We default to English
 * if a key is missing in the active bundle.
 */

import en from './locales/en';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja';

export type Bundle = typeof en;

const bundles: Partial<Record<Locale, Bundle>> = { en };

let active: Locale = 'en';
let activeBundle: Bundle = en;

export function registerLocale(locale: Locale, bundle: Bundle): void {
  bundles[locale] = bundle;
}

export function setLocale(locale: Locale): void {
  active = locale;
  activeBundle = bundles[locale] ?? en;
}

export function getLocale(): Locale {
  return active;
}

/**
 * Translate. Pass a dotted key (e.g. "home.predictWindow") and any positional
 * args; format markers `{0}`, `{1}` etc. are replaced in order.
 *
 *   t('home.daysUntil', 3) → "In 3 days"
 */
export function t(key: string, ...args: Array<string | number>): string {
  const value = lookup(activeBundle, key) ?? lookup(en, key) ?? key;
  if (args.length === 0) return value;
  return value.replace(/\{(\d+)\}/g, (_, idx) => String(args[Number(idx)] ?? ''));
}

function lookup(bundle: Bundle, key: string): string | undefined {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = bundle;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}
