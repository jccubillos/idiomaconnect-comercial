import { describe, it, expect } from "vitest";
import { ageSegment, buildLessonSystemPrompt, type KidPromptInput } from "./prompts";

describe("ageSegment", () => {
  it("clasifica 8-12 como niño/a", () => {
    expect(ageSegment("8 años", "niño").descriptor).toContain("niño");
    expect(ageSegment("12 años", "niña").register).toContain("NIÑO");
  });

  it("clasifica 13-17 como adolescente", () => {
    const s = ageSegment("15 años", "niña");
    expect(s.descriptor).toContain("adolescente");
    expect(s.register).toContain("ADOLESCENTE");
    expect(s.defaultTone).not.toContain("juguetón");
  });

  it("clasifica 18+ como adulto", () => {
    const s = ageSegment("25 años", null);
    expect(s.descriptor).toContain("adulto");
    expect(s.register).toContain("ADULTO");
  });

  it("usa la palabra 'adolescente' del texto cuando no hay número", () => {
    expect(ageSegment("adolescente", null).descriptor).toContain("adolescente");
  });

  it("cae a niño/a por defecto cuando la edad es desconocida", () => {
    expect(ageSegment("", null).register).toContain("NIÑO");
  });
});

describe("buildLessonSystemPrompt — registro por edad", () => {
  const baseKid: KidPromptInput = {
    name: "Antonia",
    gender: "niña",
    ageDesc: "10 años",
    grade: "5to básico",
    hobbies: "tenis",
    tone: null,
    familyMembers: [],
    cefrCode: "A1",
    cefrName: "Explorer",
    recentTopics: [],
  };
  const world = { key: "london_hub", name: "London Hub", tagline: "Travel" };

  it("un niño recibe tono infantil y un adulto NO", () => {
    const kidPrompt = buildLessonSystemPrompt(baseKid, world);
    expect(kidPrompt).toContain("REGISTRO SEGÚN EDAD");
    expect(kidPrompt).toContain("NIÑO");

    const adultPrompt = buildLessonSystemPrompt(
      { ...baseKid, ageDesc: "30 años", grade: null },
      world,
    );
    expect(adultPrompt).toContain("ADULTO");
    expect(adultPrompt).not.toContain("cursando"); // sin grado escolar para adultos
  });

  it("respeta un tono personalizado del perfil por encima del default por edad", () => {
    const p = buildLessonSystemPrompt({ ...baseKid, tone: "tono custom XYZ" }, world);
    expect(p).toContain("tono custom XYZ");
  });
});
