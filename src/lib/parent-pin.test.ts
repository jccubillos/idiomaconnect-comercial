import { describe, it, expect } from "vitest";
import { hashParentPin, verifyParentPinHash } from "./parent-pin";

describe("parent PIN hashing", () => {
  it("verifica el PIN correcto", () => {
    const hash = hashParentPin("1234abcd");
    expect(verifyParentPinHash("1234abcd", hash)).toBe(true);
  });

  it("rechaza un PIN incorrecto", () => {
    const hash = hashParentPin("1234abcd");
    expect(verifyParentPinHash("0000xxxx", hash)).toBe(false);
  });

  it("genera salts distintos (dos hashes del mismo PIN difieren)", () => {
    const a = hashParentPin("misma-clave");
    const b = hashParentPin("misma-clave");
    expect(a).not.toBe(b);
    // pero ambos verifican el mismo PIN
    expect(verifyParentPinHash("misma-clave", a)).toBe(true);
    expect(verifyParentPinHash("misma-clave", b)).toBe(true);
  });

  it("rechaza un hash con formato inválido sin lanzar error", () => {
    expect(verifyParentPinHash("1234", "no-es-un-hash")).toBe(false);
    expect(verifyParentPinHash("1234", "")).toBe(false);
  });
});
