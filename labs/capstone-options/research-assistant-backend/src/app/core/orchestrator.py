import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List, Union, Callable
from autogen import GroupChat, GroupChatManager, Agent, AssistantAgent, UserProxyAgent, ConversableAgent
from ..agents.factory import AgentFactory
from ..utils.config import Config
from .schemas import ResearchRequest
from .workflow_config import AGENT_REGISTRY
import re

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
        self.current_plan = []
        self.plan_index = -1

    def _state_transition(self, last_speaker: Agent, groupchat: GroupChat) -> Union[Agent, str, None]:
        """
        Custom speaker selection logic to enforce Research -> Write -> Review -> Refine loop.
        Also handles emitting progress events and manages iteration budget.
        """
        # 1. Emit 'completed' event for the previous speaker
        if last_speaker and last_speaker.name not in ["User", "chat_manager"]:
            try:
                last_msg = groupchat.messages[-1]
                content = last_msg.get("content", "")
                if content and len(content) > 10:
                     self.message_queue.put_nowait({
                        "type": "progress",
                        "message": f"{last_speaker.name} has completed their step.",
                        "preview": content[:500] + "..." if len(content) > 500 else content
                    })
            except Exception:
                pass

        messages = groupchat.messages
        
        # Calculate functional iterations dynamically
        func_agents_keys = [k for k in self.agents_dict.keys() if k != "supervisor"]
        func_agents_names = [self.agents_dict[k].name for k in func_agents_keys]
        
        func_count = sum(1 for m in messages if m.get("name") in func_agents_names)
        remaining = self.request.max_iterations - func_count

        # Check if Supervisor just finalized the report
        if last_speaker.name == "Supervisor" and messages:
            content = messages[-1].get("content", "")
            if "```json" in content or '"final_report"' in content or '"status"' in content:
                # The supervisor provided the final output, stop the chat
                return None

        next_agent = None

        if not messages or last_speaker.name == "User":
            next_agent = self.agents_dict["supervisor"]

        elif last_speaker.name == "Supervisor":
            content = messages[-1].get("content", "")
            
            # Parse PLAN: AgentA -> AgentB from content
            match = re.search(r"PLAN:\s*(.+)", content, re.IGNORECASE)
            if match:
                plan_str = match.group(1).strip()
                # extract agent names ignoring formatting characters like *
                raw_names = [name.strip().replace("*", "") for name in plan_str.split("->")]
                
                self.current_plan = []
                for p_name in raw_names:
                    for key, agent in self.agents_dict.items():
                        if agent.name.lower() == p_name.lower():
                            self.current_plan.append(agent)
                            break
                
                if self.current_plan:
                    self.plan_index = 0
                    next_agent = self.current_plan[0]
                else:
                    # Invalid plan parsed, fallback to supervisor to fix
                    next_agent = self.agents_dict["supervisor"]
            else:
                if remaining <= 0:
                    return None
                next_agent = self.agents_dict["supervisor"] # Re-prompt for plan or final json

        else:
            # A functional agent spoke
            content = messages[-1].get("content", "")
            
            # Smart Interrupts
            if "APPROVE" in content or "REJECT" in content:
                self.current_plan = [] # Plan interrupted
                self.plan_index = -1
                next_agent = self.agents_dict["supervisor"]
            else:
                self.plan_index += 1
                if self.plan_index < len(self.current_plan) and remaining > 0:
                    # Continue with the planned sequence automatically
                    next_agent = self.current_plan[self.plan_index]
                else:
                    # Plan sequence finished, or we ran out of budget
                    self.current_plan = []
                    self.plan_index = -1
                    next_agent = self.agents_dict["supervisor"]

        if not next_agent:
            next_agent = self.agents_dict["supervisor"] # Fallback

        # Inject budget status to Supervisor before its turn
        if next_agent.name == "Supervisor":
            base_prompt = next_agent.DEFAULT_SYSTEM_PROMPT
            
            # Build natural language registry list
            registry_str = "\n".join([f"- {name}: {desc}" for name, desc in AGENT_REGISTRY.items()])
            
            status_prompt = f"\n\n[SYSTEM STATUS: You have {remaining} functional iterations remaining out of {self.request.max_iterations}.]"
            status_prompt += f"\n[AVAILABLE AGENTS:\n{registry_str}\n]"
            
            if last_speaker.name not in ["User", "Supervisor"]:
                content = messages[-1].get("content", "")
                if "APPROVE" in content:
                    status_prompt += "\n[ALERT: The draft was APPROVED! You MUST output the final JSON report now. Set status to 'complete'.]"
                elif "REJECT" in content:
                    if remaining <= 0:
                        status_prompt += "\n[ALERT: BUDGET EXHAUSTED after REJECTION. You MUST output the final JSON report now. Do not output PLAN:. Set status to 'draft'.]"
                    else:
                        status_prompt += "\n[ALERT: The previous draft was REJECTED. Evaluate the feedback and provide a NEW PLAN to fix the issues, or finalize as draft if budget is too low.]"
                else:
                    if remaining <= 0:
                        status_prompt += "\n[ALERT: BUDGET EXHAUSTED without final approval. You MUST output the final JSON report now. Do not output PLAN:. Set status to 'draft'.]"
                    else:
                        status_prompt += "\n[ALERT: The previous PLAN completed without final approval. Provide a NEW PLAN to continue the work, or finalize as draft if appropriate.]"
            elif remaining <= 0:
                status_prompt += "\n[ALERT: BUDGET EXHAUSTED. You MUST output the final JSON report now. Do not output PLAN:. Set status to 'draft' if not approved.]"
                    
            next_agent.update_system_message(base_prompt + status_prompt)

        # 3. Emit 'started' event with descriptive activity for the NEXT agent
        activity_map = {
            "Researcher": "gathering information...",
            "Writer": "drafting the content...",
            "Reviewer": "reviewing the draft...",
            "Supervisor": "coordinating the workflow..."
        }
        activity = activity_map.get(next_agent.name, f"working on their task...")

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
            max_round=self.request.max_iterations * 2 + 10,  # Buffer for supervisor/manager turns
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
        final_report_text = "Report generation failed or incomplete."
        status = "draft"
        metadata = {}
        
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
                    # Parse it to ensure it's valid JSON
                    parsed = json.loads(content)
                    if isinstance(parsed, dict):
                        final_report_text = parsed.get("final_report", str(parsed))
                        status = parsed.get("status", "draft")
                        metadata = parsed.get("metadata", {})
                    else:
                        final_report_text = str(parsed)
                except Exception as e:
                    # If parsing fails (often due to unescaped markdown tables or newlines), extract safely
                    import re
                    match = re.search(r'"final_report"\s*:\s*"(.*?)"(?=\s*(?:,\s*"\w+"\s*:|\s*}))', content, re.DOTALL)
                    if match:
                        # Extract and unescape common json sequences to make it renderable
                        raw_text = match.group(1)
                        final_report_text = raw_text.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                        status = "complete" if '"status": "complete"' in content else "draft"
                        metadata = {}
                    else:
                        final_report_text = content # Fallback to raw text
            else:
                # If stopped early, use Writer's last output if available
                for m in reversed(messages):
                    if m["name"] == "Writer":
                        final_report_text = m["content"]
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

        metadata.update({
            "iterations": len(messages),
            "model": self.llm_config["config_list"][0]["model"]
        })

        final_response = {
            "type": "result",
            "data": {
                "final_report": final_report_text,
                "status": status,
                "conversation_history": history_log,
                "metadata": metadata
            }
        }

        yield f"data: {json.dumps(final_response)}\n\n"
        yield "event: close\ndata: [DONE]\n\n"
