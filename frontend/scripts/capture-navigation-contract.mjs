export const LEARN_NAVIGATION_LABELS = Object.freeze({
  en: Object.freeze(['Words', 'Learn']),
  es: Object.freeze(['Palabras', 'Aprender']),
  he: Object.freeze(['מילים', 'לימוד']),
});

export function accessibleNameStartsWith(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}(?:[.:\\s]|$)`, 'i');
}

/**
 * Find only a real primary-navigation button. Content buttons can begin with
 * the same translated word, so a page-wide role query is not a safe contract.
 */
export async function findVisibleSidebarNavigation(page, labels) {
  const sidebar = page.locator('#app-sidebar');
  for (const label of Array.isArray(labels) ? labels : [labels]) {
    const candidates = sidebar.getByRole('button', { name: accessibleNameStartsWith(label) });
    for (const candidate of await candidates.all()) {
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return null;
}
