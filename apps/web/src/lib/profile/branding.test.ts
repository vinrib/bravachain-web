import { describe, it, expect } from "vitest";
import { validateLogo, LOGO_MAX_BYTES } from "./branding";
import { maskPixKey } from "@/lib/receive/mask";

function fakeFile(type: string, size: number): File {
  const f = new File(["x"], "logo", { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

describe("validateLogo", () => {
  it("accepts JPEG/PNG/WebP/SVG within 2 MB", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]) {
      expect(validateLogo(fakeFile(t, 1024))).toBeNull();
    }
  });
  it("rejects unsupported types", () => {
    expect(validateLogo(fakeFile("image/gif", 1024))).toMatch(/Formato inválido/);
    expect(validateLogo(fakeFile("application/pdf", 1024))).toMatch(/Formato inválido/);
  });
  it("rejects files over 2 MB", () => {
    expect(validateLogo(fakeFile("image/png", LOGO_MAX_BYTES + 1))).toMatch(/2 MB/);
    expect(validateLogo(fakeFile("image/png", LOGO_MAX_BYTES))).toBeNull();
  });
});

describe("maskPixKey", () => {
  it("masks emails keeping the first char and domain", () => {
    expect(maskPixKey("contato@empresa.com")).toBe("c••••••@empresa.com");
  });
  it("masks other keys keeping the last 4", () => {
    expect(maskPixKey("12345678909")).toMatch(/^•+8909$/);
    expect(maskPixKey("abcd")).toBe("••••");
  });
  it("is empty for an empty key", () => {
    expect(maskPixKey("")).toBe("");
  });
});
