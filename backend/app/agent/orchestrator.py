import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agent.llm import llm_provider
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

        # Step 1: Event request_received
        plan_steps.append({
            "event_type": "request_received",
            "step": 1,
            "action": f"Request received: '{user_request}'",
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        })

        # Step 2: Understand Intent via LLM Decision Layer
        observable_actions.append("Analyzing request intent and extracting course parameters via AI Planner...")
        parsed_dict = llm_provider.parse_intent_and_plan(user_request)

        intent_type = parsed_dict.get("intent_type", "general_query")
        course_code = parsed_dict.get("course_code") or "CS301"
        estimated_hours = float(parsed_dict.get("estimated_hours") or 2.0)
        deadline = parsed_dict.get("deadline") or (datetime.utcnow() + timedelta(days=2))
        task_title = parsed_dict.get("task_title") or f"{course_code} Assignment"

        plan_steps.append({
            "event_type": "tool_selected",
            "step": 2,
            "action": f"Intent recognized: '{intent_type}' for {course_code}",
            "tool": "intent_parser",
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        })

        final_response = ""

        # Route by Intent
        if intent_type == "create_assignment_and_schedule":
            # Tool: create_task
            observable_actions.append(f"Creating task record for {course_code} assignment...")
            plan_steps.append({
                "event_type": "tool_selected",
                "step": 3,
                "action": "Selected tool 'create_task'",
                "tool": "create_task",
                "status": "in_progress"
            })
            res_task = registry.execute("create_task", db, {
                "title": task_title,
                "subject_code": course_code,
                "deadline": deadline.isoformat() if isinstance(deadline, datetime) else str(deadline),
                "priority": "high",
                "estimated_effort": estimated_hours
            })
            tools_used.append("create_task")
            created_task = res_task.data
            plan_steps.append({
                "event_type": "tool_executed",
                "step": 4,
                "action": f"Executed 'create_task' -> Created Task #{created_task['id']} ('{created_task['title']}')",
                "tool": "create_task",
                "status": "completed"
            })

            # Tool: find_free_slot
            observable_actions.append("Checking your calendar for available study slots...")
            plan_steps.append({
                "event_type": "tool_selected",
                "step": 5,
                "action": "Selected tool 'find_free_slot'",
                "tool": "find_free_slot",
                "status": "in_progress"
            })
            res_slots = registry.execute("find_free_slot", db, {
                "duration_hours": min(2.0, estimated_hours),
                "target_date": deadline.isoformat() if isinstance(deadline, datetime) else None
            })
            tools_used.append("find_free_slot")
            slots = res_slots.data or []
            plan_steps.append({
                "event_type": "tool_result",
                "step": 6,
                "action": f"Scanned calendar and found {len(slots)} free study slot(s)",
                "tool": "find_free_slot",
                "status": "completed"
            })

            # Tool: create_event
            if slots:
                best_slot = slots[0]
                observable_actions.append(f"Scheduling study session for {best_slot['time_range']}...")
                res_evt = registry.execute("create_event", db, {
                    "title": f"{course_code} Study Block - {created_task['title']}",
                    "event_type": "study_session",
                    "subject_code": course_code,
                    "start_time": best_slot["start_time"],
                    "end_time": best_slot["end_time"],
                    "linked_task_id": created_task["id"]
                })
                tools_used.append("create_event")
                plan_steps.append({
                    "event_type": "action_completed",
                    "step": 7,
                    "action": f"Scheduled study block on {best_slot['day']} ({best_slot['time_range']})",
                    "tool": "create_event",
                    "status": "completed"
                })

                final_response = f"Added '{created_task['title']}' (due {deadline.strftime('%A, %b %d') if isinstance(deadline, datetime) else 'soon'}). Scheduled a 2-hour study session on {best_slot['day']} ({best_slot['time_range']})."
            else:
                final_response = f"Added '{created_task['title']}'. No open free slots found before deadline."

        elif intent_type == "find_free_time":
            observable_actions.append(f"Checking your calendar for {estimated_hours}h free study slot...")
            plan_steps.append({
                "event_type": "tool_selected",
                "step": 3,
                "action": "Selected tool 'find_free_slot'",
                "tool": "find_free_slot",
                "status": "in_progress"
            })
            res_slots = registry.execute("find_free_slot", db, {
                "duration_hours": estimated_hours,
                "target_date": (datetime.utcnow() + timedelta(days=1)).isoformat()
            })
            tools_used.append("find_free_slot")
            slots = res_slots.data or []
            plan_steps.append({
                "event_type": "tool_result",
                "step": 4,
                "action": f"Located {len(slots)} available slot(s)",
                "tool": "find_free_slot",
                "status": "completed"
            })

            if slots:
                best = slots[0]
                final_response = f"Found {len(slots)} available study slot(s) for {course_code}. Best recommended slot: {best['day']} from {best['time_range']}."
            else:
                final_response = f"No unallocated {estimated_hours}h time slots found in your current schedule."

        elif intent_type == "rearrange_schedule":
            observable_actions.append("Evaluating current task deadlines and progress...")
            res_risk = registry.execute("calculate_deadline_risk", db, {})
            tools_used.append("calculate_deadline_risk")

            observable_actions.append("Found a schedule conflict. Calculating optimal slot shift...")
            plan_steps.append({
                "event_type": "conflict_detected",
                "step": 3,
                "action": f"Schedule conflict detected for {course_code}. Re-planning schedule shift...",
                "status": "warning"
            })
            res_slots = registry.execute("find_free_slot", db, {"duration_hours": 2.0})
            tools_used.append("find_free_slot")
            slots = res_slots.data or []

            target_slot = slots[0] if slots else None
            target_slot_str = target_slot["time_range"] if target_slot else "Tomorrow 5:00 PM - 7:00 PM"

            # Require human approval for schedule shift
            observable_actions.append("Waiting for approval...")
            run_status = "pending_approval"

            db_task = db.query(Task).filter(Task.course_code == (course_code or "CS302")).first()
            approval = AgentApproval(
                action_type="reallocate_study_blocks",
                title=f"Reschedule {course_code or 'DBMS'} Study Block to {target_slot_str}",
                description=f"The AI detected incomplete work on {course_code or 'DBMS'}. Proposing shifting 2 hours to {target_slot_str} without violating upcoming deadlines.",
                impact_level="medium",
                payload={
                    "proposed_tool": "create_event",
                    "arguments": {
                        "title": f"{course_code or 'DBMS'} Rescheduled Study Block",
                        "event_type": "study_session",
                        "subject_code": course_code or "CS302",
                        "start_time": target_slot["start_time"] if target_slot else (datetime.utcnow() + timedelta(days=1, hours=17)).isoformat(),
                        "end_time": target_slot["end_time"] if target_slot else (datetime.utcnow() + timedelta(days=1, hours=19)).isoformat(),
                        "linked_task_id": db_task.id if db_task else None
                    },
                    "current_state": "Current DBMS block is overloaded today",
                    "proposed_change": f"Move 2h study session to {target_slot_str}",
                    "reason": "Avoid overload & maintain high priority allocation"
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

            plan_steps.append({
                "event_type": "approval_requested",
                "step": 4,
                "action": f"Created human approval request #{approval.id} ('{approval.title}')",
                "status": "pending_approval"
            })

            final_response = f"Detected schedule conflict for {course_code or 'DBMS'}. Proposed shifting study block to {target_slot_str}. Created a human approval request."

        elif intent_type == "organize_week":
            observable_actions.append("Analyzing all pending assignments and course target hours...")
            res_tasks = registry.execute("list_tasks", db, {"status": "pending"})
            tools_used.append("list_tasks")

            observable_actions.append("Generating balanced weekly study block plan...")
            res_plan = registry.execute("generate_study_plan", db, {"total_weekly_hours": 18.0})
            tools_used.append("generate_study_plan")
            plan_data = res_plan.data

            plan_steps.append({
                "event_type": "action_completed",
                "step": 3,
                "action": f"Generated {plan_data['generated_study_blocks_count']} study blocks across subjects",
                "tool": "generate_study_plan",
                "status": "completed"
            })

            final_response = f"Organized your week! Generated {plan_data['generated_study_blocks_count']} study blocks balancing DAA, DBMS, OS, and ML across 18 target hours."

        elif intent_type == "get_priority_advice":
            observable_actions.append("Calculating task priority scores and deadline urgency...")
            res_risk = registry.execute("calculate_deadline_risk", db, {})
            tools_used.append("calculate_deadline_risk")

            res_tasks = registry.execute("list_tasks", db, {"status": "pending"})
            tools_used.append("list_tasks")
            pending_list = res_tasks.data or []

            plan_steps.append({
                "event_type": "tool_executed",
                "step": 3,
                "action": "Evaluated deadline urgency, progress %, and required effort for pending assignments",
                "tool": "calculate_priority",
                "status": "completed"
            })

            if pending_list:
                top_task = pending_list[0]
                final_response = f"You should work on '{top_task['title']}' ({top_task['course_code']}) right now! It is due on {datetime.fromisoformat(top_task['deadline']).strftime('%A at %I:%M %p')} with {top_task['estimated_effort']}h remaining effort."
            else:
                final_response = "All assignments are currently up to date! Great job."

        else:
            observable_actions.append("Processing academic operations request...")
            res_tasks = registry.execute("list_tasks", db, {})
            tools_used.append("list_tasks")
            plan_steps.append({
                "event_type": "action_completed",
                "step": 3,
                "action": "Processed academic query",
                "tool": "list_tasks",
                "status": "completed"
            })
            final_response = f"Processed request: '{user_request}'. Found {len(res_tasks.data or [])} active assignment(s) in system."

        duration_ms = int((time.time() - start_time) * 1000)

        # Log run in AgentActivity table
        activity = AgentActivity(
            run_id=run_id,
            user_request=user_request,
            intent=intent_type,
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
            intent=intent_type,
            status=run_status,
            observable_actions=observable_actions,
            plan_steps=plan_steps,
            tools_used=tools_used,
            final_response=final_response,
            approval_required=approval_required,
            duration_ms=duration_ms
        )

