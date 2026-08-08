/**
 * Data access lives behind this barrel so screens never import from
 * `data/demo/*` directly. When real content arrives — LDT survey data, a synced
 * catalogue — it is swapped in here and no screen changes.
 */
export * from './demo';
