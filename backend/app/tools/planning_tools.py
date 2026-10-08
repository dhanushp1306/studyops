from datetime import datetime, timedelta
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.tools.base import BaseTool
from app.models import CalendarEvent, Task, Subject, StudyPlan

# --- 1. find_free_slot ---
class FindFreeSlotArgs(BaseModel):
    duration_hours: float = Field(..., gt=0.0, description="Required slot duration in hours e.g. 2.0")
    target_date: Optional[datetime] = Field(None, description="Target date to scan for free time")
    preferred_start_hour: int = Field(8, ge=0, le=23, description="Earliest hour e.g. 8 (8 AM)")
    preferred_end_hour: int = Field(22, ge=0, le=23, description="Latest hour e.g. 22 (10 PM)")

class FindFreeSlotTool(BaseTool):
    name = "find_free_slot"
    description = "Scan student calendar schedule to locate unallocated time slots of requested duration"
    args_schema = FindFreeSlotArgs

    def _execute(self, db: Session, args: FindFreeSlotArgs) -> tuple[Any, str]:
        now = datetime.utcnow()
        base_date = args.target_date or (now + timedelta(days=1))
        
        # Scan next 3 days starting from base_date
        available_slots = []
        duration_mins = int(args.duration_hours * 60)

        for day_offset in range(3):
            current_day = (base_date + timedelta(days=day_offset)).replace(minute=0, second=0, microsecond=0)
            day_start = current_day.replace(hour=args.preferred_start_hour)
            day_end = current_day.replace(hour=args.preferred_end_hour)

            # Query existing events on this day
            events = db.query(CalendarEvent).filter(
                CalendarEvent.start_time >= day_start,
                CalendarEvent.end_time <= day_end,
                CalendarEvent.status != "cancelled"
            ).order_by(CalendarEvent.start_time.asc()).all()

            # Find gaps
            cursor = day_start
            for evt in events:
                if evt.start_time > cursor:
                    gap_mins = int((evt.start_time - cursor).total_seconds() / 60)
                    if gap_mins >= duration_mins:
                        slot_end = cursor + timedelta(minutes=duration_mins)
                        available_slots.append({
                            "start_time": cursor.isoformat(),
                            "end_time": slot_end.isoformat(),
                            "duration_hours": args.duration_hours,
                            "day": cursor.strftime("%A, %b %d"),
                            "time_range": f"{cursor.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
                        })
                cursor = max(cursor, evt.end_time)

            # Check gap after last event until day_end
            if cursor < day_end:
                gap_mins = int((day_end - cursor).total_seconds() / 60)
                if gap_mins >= duration_mins:
                    slot_end = cursor + timedelta(minutes=duration_mins)
                    available_slots.append({
                        "start_time": cursor.isoformat(),
                        "end_time": slot_end.isoformat(),
                        "duration_hours": args.duration_hours,
                        "day": cursor.strftime("%A, %b %d"),
                        "time_range": f"{cursor.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
                    })

            if len(available_slots) >= 5:
                break

        return available_slots, f"Found {len(available_slots)} available free slot(s) of {args.duration_hours}h duration"


# --- 2. generate_study_plan ---
class GenerateStudyPlanArgs(BaseModel):
    subject_codes: Optional[List[str]] = Field(None, description="Optional filter of course codes e.g. ['CS301', 'CS302']")
    total_weekly_hours: float = Field(18.0, description="Total target study hours for the week")

class GenerateStudyPlanTool(BaseTool):
    name = "generate_study_plan"
    description = "Generate an optimized weekly study block schedule balancing subject workloads and pending tasks"
    args_schema = GenerateStudyPlanArgs

    def _execute(self, db: Session, args: GenerateStudyPlanArgs) -> tuple[Any, str]:
        subjects_query = db.query(Subject)
        if args.subject_codes:
            subjects_query = subjects_query.filter(Subject.code.in_([c.upper() for c in args.subject_codes]))
        subjects = subjects_query.all()

        pending_tasks = db.query(Task).filter(Task.status.in_(["pending", "in_progress"])).all()

        planned_blocks = []
        now = datetime.utcnow()

        for subj in subjects:
            subj_tasks = [t for t in pending_tasks if t.subject_id == subj.id or t.course_code == subj.code]
            target_hours = subj.target_hours_per_week

            # Estimate required study sessions (e.g. 2h blocks)
            num_blocks = max(1, round(target_hours / 2.0))
            for i in range(num_blocks):
                session_time = now + timedelta(days=i+1, hours=i*3 + 14)
                linked_task = subj_tasks[i % len(subj_tasks)] if subj_tasks else None

                planned_blocks.append({
                    "subject": subj.name,
                    "course_code": subj.code,
                    "proposed_title": f"{subj.code} Study Session {i+1}" + (f" - {linked_task.title}" if linked_task else ""),
                    "proposed_start": session_time.strftime("%Y-%m-%dT14:00:00"),
                    "proposed_end": (session_time + timedelta(hours=2)).strftime("%Y-%m-%dT16:00:00"),
                    "duration_hours": 2.0,
                    "linked_task_id": linked_task.id if linked_task else None
                })

        summary = {
            "total_weekly_target_hours": args.total_weekly_hours,
            "generated_study_blocks_count": len(planned_blocks),
            "planned_blocks": planned_blocks
        }
        return summary, f"Generated optimized study plan with {len(planned_blocks)} proposed study blocks"
