import { defineConfig } from 'orval';

export default defineConfig({
  kakeibo: {
    output: {
      client: 'react-query',
      mode: 'tags-split',
      target: './lib/api/generated',
      schemas: './lib/api/generated/models',
      httpClient: 'fetch',
      mock: true,
      override: {
        mutator: {
          path: './lib/api/custom-fetch.ts',
          name: 'customFetch',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
    input: {
      target: 'http://localhost:3001/api/doc',
    },
  },
});
