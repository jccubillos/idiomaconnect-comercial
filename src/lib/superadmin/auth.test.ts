import { describe, it, expect } from "vitest";
import { signAdminSession, verifyAdminSession } from "./auth";
import { newTotpSecret, totpUri, verifyTotp } from "./totp";
import * as OTPAuth from "otpauth";

const USER = "11111111-2222-3333-4444-555555555555";

describe("sesión admin firmada (cookie)", () => {
  it("firma y verifica para el mismo usuario", () => {
    const token = signAdminSession(USER);
    expect(verifyAdminSession(token, USER)).toBe(true);
  });

  it("rechaza la cookie de OTRO usuario", () => {
    const token = signAdminSession(USER);
    expect(verifyAdminSession(token, "99999999-8888-7777-6666-555555555555")).toBe(false);
  });

  it("rechaza tokens vacíos, malformados o manipulados", () => {
    expect(verifyAdminSession(undefined, USER)).toBe(false);
    expect(verifyAdminSession("", USER)).toBe(false);
    expect(verifyAdminSession("abc.def", USER)).toBe(false);
    const token = signAdminSession(USER);
    expect(verifyAdminSession(token.slice(0, -2) + "ff", USER)).toBe(false);
  });

  it("rechaza sesiones expiradas", () => {
    const token = signAdminSession(USER, -1); // expiró hace 1 hora
    expect(verifyAdminSession(token, USER)).toBe(false);
  });
});

describe("TOTP (Google Authenticator)", () => {
  it("acepta el código vigente generado con el secreto", () => {
    const secret = newTotpSecret();
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });
    expect(verifyTotp(secret, totp.generate())).toBe(true);
  });

  it("rechaza códigos incorrectos o malformados", () => {
    const secret = newTotpSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
    expect(verifyTotp(secret, "abc123")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
  });

  it("la URI de enrolamiento incluye emisor y cuenta", () => {
    const secret = newTotpSecret();
    const uri = totpUri(secret, "jc@idiomaconnect.com");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("IdiomaConnect");
  });
});
