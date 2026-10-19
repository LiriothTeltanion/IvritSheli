// Private review surface for the six real product scenes. The before images
// are retained renders of f623fa0, not recreated or cosmetically staged mocks.
import { useEffect, useState } from "react";
import type { DictionaryVisual, Locale } from "../types";
import { LIVING_SCENE_KEYS } from "../visuals/livingScenePilot";
import { RELEASE_VERSION } from "../release";
import { DictionaryVisualCue } from "./DictionaryVisualCue";
import "./living-scene-studio.css";

const COPY = {
  es: {
    eyebrow: "IVRIT SHELI · ESTUDIO DE ILUSTRACIÓN",
    title: "El hebreo cobra vida.",
    intro:
      "Seis pequeñas escenas. Materiales que se sienten, gestos que explican y movimiento a tu ritmo.",
    status: "Piloto local · seis escenas del catálogo",
    compare: "Comparar con el original",
    current: "Nueva ilustración · SVG en vivo",
    before: "Antes · captura de la versión 2.12.3",
    light: "Claro",
    dark: "Oscuro",
    theme: "Tema de las ilustraciones",
    language: "Idioma",
    loading: "Preparando las escenas…",
    error: "No se pudo cargar el catálogo. Vuelve a intentarlo.",
    retry: "Reintentar",
    footer:
      "Ilustración vectorial original · sin fuentes ni imágenes externas · alternativa estática accesible",
    note: "Toca «Repetir la escena» para explorar cada gesto. La preferencia de movimiento reducido de tu dispositivo siempre se respeta.",
    catalog: "Abrir el catálogo completo",
    chapter: "DEL OBJETO AL ENCUENTRO",
    descriptions: [
      "Corteza, miga y madera.",
      "Un gesto. El agua cambia de lugar.",
      "Dos vecinos. Un saludo compartido.",
      "La mañana empieza con un encuentro.",
      "La mano deja un trazo.",
      "Una taza. Una unidad.",
    ],
  },
  en: {
    eyebrow: "IVRIT SHELI · ILLUSTRATION STUDIO",
    title: "Hebrew comes to life.",
    intro:
      "Six small scenes. Tactile materials, meaningful gestures and movement at your own pace.",
    status: "Local pilot · six catalog scenes",
    compare: "Compare with the original",
    current: "New illustration · live SVG",
    before: "Before · version 2.12.3 capture",
    light: "Light",
    dark: "Dark",
    theme: "Illustration theme",
    language: "Language",
    loading: "Preparing the scenes…",
    error: "The catalog could not be loaded. Please try again.",
    retry: "Try again",
    footer:
      "Original vector illustration · no external fonts or images · accessible still alternative",
    note: "Choose “Replay the scene” to explore each gesture. Your device’s reduced-motion preference is always respected.",
    catalog: "Open the complete catalog",
    chapter: "FROM OBJECT TO ENCOUNTER",
    descriptions: [
      "Crust, crumb and wood.",
      "One gesture. Water changes place.",
      "Two neighbors. A shared greeting.",
      "A morning begins with connection.",
      "A hand leaves a mark.",
      "One cup. One unit.",
    ],
  },
  he: {
    eyebrow: "עברית שלי · סטודיו לאיור",
    title: "העברית מתעוררת לחיים.",
    intro:
      "שש סצנות קטנות. חומרים עשירים, מחוות שממחישות משמעות ותנועה בקצב שלך.",
    status: "פיילוט מקומי · שש סצנות מהקטלוג",
    compare: "השוואה לאיור המקורי",
    current: "איור חדש · SVG חי",
    before: "לפני · צילום מגרסה 2.12.3",
    light: "בהיר",
    dark: "כהה",
    theme: "ערכת צבעי האיורים",
    language: "שפה",
    loading: "מכינים את הסצנות…",
    error: "לא ניתן לטעון את הקטלוג. אפשר לנסות שוב.",
    retry: "ניסיון נוסף",
    footer:
      "איור וקטורי מקורי · ללא גופנים או תמונות חיצוניים · חלופה סטטית נגישה",
    note: "בחרו בהפעלת הסצנה מחדש כדי לצפות בכל מחווה. העדפת המכשיר לתנועה מופחתת תמיד נשמרת.",
    catalog: "פתיחת הקטלוג המלא",
    chapter: "מחפץ למפגש",
    descriptions: [
      "קרום, פירורים ועץ.",
      "מחווה אחת. המים עוברים מקום.",
      "שני שכנים. ברכה משותפת.",
      "הבוקר מתחיל במפגש.",
      "היד משאירה קו.",
      "כוס אחת. יחידה אחת.",
    ],
  },
} as const;

interface Entry {
  word: string;
  display_niqqud: string;
  romanization?: string;
  visual: DictionaryVisual;
  senses: { gloss_en: string; gloss_es: string }[];
}

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Entry>;
  return (
    typeof entry.word === "string" &&
    typeof entry.display_niqqud === "string" &&
    typeof entry.visual?.key === "string" &&
    !!entry.visual.alt &&
    Array.isArray(entry.senses) &&
    typeof entry.senses[0]?.gloss_en === "string" &&
    typeof entry.senses[0]?.gloss_es === "string"
  );
}

export function LivingSceneStudio(): React.JSX.Element {
  const requestedLocale = new URLSearchParams(window.location.search).get(
    "lang",
  );
  const [locale, setLocale] = useState<Locale>(
    requestedLocale === "he" || requestedLocale === "en"
      ? requestedLocale
      : "es",
  );
  const [theme, setTheme] = useState<"dark" | "light">(
    new URLSearchParams(window.location.search).get("theme") === "dark"
      ? "dark"
      : "light",
  );
  const [compare, setCompare] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const copy = COPY[locale];

  useEffect(() => {
    const previous = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = previous;
    };
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    void fetch("/content/starter-dictionary-v2.8.json", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("catalog-unavailable");
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("entries" in payload) ||
          !Array.isArray(payload.entries)
        )
          throw new Error("invalid-catalog");
        const reviewed = payload.entries.filter(isEntry);
        const selected = LIVING_SCENE_KEYS.map((key) =>
          reviewed.find((entry) => entry.visual.key === key),
        );
        if (selected.some((entry) => !entry))
          throw new Error("incomplete-pilot");
        if (!controller.signal.aborted)
          setEntries(selected.filter((entry): entry is Entry => !!entry));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <main
      className="scene-studio"
      data-theme={theme}
      dir={locale === "he" ? "rtl" : "ltr"}
      lang={locale}
    >
      <div className="scene-studio__shell">
        <header className="scene-studio__masthead">
          <a
            className="scene-studio__brand"
            href={`/?lang=${locale}`}
            aria-label="Ivrit Sheli"
          >
            IVRIT{" "}
            <span lang="he" dir="rtl">
              שלי
            </span>
          </a>
          <span className="scene-studio__version">
            <bdi>v{RELEASE_VERSION}</bdi> · {copy.status}
          </span>
          <label className="scene-studio__locale">
            {copy.language}
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="he">עברית</option>
            </select>
          </label>
        </header>
        <section
          className="scene-studio__introduction"
          aria-labelledby="scene-studio-title"
        >
          <p className="scene-studio__eyebrow">{copy.eyebrow}</p>
          <h1 id="scene-studio-title">{copy.title}</h1>
          <p className="scene-studio__intro">{copy.intro}</p>
          <div className="scene-studio__toolbar">
            <fieldset aria-label={copy.theme}>
              <legend>{copy.theme}</legend>
              {(["light", "dark"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="studio-theme"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                  />
                  <span>{copy[value]}</span>
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className="scene-studio__compare"
              aria-pressed={compare}
              onClick={() => setCompare((value) => !value)}
            >
              {copy.compare}
            </button>
          </div>
          <p className="scene-studio__note">{copy.note}</p>
        </section>
        <div className="scene-studio__section-label">
          <span>{copy.chapter}</span>
          <span aria-hidden="true">01 — 06</span>
        </div>
        {error ? (
          <div role="alert" className="scene-studio__message">
            <p>{copy.error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {copy.retry}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p role="status" className="scene-studio__message">
            {copy.loading}
          </p>
        ) : (
          <div
            className={`scene-studio__grid${compare ? " scene-studio__grid--compare" : ""}`}
          >
            {entries.map((entry, index) => (
              <article
                className="scene-studio__card"
                key={entry.visual.key}
                data-pilot-key={entry.visual.key}
              >
                <header>
                  <span className="scene-studio__index">0{index + 1}</span>
                  <bdi>{entry.visual.key}</bdi>
                </header>
                <div className="scene-studio__art-pair">
                  {compare && (
                    <figure>
                      <img
                        src={`/art-direction/living-scenes/before/${theme}-${entry.visual.key}.png`}
                        alt={`${copy.before}: ${entry.word}`}
                        width="900"
                        height="675"
                        loading="lazy"
                      />
                      <figcaption>{copy.before}</figcaption>
                    </figure>
                  )}
                  <figure>
                    <DictionaryVisualCue
                      visual={entry.visual}
                      locale={locale}
                      size="hero"
                    />
                    <figcaption>{copy.current}</figcaption>
                  </figure>
                </div>
                <div className="scene-studio__caption">
                  <div>
                    <h2 lang="he" dir="rtl">
                      {entry.display_niqqud || entry.word}
                    </h2>
                    <p>
                      {locale === "he"
                        ? entry.word
                        : entry.senses[0]![
                            locale === "es" ? "gloss_es" : "gloss_en"
                          ]}
                    </p>
                  </div>
                  {entry.romanization && (
                    <bdi className="scene-studio__romanization">
                      {entry.romanization}
                    </bdi>
                  )}
                </div>
                <p className="scene-studio__description">
                  {copy.descriptions[index]}
                </p>
              </article>
            ))}
          </div>
        )}
        <footer className="scene-studio__footer">
          <p>{copy.footer}</p>
          <a href={`/?visualQa=1&group=all&lang=${locale}&theme=${theme}`}>
            {copy.catalog} <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </main>
  );
}
