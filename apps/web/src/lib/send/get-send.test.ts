import { describe, it, expect } from "vitest";
import { getSend, isFinalSendStatus } from "./api";

describe("getSend (mock) progression", () => {
  it("stays processando then settles to concluido across polls", async () => {
    const id = `snd_${Math.random()}`;
    const first = await getSend(id);
    const second = await getSend(id);
    const third = await getSend(id);
    expect(first.status).toBe("processando");
    expect(second.status).toBe("processando");
    expect(third.status).toBe("concluido");
    expect(isFinalSendStatus(third.status)).toBe(true);
  });

  it("isFinalSendStatus is true only for terminal states", () => {
    expect(isFinalSendStatus("processando")).toBe(false);
    expect(isFinalSendStatus("concluido")).toBe(true);
    expect(isFinalSendStatus("recusado")).toBe(true);
    expect(isFinalSendStatus("falha")).toBe(true);
  });
});
