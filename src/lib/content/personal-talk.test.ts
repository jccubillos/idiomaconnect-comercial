import { describe, it, expect } from "vitest";
import { buildPersonalTalkPrompt } from "./personal-talk";

describe("buildPersonalTalkPrompt", () => {
  it("devuelve una pregunta con texto en inglés, español e ideas", () => {
    const p = buildPersonalTalkPrompt({ hobbies: null, seed: 0 });
    expect(p.prompt_en.length).toBeGreaterThan(0);
    expect(p.prompt_es.length).toBeGreaterThan(0);
    expect(p.bullet_ideas.length).toBeGreaterThanOrEqual(2);
  });

  it("personaliza con el hobby cuando existe (seed 0)", () => {
    const p = buildPersonalTalkPrompt({ hobbies: "fútbol", seed: 0 });
    expect(p.prompt_en).toContain("fútbol");
    expect(p.prompt_es).toContain("fútbol");
  });

  it("sin hobbies, usa preguntas genéricas (sin placeholders vacíos)", () => {
    const p = buildPersonalTalkPrompt({ hobbies: "", seed: 0 });
    expect(p.prompt_en).not.toContain("undefined");
    expect(p.prompt_en).not.toMatch(/\s{2,}/); // sin doble espacio por hueco vacío
  });

  it("es determinista para el mismo seed", () => {
    const a = buildPersonalTalkPrompt({ hobbies: "leer", seed: 3 });
    const b = buildPersonalTalkPrompt({ hobbies: "leer", seed: 3 });
    expect(a.prompt_en).toBe(b.prompt_en);
  });

  it("rota la pregunta con el seed", () => {
    const a = buildPersonalTalkPrompt({ hobbies: null, seed: 0 });
    const b = buildPersonalTalkPrompt({ hobbies: null, seed: 1 });
    expect(a.prompt_en).not.toBe(b.prompt_en);
  });
});
