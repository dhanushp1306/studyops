import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.agent.intent import parse_user_intent

class LLMProvider:
    """
    Controlled LLM Provider for studyops.
    Uses environment variables (OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY) when present,
    or falls back to the deterministic NLP parser to ensure zero-breakage offline execution.
    The LLM interacts ONLY through structured tool calls and NEVER accesses DB directly.
    """
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")

    def parse_intent_and_plan(self, user_request: str) -> Dict[str, Any]:
        """
        Parses user request into structured intent, entities, and execution plan.
        """
        if self.groq_key:
            parsed = self._call_groq(user_request)
            if parsed:
                return parsed
        elif self.openai_key:
            parsed = self._call_openai(user_request)
            if parsed:
                return parsed

        res = parse_user_intent(user_request)
        if hasattr(res, "model_dump"):
            return res.model_dump()
        elif hasattr(res, "__dict__"):
            return res.__dict__
        return res

    def _call_groq(self, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json"
            }
            system_prompt = (
                "You are the Academic Operations AI Planner for studyops. "
                "Analyze the user's natural language request and extract: "
                "1. intent (create_assignment_and_schedule, find_free_time, organize_week, rearrange_schedule, get_priority_advice) "
                "2. course_code (e.g. CS301, CS302, CS303, CS405) "
                "3. effort_hours (number) "
                "4. deadline_raw (text string like 'Friday', 'tomorrow') "
                "Return JSON ONLY with keys: intent, course_code, effort_hours, deadline_raw."
            )
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                content = json.loads(data['choices'][0]['message']['content'])
                fallback = parse_user_intent(prompt)
                fallback.update({
                    "course_code": content.get("course_code") or fallback.get("course_code"),
                    "effort_hours": float(content.get("effort_hours") or fallback.get("effort_hours") or 2.0),
                    "deadline_raw": content.get("deadline_raw") or fallback.get("deadline_raw"),
                })
                return fallback
        except Exception as e:
            print(f"[LLMProvider] Groq call note: {e}. Using deterministic parser.")
            return None

    def _call_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.openai_key}",
                "Content-Type": "application/json"
            }
            system_prompt = (
                "You are the Academic Operations AI Planner for studyops. "
                "Extract intent, course_code, effort_hours, deadline_raw. "
                "Return JSON ONLY."
            )
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                content = json.loads(data['choices'][0]['message']['content'])
                fallback = parse_user_intent(prompt)
                fallback.update({
                    "course_code": content.get("course_code") or fallback.get("course_code"),
                    "effort_hours": float(content.get("effort_hours") or fallback.get("effort_hours") or 2.0),
                    "deadline_raw": content.get("deadline_raw") or fallback.get("deadline_raw"),
                })
                return fallback
        except Exception as e:
            print(f"[LLMProvider] OpenAI call note: {e}. Using deterministic parser.")
            return None

llm_provider = LLMProvider()
