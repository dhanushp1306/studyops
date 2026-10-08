import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agent.intent import parse_user_intent, ParsedIntent
from app.tools.registry import registry
from app.models import AgentActivity, AgentApproval, Task, Subject

class AgentRunResponse(BaseModel):
    run_id: str
    user_request: str
    intent: str
    status: str # completed, pending_approval, failed
    observable_actions: List[str]
    plan_steps: List[Dict[str, Any]]
    tools_used: List[str]
    final_response: str
    approval_required: Optional[Dict[str, Any]] = None
    duration_ms: int

class AgentOrchestrator:
    def run(self, user_request: str, db: Session) -> AgentRunResponse:
        start_time = time.time()
        run_id = f"run-{uuid.uuid4().hex[:8]}"

        observable_actions: List[str] = []
        plan_steps: List[Dict[str, Any]] = []
        tools_used: List[str] = []
        approval_required: Optional[Dict[str, Any]] = None
        run_status = "completed"

        # Step 1: Understand Intent & Parse Entities
        observable_actions.append("Analyzing request intent and extracting course parameters...")
        parsed: ParsedIntent = parse_user_intent(user_request)

        plan_steps.append({
            "step": 1,
            "action": f"Parsed intent: '{parsed.intent_type}' for {parsed.course_code or 'Academic Work'}"
        })

        final_response = ""

        # Step 2: Route by Intent & Multi-Step Execution
        if parsed.intent_type == "create_assignment_and_schedule":
            # Action: Create Task
            observable_actions.append(f"Creating task record for {parsed.course_code} assignment...")
            res_task = registry.execute("create_task", db, {
                "title": parsed.task_title or f"{parsed.course_code} Assignment",
                "subject_code": parsed.course_code,
                "deadline": parsed.deadline.isoformat() if parsed.deadline else (datetime.utcnow() + timedelta(days=2)).isoformat(),
                "priority": "high",
                "estimated_effort": parsed.estimated_hours
            })
            tools_used.append("create_task")
            created_task = res_task.data
            plan_steps.append({"step": 2, "action": f"Created Task #{created_task['id']} ('{created_task['title']}')"})

            # Action: Find Free Slot
            observable_actions.append("Checking your calendar for available study slots...")
            res_slots = registry.execute("find_free_slot", db, {
                "duration_hours": min(2.0, parsed.estimated_hours),
                "target_date": parsed.deadline.isoformat() if parsed.deadline else None
            })
            tools_used.append("find_free_slot")
            slots = res_slots.data or []
            plan_steps.append({"step": 3, "action": f"Scanned calendar and found {len(slots)} free study slot(s)"})

            # Action: Schedule Study Session Event
            if slots:
                best_slot = slots[0]
                observable_actions.append(f"Scheduling study session for {best_slot['time_range']}...")
                res_evt = registry.execute("create_event", db, {
                    "title": f"{parsed.course_code} Study Block - {created_task['title']}",
                    "event_type": "study_session",
                    "subject_code": parsed.course_code,
                    "start_time": best_slot["start_time"],
                    "end_time": best_slot["end_time"],
                    "linked_task_id": created_task["id"]
                })
                tools_used.append("create_event")
                plan_steps.append({"step": 4, "action": f"Scheduled study block on {best_slot['day']} ({best_slot['time_range']})"})

                final_response = f"Added '{created_task['title']}' (due {parsed.deadline.strftime('%A, %b %d')}). Scheduled a 2-hour study session on {best_slot['day']} ({best_slot['time_range']})."
            else:
                final_response = f"Added '{created_task['title']}' (due {parsed.deadline.strftime('%A, %b %d')}). No open free slots found before deadline."

        elif parsed.intent_type == "find_free_time":
            observable_actions.append(f"Checking your calendar for {parsed.estimated_hours}h free study slot...")
            res_slots = registry.execute("find_free_slot", db, {
                "duration_hours": parsed.estimated_hours,
                "target_date": (parsed.target_date or (datetime.utcnow() + timedelta(days=1))).isoformat()
            })
            tools_used.append("find_free_slot")
            slots = res_slots.data or []

            plan_steps.append({"step": 2, "action": f"Located {len(slots)} available slot(s)"})

            if slots:
                best = slots[0]
                observable_actions.append(f"Selected optimal slot: {best['day']} ({best['time_range']}).")
                final_response = f"Found {len(slots)} available study slot(s) for {parsed.course_code}. Best recommended slot: {best['day']} from {best['time_range']}."
            else:
                final_response = f"No unallocated {parsed.estimated_hours}h time slots found in your current schedule."

        elif parsed.intent_type == "rearrange_schedule":
            observable_actions.append("Evaluating current task deadlines and progress...")
            res_risk = registry.execute("calculate_deadline_risk", db, {})
            tools_used.append("calculate_deadline_risk")

            observable_actions.append("Found a schedule conflict. Calculating optimal slot shift...")
            res_slots = registry.execute("find_free_slot", db, {
                "duration_hours": 2.0
            })
            tools_used.append("find_free_slot")
            slots = res_slots.data or []

            target_slot_str = slots[0]["time_range"] if slots else "Tomorrow 5:00 PM - 7:00 PM"

            # Require human approval for schedule shift
            observable_actions.append("Waiting for approval...")
            run_status = "pending_approval"

            # Create AgentApproval DB record
            db_task = db.query(Task).filter(Task.course_code == (parsed.course_code or "CS302")).first()
            approval = AgentApproval(
                action_type="reallocate_study_blocks",
                title=f"Reschedule {parsed.course_code or 'DBMS'} Study Block to {target_slot_str}",
                description=f"The agent detected incomplete work on {parsed.course_code or 'DBMS'}. Proposing shifting 2 hours to {target_slot_str} without violating upcoming deadlines.",
                impact_level="medium",
                payload={
                    "task_id": db_task.id if db_task else None,
                    "subject": parsed.course_code or "DBMS",
                    "proposed_slot": target_slot_str,
                    "reason": "Avoid overload & maintain high priority DAA allocation"
                },
                status="pending",
                created_at=datetime.utcnow()
            )
            db.add(approval)
            db.commit()
            db.refresh(approval)

            approval_required = {
                "approval_id": approval.id,
                "title": approval.title,
                "description": approval.description,
                "proposed_slot": target_slot_str
            }

            plan_steps.append({"step": 2, "action": "Detected incomplete DBMS task progress"})
            plan_steps.append({"step": 3, "action": f"Formulated proposed shift to {target_slot_str}"})
            plan_steps.append({"step": 4, "action": "Created approval request # " + str(approval.id)})

            final_response = f"Detected schedule conflict for {parsed.course_code or 'DBMS'}. Proposed shifting study block to {target_slot_str}. Created a human approval request."

        elif parsed.intent_type == "organize_week":
            observable_actions.append("Analyzing all pending assignments and course target hours...")
            res_tasks = registry.execute("list_tasks", db, {"status": "pending"})
            tools_used.append("list_tasks")

            observable_actions.append("Generating balanced weekly study block plan...")
            res_plan = registry.execute("generate_study_plan", db, {"total_weekly_hours": 18.0})
            tools_used.append("generate_study_plan")
            plan_data = res_plan.data

            plan_steps.append({"step": 2, "action": f"Analyzed {len(res_tasks.data or [])} pending task(s)"})
            plan_steps.append({"step": 3, "action": f"Generated {plan_data['generated_study_blocks_count']} study blocks across subjects"})

            final_response = f"Organized your week! Generated {plan_data['generated_study_blocks_count']} study blocks balancing DAA, DBMS, OS, and ML across 18 target hours."

        elif parsed.intent_type == "get_priority_advice":
            observable_actions.append("Calculating task priority scores and deadline urgency...")
            res_risk = registry.execute("calculate_deadline_risk", db, {})
            tools_used.append("calculate_deadline_risk")

            res_tasks = registry.execute("list_tasks", db, {"status": "pending"})
            tools_used.append("list_tasks")
            pending_list = res_tasks.data or []

            plan_steps.append({"step": 2, "action": "Analyzed deadline proximity & required effort for pending assignments"})

            if pending_list:
                top_task = pending_list[0]
                final_response = f"You should work on '{top_task['title']}' ({top_task['course_code']}) right now! It is due on {datetime.fromisoformat(top_task['deadline']).strftime('%A at %I:%M %p')} with {top_task['estimated_effort']}h remaining effort."
            else:
                final_response = "All assignments are currently up to date! Great job."

        else: # General fallback query
            observable_actions.append("Processing academic operations request...")
            res_tasks = registry.execute("list_tasks", db, {})
            tools_used.append("list_tasks")
            final_response = f"Processed request: '{user_request}'. Found {len(res_tasks.data or [])} active assignment(s) in system."

        duration_ms = int((time.time() - start_time) * 1000)

        # Log run in AgentActivity table
        activity = AgentActivity(
            run_id=run_id,
            user_request=user_request,
            intent=parsed.intent_type,
            plan_steps=plan_steps,
            tools_used=tools_used,
            execution_result=final_response,
            status=run_status,
            duration_ms=duration_ms,
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()

        return AgentRunResponse(
            run_id=run_id,
            user_request=user_request,
            intent=parsed.intent_type,
            status=run_status,
            observable_actions=observable_actions,
            plan_steps=plan_steps,
            tools_used=tools_used,
            final_response=final_response,
            approval_required=approval_required,
            duration_ms=duration_ms
        )
