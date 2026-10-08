import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pydantic import BaseModel

class ParsedIntent(BaseModel):
    intent_type: str
    course_code: Optional[str] = "CS301"
    course_name: Optional[str] = None
    estimated_hours: float = 2.0
    deadline: Optional[datetime] = None
    target_date: Optional[datetime] = None
    task_title: Optional[str] = None
    raw_prompt: str

def parse_user_intent(prompt: str) -> ParsedIntent:
    text = prompt.lower()
    now = datetime.utcnow()
    task_title: str = prompt

    # 1. Course Code Detection
    course_code = None
    course_name = None
    if "daa" in text or "algorithm" in text:
        course_code = "CS301"
        course_name = "Design & Analysis of Algorithms"
    elif "dbms" in text or "database" in text or "sql" in text:
        course_code = "CS302"
        course_name = "Database Management Systems"
    elif "os" in text or "operating system" in text:
        course_code = "CS303"
        course_name = "Operating Systems"
    elif "ml" in text or "machine learning" in text or "deep learning" in text:
        course_code = "CS405"
        course_name = "Machine Learning & Deep Learning"

    # Regex for CS course code e.g. CS301
    code_match = re.search(r'\b(cs\d{3})\b', text)
    if code_match:
        course_code = code_match.group(1).upper()

    # 2. Hours Effort Extraction (e.g. 3 hours, 2.5h, 4 hrs)
    hours = 2.0
    hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b', text)
    if hours_match:
        hours = float(hours_match.group(1))

    # 3. Target Date / Deadline Extraction
    deadline = None
    target_date = None

    if "friday" in text:
        days_until = (4 - now.weekday()) % 7
        if days_until == 0: days_until = 7
        deadline = (now + timedelta(days=days_until)).replace(hour=23, minute=59, second=0)
    elif "tomorrow" in text:
        target_date = (now + timedelta(days=1)).replace(hour=14, minute=0, second=0)
        deadline = (now + timedelta(days=1)).replace(hour=23, minute=59, second=0)
    elif "today" in text:
        target_date = now.replace(hour=14, minute=0, second=0)
        deadline = now.replace(hour=23, minute=59, second=0)
    else:
        deadline = (now + timedelta(days=3)).replace(hour=23, minute=59, second=0)

    # 4. Intent Classification
    if "add" in text or "create" in text or "due" in text:
        intent_type = "create_assignment_and_schedule"
        # Task title extraction
        title_match = re.search(r'add my\s+([^.]+)', prompt, re.IGNORECASE)
        task_title = title_match.group(1).strip() if title_match else f"{course_code or 'CS'} Assignment"
    elif "find" in text or "free" in text or "time" in text or "slot" in text:
        intent_type = "find_free_time"
        task_title = f"{course_code or 'CS'} Study Session"
    elif "cannot finish" in text or "rearrange" in text or "delay" in text or "reschedule" in text:
        intent_type = "rearrange_schedule"
        task_title = f"{course_code or 'DBMS'} Assignment Shift"
    elif "organize" in text or "week" in text or "plan" in text:
        intent_type = "organize_week"
    elif "what should i work on" in text or "priority" in text or "right now" in text:
        intent_type = "get_priority_advice"
    else:
        intent_type = "general_academic_query"
        task_title = prompt

    return ParsedIntent(
        intent_type=intent_type,
        course_code=course_code or "CS301",
        course_name=course_name,
        estimated_hours=hours,
        deadline=deadline,
        target_date=target_date,
        task_title=task_title,
        raw_prompt=prompt
    )
