/*
 * Guard against painted backgrounds that are missing on disk.
 *
 * A scene names its painting by a string (`<PaintedRoom name="scene-desert" />`) and the browser fetches
 * `<name>.webp`, or `<name>-dark.webp` in the dark theme. A typo or a file left out of a commit is not an error
 * anywhere: the image simply fails to load and the scene shows its flat fallback. So every name a scene uses must
 * have its file and its manifest entry, every dark painting the code announces must exist, and no dark file may sit
 * unused because its name was left out of the list.
 */

import { describe, expect, it } from 'vitest';
import { hasDarkPainting } from './semantic-scenes/SemanticScenePrimitives';

const scenes = import.meta.glob('./semantic-scenes/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const files = Object.keys(import.meta.glob('../../public/art-direction/living-scenes/painted/*.webp')).map((path) =>
  path.slice(path.lastIndexOf('/') + 1),
);
const manifest = JSON.parse(
  Object.values(
    import.meta.glob('../../public/art-direction/living-scenes/painted/manifest.json', { query: '?raw', import: 'default', eager: true }),
  )[0] as string,
) as { assets: Record<string, unknown> };

/**
 * Every painting name inside a `<PaintedRoom name=...>` tag: the plain string, or both arms of a ternary
 * (`floor === 'tiles' ? 'room-action-tiles' : 'room-action'` names two paintings, not `tiles`).
 */
function usedNames(): string[] {
  const names = new Set<string>();
  for (const source of Object.values(scenes)) {
    for (const tag of source.matchAll(/<PaintedRoom\s+name=(\{[^}]*\}|"[^"]*")/g)) {
      for (const literal of (tag[1] ?? '').matchAll(/(?:^"|^\{\s*['"]|[?:]\s*['"])([a-z0-9-]+)['"]/g)) names.add(literal[1] ?? '');
    }
  }
  return [...names].sort();
}

describe('painted scene backgrounds', () => {
  const names = usedNames();

  it('finds the paintings the scenes use', () => {
    expect(names.length).toBeGreaterThan(20);
  });

  it.each(names)('%s has its daylight file and manifest entry', (name) => {
    expect(files).toContain(`${name}.webp`);
    expect(manifest.assets).toHaveProperty([`${name}.webp`]);
  });

  it.each(names.filter((name) => hasDarkPainting(name)))('%s has its dark file and manifest entry', (name) => {
    expect(files).toContain(`${name}-dark.webp`);
    expect(manifest.assets).toHaveProperty([`${name}-dark.webp`]);
  });

  it('leaves no dark painting on disk that the code never shows', () => {
    const orphans = files
      .filter((file) => file.endsWith('-dark.webp'))
      .map((file) => file.slice(0, -'-dark.webp'.length))
      .filter((name) => !hasDarkPainting(name));
    expect(orphans).toEqual([]);
  });
});
