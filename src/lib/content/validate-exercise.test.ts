import { describe, it, expect } from "vitest";
import { isValidMC, isValidFITB, filterValidMC } from "./validate-exercise";

describe("isValidMC", () => {
  const base = { q: "She ___ happy.", options: ["is", "are", "am", "be"], answer: "is" };

  it("acepta una pregunta correcta (una sola respuesta entre las opciones)", () => {
    expect(isValidMC(base)).toBe(true);
  });

  it("rechaza si la respuesta NO está entre las opciones", () => {
    expect(isValidMC({ ...base, answer: "was" })).toBe(false);
  });

  it("rechaza opciones repetidas (evita 'dos correctas')", () => {
    expect(isValidMC({ ...base, options: ["is", "is", "am", "be"] })).toBe(false);
  });

  it("rechaza si hay menos de 2 opciones", () => {
    expect(isValidMC({ ...base, options: ["is"] })).toBe(false);
  });

  it("rechaza opciones vacías", () => {
    expect(isValidMC({ ...base, options: ["is", "", "am", "be"] })).toBe(false);
  });

  it("compara ignorando mayúsculas y espacios sobrantes", () => {
    expect(isValidMC({ ...base, answer: "  Is " })).toBe(true);
  });
});

describe("isValidFITB", () => {
  it("acepta una oración con hueco y clave", () => {
    expect(isValidFITB({ sentence: "I ___ a student.", answer: "am" })).toBe(true);
  });

  it("rechaza si no hay hueco en la oración", () => {
    expect(isValidFITB({ sentence: "I am a student.", answer: "am" })).toBe(false);
  });

  it("rechaza si la clave está vacía", () => {
    expect(isValidFITB({ sentence: "I ___ a student.", answer: "" })).toBe(false);
  });
});

describe("filterValidMC", () => {
  it("se queda solo con las preguntas válidas", () => {
    const arr = [
      { q: "a", options: ["is", "are", "am", "be"], answer: "is" }, // ok
      { q: "b", options: ["x", "x", "y", "z"], answer: "x" }, // repetidas → fuera
      { q: "c", options: ["one", "two", "three", "four"], answer: "five" }, // ausente → fuera
    ];
    expect(filterValidMC(arr)).toHaveLength(1);
  });
});
