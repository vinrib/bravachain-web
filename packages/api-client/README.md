# @bravachain/api-client

Typed TypeScript client for the Bravachain backend, generated from its OpenAPI
document. Shared between `apps/web` (Next.js BFF) and the future React Native app.

## Generating types

The typed surface lives in `src/generated/schema.ts` and is produced from the
backend's OpenAPI document:

```bash
# from the repo root
OPENAPI_URL=https://<backend>/openapi.json pnpm generate:api
```

Set `OPENAPI_URL` in the shell or in `packages/api-client/.env` (see
`.env.example`). Commit the regenerated `schema.ts`.

Until you run it, `schema.ts` is a minimal placeholder so the workspace still
type-checks. Endpoint paths the BFF depends on are centralized in
[`src/endpoints.ts`](./src/endpoints.ts) — reconcile them with the generated
schema after the first run.

## Usage

```ts
import { createApiClient, endpoints } from "@bravachain/api-client";

const api = createApiClient({
  baseUrl: process.env.BACKEND_API_URL!,
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { data, error } = await api.GET(endpoints.wallet.balance);
```
