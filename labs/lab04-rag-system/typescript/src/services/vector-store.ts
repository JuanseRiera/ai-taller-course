import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VectorDocument {
  id: string;
  text: string;
  metadata: any;
  embedding: number[];
}

export class VectorStore {
  private documents: VectorDocument[] = [];
  private storagePath: string;

  constructor(storagePath: string = 'storage/vector-db.json') {
    // In Vercel, we must use /tmp for any write operations
    if (process.env.VERCEL || !path.isAbsolute(storagePath)) {
      this.storagePath = path.resolve(os.tmpdir(), path.basename(storagePath));
    } else {
      this.storagePath = storagePath;
    }
    
    console.log(`[VectorStore] Using storage path: ${this.storagePath}`);
    this.load();
  }

  addDocument(doc: VectorDocument) {
    this.documents.push(doc);
  }

  async save() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(this.storagePath, JSON.stringify(this.documents, null, 2));
  }

  load() {
    if (fs.existsSync(this.storagePath)) {
      const data = fs.readFileSync(this.storagePath, 'utf-8');
      this.documents = JSON.parse(data);
    }
  }

  search(queryEmbedding: number[], topK: number = 3): VectorDocument[] {
    if (this.documents.length === 0) return [];

    const scoredDocs = this.documents.map(doc => ({
      doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs.slice(0, topK).map(item => item.doc);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  clear() {
      this.documents = [];
  }
}
