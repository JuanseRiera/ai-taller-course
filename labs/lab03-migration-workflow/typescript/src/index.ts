import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { runMigration } from './utils/pipeline.js';
import { VerificationReport } from './types/migration.js';

const app = new Hono();

app.use('/*', cors());

const MigrateRequestSchema = z.object({
  files: z.array(z.object({
    path: z.string().min(1),
    content: z.string().min(1)
  })),
  targetFramework: z.string()
});

app.post(
  '/v1/migrate',
  zValidator('json', MigrateRequestSchema),
  async (c) => {
    const { files, targetFramework } = c.req.valid('json');

    try {
      const result: VerificationReport = await runMigration(files, targetFramework);
      return c.json(result);
    } catch (error) {
      console.error('Migration failed:', error);
      return c.json({ error: 'Migration failed', details: error instanceof Error ? error.message : String(error) }, 500);
    }
  }
);

app.get('/', (c) => {
  return c.text('Migration Agent API is running. POST to /v1/migrate to start.');
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
