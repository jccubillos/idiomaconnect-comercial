import { describe, it, expect } from "vitest";
import { pickWorldObjective } from "./world-tracks";

describe("pickWorldObjective — cada mundo enseña algo DISTINTO", () => {
  it("mundos distintos producen enfoques distintos", () => {
    const grammar = pickWorldObjective("grammar", "A1", 0).focus;
    const vocab = pickWorldObjective("vocab", "A1", 0).focus;
    const sound = pickWorldObjective("sound", "A1", 0).focus;
    const chat = pickWorldObjective("chat", "A1", 0).focus;
    const writing = pickWorldObjective("writing", "A1", 0).focus;
    const focuses = [grammar, vocab, sound, chat, writing];
    expect(new Set(focuses).size).toBe(5); // los 5 son diferentes
  });

  it("el mundo de vocabulario PROHÍBE explícitamente la gramática", () => {
    const o = pickWorldObjective("vocab", "A1", 0);
    expect(o.focus.toLowerCase()).toContain("vocabulario");
    expect(o.avoid?.toLowerCase()).toContain("gramática");
  });

  it("el mundo de gramática se enfoca en reglas/gramática", () => {
    expect(pickWorldObjective("grammar", "A1", 0).focus.toLowerCase()).toContain("gramática");
  });

  it("el mundo de sonido se enfoca en pronunciación", () => {
    expect(pickWorldObjective("sound", "A1", 0).focus.toLowerCase()).toContain("pronunciación");
  });

  it("el mundo personal gira en torno a los hobbies", () => {
    expect(pickWorldObjective("personal", "A1", 0).focus.toLowerCase()).toContain("hobbies");
  });

  it("los mundos temáticos rotan de tema según el índice", () => {
    const t0 = pickWorldObjective("chat", "A1", 0).theme;
    const t1 = pickWorldObjective("chat", "A1", 1).theme;
    expect(t0).not.toBe(t1);
  });

  it("siempre devuelve un objetivo completo (campos no vacíos)", () => {
    for (const w of ["grammar", "vocab", "sound", "chat", "writing", "london_hub", "cyber_tokyo", "personal", "desconocido"]) {
      const o = pickWorldObjective(w, "B1", 3);
      expect(o.focus.trim(), w).toBeTruthy();
      expect(o.theme.trim(), w).toBeTruthy();
      expect(o.canDo.trim(), w).toBeTruthy();
      expect(o.teach.trim(), w).toBeTruthy();
    }
  });
});
