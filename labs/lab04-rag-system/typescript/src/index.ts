import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { RAGService } from './services/rag-service.js';

const app = new Hono();
const ragService = new RAGService();

app.use('*', logger());

app.post('/index/files', async (c) => {
  const body = await c.req.json();
  const { files } = body;

  if (!files || typeof files !== 'object') {
    return c.json({ error: 'Invalid input. "files" object is required.' }, 400);
  }

  try {
    const result = await ragService.indexFiles(files);
    return c.json({ message: 'Files indexed successfully', ...result });
  } catch (error) {
    console.error('Error indexing files:', error);
    return c.json({ error: 'Failed to index files' }, 500);
  }
});

app.post('/query', async (c) => {
  const body = await c.req.json();
  const { question } = body;

  if (!question || typeof question !== 'string') {
    return c.json({ error: 'Invalid input. "question" string is required.' }, 400);
  }

  try {
    const { answer, retrievedDocs } = await ragService.query(question);
    return c.json({ 
      answer, 
      retrieved_chunks: retrievedDocs.map((d: any) => ({
        id: d.id,
        filename: d.metadata.filename,
        content: d.text.substring(0, 100) + '...' // Truncate for brevity in response
      }))
    });
  } catch (error) {
    console.error('Error querying:', error);
    return c.json({ error: 'Failed to process query' }, 500);
  }
});

app.post('/evaluate', async (c) => {
  const body = await c.req.json();
  const { examples } = body;

  if (!examples || !Array.isArray(examples)) {
    return c.json({ error: 'Invalid input. "examples" array is required.' }, 400);
  }

  try {
    const result = await ragService.evaluate(examples);
    return c.json(result);
  } catch (error) {
    console.error('Error evaluating:', error);
    return c.json({ error: 'Failed to evaluate' }, 500);
  }
});

const port = Number(process.env.PORT) || 8000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
