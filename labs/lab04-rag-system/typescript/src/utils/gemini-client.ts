import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import 'dotenv/config';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GeminiClient {
  private genai: GoogleGenerativeAI;
  private chatModel: GenerativeModel;
  private embeddingModel: GenerativeModel;

  constructor(
    apiKey?: string,
    modelName: string = 'gemini-2.5-flash', 
    embeddingModelName: string = 'gemini-embedding-001'
  ) {
    const key = apiKey || process.env.GOOGLE_API_KEY;

    if (!key) {
      throw new Error(
        'GOOGLE_API_KEY environment variable not set. ' +
        'Get one at https://aistudio.google.com/app/apikey'
      );
    }

    this.genai = new GoogleGenerativeAI(key);
    this.chatModel = this.genai.getGenerativeModel({ model: modelName });
    this.embeddingModel = this.genai.getGenerativeModel({ model: embeddingModelName });
    console.log(`[GeminiClient] Initialized with chat: ${modelName}, embedding: ${embeddingModelName}`);
  }

  async chat(messages: Message[]): Promise<string> {
    const history: any[] = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + '\n';
      } else if (msg.role === 'user') {
        history.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        history.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    // Configure model with system instruction if present
    if (systemInstruction) {
       // Note: systemInstruction is supported in newer SDK versions/models
       // If not supported, we prepend to first user message.
       // For now, let's prepend to the first user message if history exists.
       if (history.length > 0 && history[0].role === 'user') {
           history[0].parts[0].text = `System Instruction: ${systemInstruction}\n\n${history[0].parts[0].text}`;
       }
    }

    if (history.length === 0) return '';

    const lastMessage = history.pop();
    if (lastMessage.role !== 'user') {
      // If last message is model, we can't really "chat" in the same way, 
      // but usually the user asks a question last.
      // If the history ends with model, we might just return empty or error.
      // Let's assume standard chat flow: User -> Model -> User.
      throw new Error("Last message in chat must be from user.");
    }

    const chat = this.chatModel.startChat({
      history: history
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    return result.response.text();
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }
}

export const geminiClient = new GeminiClient();
