// exercise1_model_comparison.ts
import { getLLMClient, type ProviderName, type Message } from '../../shared/utils/typescript/src/llm-client';
import { writeFileSync } from 'fs';

interface TestPrompt {
  name: string;
  prompt: string;
  evaluate: string[];
}

const TEST_PROMPTS: TestPrompt[] = [
  {
    name: 'code_generation',
    prompt: 'Write a function that finds the longest palindromic substring. Include type annotations and JSDoc.',
    evaluate: ['correctness', 'code_quality', 'documentation'],
  },
  {
    name: 'reasoning',
    prompt: 'A farmer has 17 sheep. All but 9 die. How many sheep are left? Explain your reasoning step by step.',
    evaluate: ['correct_answer', 'explanation_quality'],
  },
  {
    name: 'refactoring',
    prompt: 'Refactor this code to be more idiomatic:\n\nfunction getEvens(numbers) {\n  const result = [];\n  for (let i = 0; i < numbers.length; i++) {\n    if (numbers[i] % 2 === 0) {\n      result.push(numbers[i]);\n    }\n  }\n  return result;\n}',
    evaluate: ['improvement', 'explanation'],
  },
];

async function runComparison() {
  const providers: ProviderName[] = ['google', 'groq'];
  const results: Record<string, Record<string, unknown>> = {};

  for (const test of TEST_PROMPTS) {
    results[test.name] = {};
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${test.name}`);

    for (const provider of providers) {
      try {
        const client = getLLMClient(provider);
        const messages: Message[] = [
          { role: 'system', content: 'You are a helpful programming assistant.' },
          { role: 'user', content: test.prompt },
        ];

        const response = await client.chat(messages);
        results[test.name][provider] = {
          response,
          timestamp: new Date().toISOString(),
        };

        console.log(`\n--- ${provider.toUpperCase()} ---`);
        console.log(response);
      } catch (error) {
        results[test.name][provider] = { error: String(error) };
        console.log(`\n--- ${provider.toUpperCase()} ---`);
        console.log(`Error: ${error}`);
      }
    }
  }

  // Save results
  writeFileSync('model_comparison_results.json', JSON.stringify(results, null, 2));
  return results;
}

runComparison();