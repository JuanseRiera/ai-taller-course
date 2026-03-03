import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List, Union, Callable
from autogen import GroupChat, GroupChatManager, Agent, AssistantAgent, UserProxyAgent, ConversableAgent
from ..agents.factory import AgentFactory
from ..utils.config import Config
from .schemas import ResearchRequest

class ResearchOrchestrator:
    def __init__(self, request: ResearchRequest):
        self.request = request
        self.llm_config = Config.get_gemini_config()
        self.agents_dict = AgentFactory.create_agents(
            self.llm_config, 
            depth=request.depth, 
            report_format=request.report_format
        )
        self.message_queue = asyncio.Queue()
        self.groupchat = None # Store reference to access history later

    def _state_transition(self, last_speaker: Agent, groupchat: GroupChat) -> Union[Agent, str, None]:
        """
        Custom speaker selection logic to enforce Research -> Write -> Review -> Refine loop.
        Also handles emitting progress events.
        """
        # 1. Emit 'completed' event for the previous speaker
        if last_speaker and last_speaker.name not in ["User", "chat_manager"]:
            try:
                last_msg = groupchat.messages[-1]
                content = last_msg.get("content", "")
                # Only send if content is substantial
                if content and len(content) > 10:
                     self.message_queue.put_nowait({
                        "type": "progress",
                        "message": f"{last_speaker.name} has completed their step.",
                        "preview": content[:500] + "..." if len(content) > 500 else content
                    })
            except Exception:
                pass

        messages = groupchat.messages
        next_agent = None

        # 2. Determine next speaker based on the LAST message content or sender
        if not messages:
            next_agent = self.agents_dict["supervisor"]

        elif last_speaker.name == "Supervisor":
            # Supervisor delegates to Researcher
            next_agent = self.agents_dict["researcher"]
        
        elif last_speaker.name == "Researcher":
            # Researcher -> Writer
            next_agent = self.agents_dict["writer"]
        
        elif last_speaker.name == "Writer":
            # Writer -> Reviewer
            next_agent = self.agents_dict["reviewer"]
        
        elif last_speaker.name == "Reviewer":
            # Reviewer decides: APPROVE or REVISE
            last_message = messages[-1]["content"]
            if "APPROVE" in last_message:
                next_agent = self.agents_dict["supervisor"] # Finalize
            else:
                next_agent = self.agents_dict["writer"] # Back to drafting
        
        if not next_agent:
            next_agent = self.agents_dict["supervisor"] # Fallback

        # 3. Emit 'started' event with descriptive activity for the NEXT agent
        activity_map = {
            "Researcher": "gathering information...",
            "Writer": "drafting the content...",
            "Reviewer": "reviewing the draft...",
            "Supervisor": "coordinating the workflow..."
        }
        activity = activity_map.get(next_agent.name, "working...")

        try:
            self.message_queue.put_nowait({
                "type": "progress",
                "message": f"{next_agent.name} has started {activity}"
            })
        except Exception:
            pass 

        return next_agent

    async def run_research(self) -> AsyncGenerator[str, None]:
        """
        Main execution method. Initializes the chat and streams results.
        """
        
        # 1. Create GroupChat
        user_proxy = UserProxyAgent(
            name="User",
            system_message="A human user.",
            code_execution_config=False,
            human_input_mode="NEVER"
        )
        
        # Use Any to bypass strict type checking for list invariance
        all_agents: List[Any] = [user_proxy] + list(self.agents_dict.values())

        self.groupchat = GroupChat(
            agents=all_agents,
            messages=[],
            max_round=self.request.max_iterations,
            speaker_selection_method=self._state_transition
        )

        # 2. Create Manager
        manager = GroupChatManager(
            groupchat=self.groupchat,
            llm_config=self.llm_config
        )

        # 3. Start the Chat (Run in background task)
        task = asyncio.create_task(
            user_proxy.a_initiate_chat(
                manager,
                message=f"Research Question: {self.request.question}"
            )
        )

        # 4. Stream from Queue
        while not task.done():
            try:
                # Wait for new message or task completion
                message = await asyncio.wait_for(self.message_queue.get(), timeout=0.5)
                yield f"data: {json.dumps(message)}\n\n"
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                break
        
        # Check for errors in task
        if task.exception():
             yield f"data: {json.dumps({'type': 'error', 'message': str(task.exception())})}\n\n"
        
        # Flush remaining messages
        while not self.message_queue.empty():
            msg = self.message_queue.get_nowait()
            yield f"data: {json.dumps(msg)}\n\n"

        # 5. Construct Final Response
        final_report = "Report generation failed or incomplete."
        
        # Try to find the last message from Supervisor which should contain the JSON
        messages = self.groupchat.messages
        if messages:
            last_msg = messages[-1]
            if last_msg["name"] == "Supervisor":
                # Clean up markdown code blocks if present
                content = last_msg["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].strip()
                
                try:
                    # Parse it to ensure it's valid JSON, or just return as string
                    final_report = json.loads(content)
                except:
                    final_report = content # Fallback to raw text
            else:
                # If stopped early, use Writer's last output if available
                for m in reversed(messages):
                    if m["name"] == "Writer":
                        final_report = m["content"]
                        break

        # Prepare full history with details
        history_log = [
            {
                "agent": m.get("name"),
                "role": m.get("role"),
                "content": m.get("content")
            }
            for m in messages
        ]

        final_response = {
            "type": "result",
            "data": {
                "final_report": final_report,
                "conversation_history": history_log,
                "metadata": {
                    "iterations": len(messages),
                    "model": self.llm_config["config_list"][0]["model"]
                }
            }
        }

        yield f"data: {json.dumps(final_response)}\n\n"
        yield "event: close\ndata: [DONE]\n\n"
