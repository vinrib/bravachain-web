/**
 * Typed mock data for "Enviar", used until the API 13/14 `/v1/send/*` routes
 * land on `main`. Kept separate from `./api` so the swap to the real endpoints
 * is isolated and the mocks can be imported directly by tests.
 *
 * All three channels are available by default (the happy path). To exercise the
 * "channel unavailable" card, flip an entry's `available` to `false` here or
 * stub `getSendChannels` in a test.
 */
import type { SendChannel } from "./types";

export const MOCK_CHANNELS: SendChannel[] = [
  { currency: "BRL", available: true, rail: "PIX" },
  { currency: "USD", available: true, rail: "WIRE" },
  { currency: "EUR", available: true, rail: "SEPA" },
];
