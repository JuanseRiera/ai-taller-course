export interface Chunk {
  id: string;
  text: string;
  metadata: {
    filename: string;
    lineStart: number;
    lineEnd: number;
    type: 'function' | 'class' | 'block' | 'other';
  };
}

export class CodeSplitter {
  split(filename: string, content: string): Chunk[] {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'py') {
      return this.splitPython(filename, content);
    } else if (extension === 'js' || extension === 'ts' || extension === 'jsx' || extension === 'tsx') {
      return this.splitJsTs(filename, content);
    } else {
      // Fallback for other files
      return this.splitGeneric(filename, content);
    }
  }

  private splitPython(filename: string, content: string): Chunk[] {
    const lines = content.split('\n');
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let startLine = 1;
    let currentType: Chunk['metadata']['type'] = 'other';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Simple heuristic for Python definitions
      const isDef = /^def\s+/.test(trimmed);
      const isClass = /^class\s+/.test(trimmed);

      if ((isDef || isClass) && currentChunk.length > 0) {
        // Save previous chunk
        chunks.push({
          id: `${filename}:${startLine}-${i}`,
          text: currentChunk.join('\n'),
          metadata: {
            filename,
            lineStart: startLine,
            lineEnd: i,
            type: currentType
          }
        });
        currentChunk = [];
        startLine = i + 1;
        currentType = isClass ? 'class' : 'function';
      }

      currentChunk.push(line);
    }

    if (currentChunk.length > 0) {
      chunks.push({
        id: `${filename}:${startLine}-${lines.length}`,
        text: currentChunk.join('\n'),
        metadata: {
          filename,
          lineStart: startLine,
          lineEnd: lines.length,
          type: currentType
        }
      });
    }

    return chunks;
  }

  private splitJsTs(filename: string, content: string): Chunk[] {
    const lines = content.split('\n');
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let startLine = 1;
    let currentType: Chunk['metadata']['type'] = 'other';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Simple heuristic for JS/TS definitions
      // Matches: function foo, class Foo, const foo = ..., async function
      const isFunction = /^(export\s+)?(async\s+)?function\s+/.test(trimmed);
      const isClass = /^(export\s+)?class\s+/.test(trimmed);
      // const isArrowFn = /^(const|let|var)\s+\w+\s*=\s*(\(.*\)|[^=]+)\s*=>/.test(trimmed); // Too aggressive maybe

      if ((isFunction || isClass) && currentChunk.length > 0) {
        chunks.push({
          id: `${filename}:${startLine}-${i}`,
          text: currentChunk.join('\n'),
          metadata: {
            filename,
            lineStart: startLine,
            lineEnd: i,
            type: currentType
          }
        });
        currentChunk = [];
        startLine = i + 1;
        currentType = isClass ? 'class' : 'function';
      }

      currentChunk.push(line);
    }

    if (currentChunk.length > 0) {
      chunks.push({
        id: `${filename}:${startLine}-${lines.length}`,
        text: currentChunk.join('\n'),
        metadata: {
          filename,
          lineStart: startLine,
          lineEnd: lines.length,
          type: currentType
        }
      });
    }

    return chunks;
  }

  private splitGeneric(filename: string, content: string): Chunk[] {
    // Just return the whole file as one chunk for now, or split by lines/paragraphs
    // For this POC, let's just chunk by 50 lines to be safe
    const lines = content.split('\n');
    const chunks: Chunk[] = [];
    const CHUNK_SIZE = 50;

    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      const chunkLines = lines.slice(i, i + CHUNK_SIZE);
      chunks.push({
        id: `${filename}:${i + 1}-${i + chunkLines.length}`,
        text: chunkLines.join('\n'),
        metadata: {
          filename,
          lineStart: i + 1,
          lineEnd: i + chunkLines.length,
          type: 'block'
        }
      });
    }
    return chunks;
  }
}
