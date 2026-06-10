import { describe, it, expect } from "vitest";
import { buildSendero, senderoSummary } from "./sendero";

describe("buildSendero", () => {
  it("tiene 49 estaciones numeradas 1..49", () => {
    const s = buildSendero("A1", 0);
    expect(s).toHaveLength(49);
    expect(s[0].number).toBe(1);
    expect(s[48].number).toBe(49);
  });

  it("un niño A1 sin lecciones tiene la primera como actual y el resto del nivel disponible", () => {
    const s = buildSendero("A1", 0);
    expect(s[0].state).toBe("current");
    // Las otras A1 (índices 1..7) disponibles
    expect(s[1].state).toBe("available");
    // A2+ bloqueadas
    expect(s[8].state).toBe("locked");
  });

  it("marca como completadas las unidades de niveles inferiores al actual", () => {
    const s = buildSendero("B1", 0);
    // A1 (0-7) y A2 (8-15) completadas
    expect(s.slice(0, 16).every((x) => x.state === "completed")).toBe(true);
    // Primera B1 (índice 16) actual
    expect(s[16].state).toBe("current");
    // B2/C1/C2 bloqueadas
    expect(s[48].state).toBe("locked");
  });

  it("avanza la estación actual con el conteo de lecciones dentro del nivel", () => {
    const s = buildSendero("A1", 3);
    expect(s[0].state).toBe("completed");
    expect(s[2].state).toBe("completed");
    expect(s[3].state).toBe("current");
    expect(s[4].state).toBe("available");
  });

  it("no retrocede al exceder el número de unidades del nivel (capado)", () => {
    const s = buildSendero("A1", 99);
    // 8 unidades A1: la última (índice 7) queda como actual, las previas completadas
    expect(s[7].state).toBe("current");
    expect(s.slice(0, 7).every((x) => x.state === "completed")).toBe(true);
  });

  it("C2 es su propio nivel: A1..C1 completadas y la primera C2 actual", () => {
    const s = buildSendero("C2", 0);
    // A1..C1 (0-42) completadas, C2 (43-48) activas
    expect(s[42].state).toBe("completed");
    expect(s[43].state).toBe("current");
  });

  it("senderoSummary calcula completadas y %", () => {
    const s = buildSendero("B1", 0);
    const sum = senderoSummary(s);
    expect(sum.total).toBe(49);
    expect(sum.completed).toBe(16);
    expect(sum.pct).toBe(Math.round((16 / 49) * 100));
    expect(sum.current?.number).toBe(17);
  });
});
