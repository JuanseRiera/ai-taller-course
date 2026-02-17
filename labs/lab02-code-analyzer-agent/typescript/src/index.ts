import 'dotenv/config'; // Load env vars immediately
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { UnifiedLLMClient } from './llm-client.js';
import { CODE_ANALYSIS_SYSTEM_PROMPT, SECURITY_ANALYSIS_SYSTEM_PROMPT } from './prompts.js';
import { AnalysisResponseSchema } from './schemas.js';
import { z } from 'zod';
import { Context } from 'hono';

const app = new Hono();

app.use('/*', async (c, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  
  if (process.env.NODE_ENV === 'production' && origin === '*') {
    console.warn('WARNING: Running in production with permissive CORS (*). Set CORS_ORIGIN.');
  }

  return cors({
    origin,
  })(c, next);
});

const llmClient = new UnifiedLLMClient(); // Singleton instance
console.log(`LLM Client initialized. Model: ${llmClient.modelName}`);

const RequestSchema = z.object({
  language: z.string(),
  code: z.string(),
});

// Helper function to handle analysis logic
async function handleAnalysisRequest(c: Context, systemPrompt: string) {
  try {
    let language: string;
    let code: string;

    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('text/plain')) {
      const textBody = await c.req.text();
      
      // Try to parse the text body as JSON first (Smart Fallback)
      try {
        const jsonBody = JSON.parse(textBody);
        if (jsonBody.language && jsonBody.code) {
          language = jsonBody.language;
          code = jsonBody.code;
        } else {
          // JSON parsed but missing fields? Treat as raw code
          code = textBody;
          language = c.req.query('language') || 'auto-detect';
        }
      } catch {
        // Not JSON? Treat as raw code
        code = textBody;
        language = c.req.query('language') || 'auto-detect';
      }
    } else {
      let body;
      try {
        body = await c.req.json();
      } catch (e) {
        return c.json({ error: 'Invalid JSON body', details: e instanceof Error ? e.message : 'Parse error' }, 400);
      }
      
      const result = RequestSchema.safeParse(body);

      if (!result.success) {
        return c.json({ error: 'Invalid request body', details: result.error }, 400);
      }

      language = result.data.language;
      code = result.data.code;
    }
    
    // Sanitize language input to prevent prompt injection
    // Allow only alphanumeric characters, spaces, and safe symbols (-, +, #, .)
    // Truncate to 50 characters to prevent overflow attacks
    const sanitizedLanguage = language.replace(/[^a-zA-Z0-9\s\-+#.]/g, '').slice(0, 50);

    // Base64 encode the user code for maximum security and isolation
    // This prevents any prompt injection or XML tag interference
    const encodedCode = Buffer.from(code).toString('base64');

    const prompt = `Analyze the following ${sanitizedLanguage} code provided within the <code_snippet> tags. The content is Base64 encoded. Decode it first, then analyze it.\n\n<code_snippet>\n${encodedCode}\n</code_snippet>`;

    const llmResponse = await llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ]);

    // Attempt to parse the response as JSON.
    // robustly handle markdown code blocks
    let jsonString = llmResponse.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    }
    
    let parsedData;
    try {
        parsedData = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse LLM response as JSON. Error:", e);
        return c.json({ error: 'Failed to parse LLM response' }, 500);
    }

    const validatedData = AnalysisResponseSchema.safeParse(parsedData);

    if (!validatedData.success) {
      console.error("LLM response validation failed. Issues:", validatedData.error.issues);
      return c.json({ error: 'Invalid analysis format from LLM', details: validatedData.error }, 500);
    }

    return c.json(validatedData.data);

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: 'Internal server error', details: errorMessage }, 500);
  }
}

app.post('/analyze', async (c) => {
  return handleAnalysisRequest(c, CODE_ANALYSIS_SYSTEM_PROMPT);
});

app.post('/analyze/security', async (c) => {
  return handleAnalysisRequest(c, SECURITY_ANALYSIS_SYSTEM_PROMPT);
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Set server timeout to 120 seconds (2 minutes) to allow long LLM responses
server.setTimeout(120000);
