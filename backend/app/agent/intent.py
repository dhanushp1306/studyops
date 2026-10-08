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
    extracted_tasks: Optional[list] = None
    constraint_note: Optional[str] = None
    raw_prompt: str

def parse_user_intent(prompt: str) -> ParsedIntent:
    text = prompt.lower()
    now = datetime.utcnow()
    task_title: str = prompt
    extracted_tasks = []
    constraint_note = None

    # Check for messy multi-task prompt e.g. "DAA due Friday, DBMS lab Monday..."
    if "," in prompt or " and " in text or ("due" in text and ("lab" in text or "prepare" in text or "internal" in text)):
        # Extract multiple course segments
        segments = re.split(r'[,;\n]| and ', prompt)
        for seg in segments:
            seg_text = seg.lower().strip()
            if not seg_text:
                continue

            # Check constraint e.g. "college until 4"
            if "college" in seg_text or "class" in seg_text or "until" in seg_text:
                constraint_note = seg.strip()
                continue

            code = "CS301"
            if "daa" in seg_text: code = "CS301"
            elif "dbms" in seg_text: code = "CS302"
            elif "os" in seg_text or "operating" in seg_text: code = "CS303"
            elif "cn" in seg_text or "network" in seg_text: code = "CS304"
            elif "ml" in seg_text: code = "CS405"

            dl = now + timedelta(days=3)
            if "friday" in seg_text:
                days_until = (4 - now.weekday()) % 7 or 7
                dl = (now + timedelta(days=days_until)).replace(hour=23, minute=59)
            elif "monday" in seg_text:
                days_until = (0 - now.weekday()) % 7 or 7
                dl = (now + timedelta(days=days_until)).replace(hour=23, minute=59)

            extracted_tasks.append({
                "title": seg.strip(),
                "subject_code": code,
                "deadline": dl.isoformat(),
                "estimated_effort": 2.0,
                "priority": "high" if "due" in seg_text else "medium"
            })

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

    code_match = re.search(r'\b(cs\d{3})\b', text)
    if code_match:
        course_code = code_match.group(1).upper()

    # 2. Hours Effort Extraction
    hours = 2.0
    hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b', text)
    if hours_match:
        hours = float(hours_match.group(1))

    # 3. Target Date / Deadline Extraction
    deadline = None
    target_date = None

    if "friday" in text:
        days_until = (4 - now.weekday()) % 7 or 7
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
    if len(extracted_tasks) > 1:
        intent_type = "multi_task_batch_creation"
        task_title = f"Multi-task request ({len(extracted_tasks)} tasks)"
    elif "what should i do now" in text or "what should i do" in text or "what to work on" in text or "what should i work on" in text or "recommend" in text:
        intent_type = "what_should_i_do_now"
    elif "add" in text or "create" in text or "due" in text:
        intent_type = "create_assignment_and_schedule"
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
        extracted_tasks=extracted_tasks if len(extracted_tasks) > 1 else None,
        constraint_note=constraint_note,
        raw_prompt=prompt
    )
