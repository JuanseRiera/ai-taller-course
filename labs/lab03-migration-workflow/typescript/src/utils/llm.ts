import { UnifiedLLMClient, Message } from './llm-client.js';
import { ZodSchema } from 'zod';

export class LLMService {
  private client: UnifiedLLMClient;

  constructor() {
    this.client = new UnifiedLLMClient();
  }

  async chat(messages: Message[]): Promise<string> {
    return this.client.chat(messages);
  }

  async generateJson<T>(
    prompt: string,
    schema: ZodSchema<T>,
    systemPrompt: string = 'You are a precise JSON generator.'
  ): Promise<T> {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt + '\nEnsure your output is strictly valid JSON.' },
      { role: 'user', content: prompt }
    ];

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const response = await this.client.chat(messages);
        const jsonString = this.extractJson(response);
        return schema.parse(JSON.parse(jsonString));
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts === maxAttempts) {
          throw new Error(`Failed to generate valid JSON after ${maxAttempts} attempts: ${error}`);
        }
        
        // Add error context to the next prompt for self-correction
        messages.push({ 
          role: 'user', 
          content: `Your previous response failed validation. Error: ${error instanceof Error ? error.message : String(error)}. Please try again and fix the JSON format.` 
        });
      }
    }
    
    throw new Error('Unreachable code');
  }

  private extractJson(text: string): string {
    // Remove markdown code blocks if present
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
    const match = text.match(codeBlockRegex);
    if (match) {
      return match[1];
    }
    
    // Also try simple ``` blocks
    const simpleBlockRegex = /```\s*([\s\S]*?)\s*```/i;
    const simpleMatch = text.match(simpleBlockRegex);
    if (simpleMatch) {
      return simpleMatch[1];
    }

    return text.trim();
  }
}

export const llmService = new LLMService();
