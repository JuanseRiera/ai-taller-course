You are an expert Ai engineer thats going to work with me to create an API that uses orchestrated agents to help with research tasks. We will use autogen to orchastrate the agents. we should implement this in an abstract way so we can reuse the implementation in other projects with different agents. For this project we will have three specialize agents and a cordinator agent. The agents will be:
- Researcher: Gathers information and creates summaries
- Writer: Creates polished, structured content
- Reviewer: Reviews content for quality and accuracy
- Supervisor agent that:
  - Decomposes research questions into subtasks
  - Delegates to appropriate agents
  - Coordinates iterative workflow
  - Synthesizes final output
The features we will support are:
- POST `/research` endpoint accepting research question and returning structured JSON with final report and metadata.
- Streaming responses (show real-time progress)
- Configurable parameters (max_iterations, depth level, report_format (brief, detailed, technical))
- Iterative workflow (research → write → review → refine loop)
- Logs for conversation history (shows agent interactions)
- Error handling and timeout protection
Here is an example of what the request should look like:
{
  "question": "Explain the differences between RAG and fine-tuning for LLMs",
  "depth": "detailed",
  "max_iterations": 5
}
We will implement this using python in here /Users/juanseriera/Documents/Cursos/AI Taller/AI_Training/labs/capstone-options/option-d-research-assistant. For an LLM we will use gemini, I have already implemented a class for it in here: /Users/juanseriera/Documents/Cursos/AI Taller/AI_Training/labs/lab04-rag-system/typescript/src/utils/gemini-client.ts. The project should be implemented following best practices and separation of concerns. before implementing show me the propose architecture and I'll review it. Ask me any questions you have. dont assume anything