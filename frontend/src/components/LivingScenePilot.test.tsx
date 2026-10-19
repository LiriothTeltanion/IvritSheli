import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DictionaryVisual } from "../types";
import { LIVING_SCENE_KEYS } from "../visuals/livingScenePilot";
import { DictionaryVisualCue } from "./DictionaryVisualCue";
import { LivingSceneStudio } from "./LivingSceneStudio";
import { SemanticWordIllustration } from "./SemanticWordIllustration";

function visual(key: string): DictionaryVisual {
  return {
    key,
    emoji: "",
    alt: { en: `Scene ${key}`, es: `Escena ${key}`, he: `סצנה ${key}` },
  };
}

function payload(): object {
  return {
    entries: LIVING_SCENE_KEYS.map((key) => ({
      word: "שלום",
      display_niqqud: "שָׁלוֹם",
      romanization: "shalom",
      visual: visual(key),
      senses: [{ gloss_en: key, gloss_es: key }],
    })),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("living scene integration", () => {
  it("replays from the real dictionary caller, including consecutive clicks", async () => {
    const { container } = render(
      <DictionaryVisualCue
        visual={visual("food.water")}
        locale="es"
        size="hero"
      />,
    );
    const replay = await screen.findByRole("button", {
      name: "Repetir la escena",
    });
    expect(
      container.querySelector("[data-living-play]"),
    ).not.toBeInTheDocument();
    fireEvent.click(replay);
    const first = container.querySelector('[data-living-play="true"]');
    expect(first).toBeInTheDocument();
    fireEvent.click(replay);
    expect(container.querySelector('[data-living-play="true"]')).not.toBe(
      first,
    );
    expect(container.querySelector("button button")).not.toBeInTheDocument();
  });

  it("keeps thumbnail and decorative illustrations free of nested interactive controls", () => {
    const { container, rerender } = render(
      <button type="button">
        <SemanticWordIllustration
          visual={visual("greetings.hello")}
          locale="en"
          size="thumbnail"
        />
      </button>,
    );
    expect(container.querySelectorAll("button")).toHaveLength(1);
    rerender(
      <SemanticWordIllustration
        visual={visual("food.water")}
        locale="en"
        size="hero"
        decorative
      />,
    );
    expect(container.querySelector("button")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("honors reduced motion before any user interaction", () => {
    vi.stubGlobal(
      "matchMedia",
      vi
        .fn()
        .mockReturnValue({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
    );
    const { container } = render(
      <SemanticWordIllustration
        visual={visual("actions.write")}
        locale="en"
        size="hero"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByText("Still illustration · reduced motion"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-living-play]"),
    ).not.toBeInTheDocument();
  });

  it("shows two people in the morning greeting and scopes duplicate material IDs", () => {
    const { container } = render(
      <>
        <SemanticWordIllustration
          visual={visual("greetings.good_morning")}
          locale="en"
        />
        <SemanticWordIllustration
          visual={visual("greetings.good_morning")}
          locale="en"
        />
      </>,
    );
    expect(
      container.querySelectorAll('[data-character-system="adult-editorial"]'),
    ).toHaveLength(4);
    const ids = Array.from(
      container.querySelectorAll("[id]"),
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of container.querySelectorAll(
      '[fill^="url(#"], [clip-path^="url(#"]',
    )) {
      const value =
        node.getAttribute("fill") ?? node.getAttribute("clip-path") ?? "";
      expect(ids).toContain(value.slice(5, -1));
    }
  });
});

describe("the actual illustration studio", () => {
  it("loads six product scenes, switches theme and language, and opens the real before captures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => payload() }),
    );
    const { container } = render(<LivingSceneStudio />);
    await waitFor(() =>
      expect(container.querySelectorAll("[data-pilot-key]")).toHaveLength(6),
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Repetir la escena" }),
      ).toHaveLength(6),
    );
    fireEvent.click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    fireEvent.click(
      screen.getByRole("button", { name: "Comparar con el original" }),
    );
    expect(
      container.querySelectorAll(
        'img[src^="/art-direction/living-scenes/before/dark-"]',
      ),
    ).toHaveLength(6);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "he" } });
    expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("main")).toHaveAttribute("lang", "he");
    expect(
      screen.getAllByRole("button", { name: "הפעלת הסצנה מחדש" }),
    ).toHaveLength(6);
  });

  it("reports failed catalog loading and recovers through the visible retry action", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValue({ ok: true, json: async () => payload() });
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<LivingSceneStudio />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar el catálogo",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() =>
      expect(container.querySelectorAll("[data-pilot-key]")).toHaveLength(6),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects an incomplete catalog instead of presenting partial review evidence", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ entries: [] }) }),
    );
    const { container } = render(<LivingSceneStudio />);
    await screen.findByRole("alert");
    expect(container.querySelector("[data-pilot-key]")).not.toBeInTheDocument();
  });
});
