import { describe, it, expect } from "vitest";
import { VOCABULARY, buildBattleSession, wordsForLevel } from "./vocabulary";
import type { CEFRLevel } from "@/lib/supabase/database.types";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

describe("VOCABULARY bank", () => {
  it("tiene palabras en los 6 niveles", () => {
    for (const lvl of LEVELS) {
      expect(VOCABULARY[lvl].length).toBeGreaterThanOrEqual(12);
    }
  });

  it("no repite la palabra en inglés dentro de un nivel", () => {
    for (const lvl of LEVELS) {
      const ens = VOCABULARY[lvl].map((w) => w.en.toLowerCase());
      expect(new Set(ens).size).toBe(ens.length);
    }
  });

  it("cada palabra tiene traducción y pronunciación", () => {
    for (const lvl of LEVELS) {
      for (const w of VOCABULARY[lvl]) {
        expect(w.en.length).toBeGreaterThan(0);
        expect(w.es.length).toBeGreaterThan(0);
        expect(w.pron.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildBattleSession", () => {
  it("devuelve la cantidad pedida (o el máximo del nivel)", () => {
    const s = buildBattleSession("A1", 12);
    expect(s).toHaveLength(12);
  });

  it("cada palabra tiene 4 opciones, únicas, e incluye la respuesta correcta", () => {
    const s = buildBattleSession("B1", 10);
    for (const w of s) {
      expect(w.options).toHaveLength(4);
      expect(new Set(w.options).size).toBe(4);
      expect(w.options).toContain(w.es);
    }
  });

  it("la posición de la respuesta correcta varía entre palabras (no siempre la misma)", () => {
    const s = buildBattleSession("A1", 12);
    const positions = new Set(s.map((w) => w.options.indexOf(w.es)));
    // Con 12 palabras y 4 posiciones, deberían aparecer al menos 2 posiciones distintas.
    expect(positions.size).toBeGreaterThan(1);
  });

  it("los distractores provienen del mismo nivel", () => {
    const pool = new Set(wordsForLevel("A2").map((w) => w.es));
    const s = buildBattleSession("A2", 8);
    for (const w of s) {
      for (const opt of w.options) {
        expect(pool.has(opt)).toBe(true);
      }
    }
  });
});
