import createClient, { type Client, type ClientOptions } from "openapi-fetch";
import type { paths } from "./generated/schema";

export type { paths };
export * from "./endpoints";

/** The typed Bravachain API client (becomes fully typed after codegen). */
export type BravachainClient = Client<paths>;

export interface CreateApiClientOptions extends ClientOptions {
  /** Base URL of the backend API, e.g. https://bravachain-api-production.up.railway.app */
  baseUrl: string;
}

/**
 * Creates a typed API client backed by openapi-fetch.
 *
 * Isomorphic: pass a `fetch` implementation and `headers` explicitly so the
 * same factory works from Next.js Route Handlers (server, with the caller's
 * bearer token) and from the future React Native app.
 */
export function createApiClient(options: CreateApiClientOptions): BravachainClient {
  return createClient<paths>(options);
}
