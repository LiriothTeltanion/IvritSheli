// Keep the pilot boundary small and eager; the artwork itself remains lazy.
export const LIVING_SCENE_KEYS = [
  "food.bread",
  "food.water",
  "greetings.hello",
  "greetings.good_morning",
  "actions.write",
  "numbers.one",
] as const;

export type LivingSceneKey = (typeof LIVING_SCENE_KEYS)[number];

export function isLivingSceneKey(key: string): key is LivingSceneKey {
  return (LIVING_SCENE_KEYS as readonly string[]).includes(key);
}

export const SCENE_PLAYBACK_COPY = {
  en: {
    play: "Replay the scene",
    still: "Still illustration · reduced motion",
    detail: "A short movement explains the meaning.",
  },
  es: {
    play: "Repetir la escena",
    still: "Ilustración estática · movimiento reducido",
    detail: "Un movimiento breve explica el significado.",
  },
  he: {
    play: "הפעלת הסצנה מחדש",
    still: "איור סטטי · תנועה מופחתת",
    detail: "תנועה קצרה ממחישה את המשמעות.",
  },
} as const;
