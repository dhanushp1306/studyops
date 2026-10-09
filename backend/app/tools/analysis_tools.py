from datetime import datetime, timedelta
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.tools.base import BaseTool
from app.models import Task, CalendarEvent, Subject

# --- 1. calculate_priority ---
class CalculatePriorityArgs(BaseModel):
    task_id: Optional[int] = Field(None, description="ID of existing task to calculate priority for")
    deadline: Optional[datetime] = Field(None, description="Deadline if evaluating hypothetical task")
    estimated_effort: Optional[float] = Field(2.0, description="Effort hours if evaluating hypothetical task")
    workload_count: Optional[int] = Field(None, description="Optional pre-calculated pending task count for loop optimization")

class CalculatePriorityTool(BaseTool):
    name = "calculate_priority"
    description = "Compute multi-factor priority score (0-100) combining deadline urgency, effort, progress, subject importance, and overall workload"
    args_schema = CalculatePriorityArgs

    def _execute(self, db: Session, args: CalculatePriorityArgs) -> tuple[Any, str]:
        deadline = args.deadline
        effort = args.estimated_effort or 2.0
        title = "Hypothetical Task"
        progress = 0
        subject_importance = 1.0

        if args.task_id:
            task = db.query(Task).filter(Task.id == args.task_id).first()
            if not task:
                raise ValueError(f"Task ID {args.task_id} not found")
            deadline = task.deadline or task.due_date
            progress = task.progress or 0
            effort = max(0.5, (task.estimated_effort or task.estimated_hours or 2.0) * (1 - progress / 100.0))
            title = task.title

            # Fetch subject weight if available
            if task.subject_id or task.course_code:
                subj = db.query(Subject).filter(
                    (Subject.id == task.subject_id) | (Subject.code == task.course_code)
                ).first()
                if subj and subj.target_hours_per_week:
                    subject_importance = min(2.0, max(0.8, subj.target_hours_per_week / 4.0))

        if not deadline:
            deadline = datetime.utcnow() + timedelta(days=3)

        now = datetime.utcnow()
        hours_until_deadline = max(0.1, (deadline - now).total_seconds() / 3600)

        # 1. Deadline Urgency Factor (0 - 45)
        urgency_factor = min(45.0, (48.0 / hours_until_deadline) * 20.0) if hours_until_deadline < 48 else max(5.0, 30.0 - hours_until_deadline / 12.0)

        # 2. Effort vs Window Ratio Factor (0 - 25)
        urgency_ratio = effort / hours_until_deadline
        effort_factor = min(25.0, urgency_ratio * 50.0)

        # 3. Subject Importance Factor (0 - 15)
        importance_factor = subject_importance * 7.5

        # 4. Total Current Workload Factor (0 - 15)
        if args.workload_count is not None:
            pending_count = args.workload_count
        else:
            pending_count = db.query(Task).filter(Task.status.in_(["pending", "in_progress"])).count()
        workload_factor = min(15.0, pending_count * 2.5)

        # Combine into multi-factor priority score (0 - 100)
        score = min(100.0, round(urgency_factor + effort_factor + importance_factor + workload_factor, 1))

        if score >= 70 or hours_until_deadline < 36:
            level = "high"
        elif score >= 40:
            level = "medium"
        else:
            level = "low"

        res = {
            "task_id": args.task_id,
            "task_title": title,
            "calculated_score": score,
            "recommended_priority": level,
            "hours_until_deadline": round(hours_until_deadline, 1),
            "remaining_effort_hours": effort,
            "progress_percent": progress,
            "subject_importance_weight": subject_importance,
            "current_workload_tasks": pending_count,
            "urgency_ratio": round(urgency_ratio, 3)
        }
        return res, f"Multi-factor priority score for '{title}': {score}/100 ({level.upper()} priority)"


# --- 2. calculate_deadline_risk ---
class CalculateDeadlineRiskArgs(BaseModel):
    task_id: Optional[int] = Field(None, description="Task ID to assess, or None to assess all pending tasks")

class CalculateDeadlineRiskTool(BaseTool):
    name = "calculate_deadline_risk"
    description = "Analyze workload feasibility by comparing required effort hours against available free calendar time before deadlines"
    args_schema = CalculateDeadlineRiskArgs

    def _execute(self, db: Session, args: CalculateDeadlineRiskArgs) -> tuple[Any, str]:
        now = datetime.utcnow()
        query = db.query(Task).filter(Task.status.in_(["pending", "in_progress"]))

        if args.task_id:
            query = query.filter(Task.id == args.task_id)

        tasks = query.order_by(Task.deadline.asc()).all()

        if not tasks:
            return {"risk_level": "LOW", "bottlenecks": [], "summary": "No pending tasks found."}, "No pending tasks to analyze."

        risks = []
        total_needed_effort = 0.0

        for t in tasks:
            dl = t.deadline or t.due_date
            remaining_effort = max(0.5, (t.estimated_effort or t.estimated_hours or 2.0) * (1 - (t.progress or 0) / 100))
            total_needed_effort += remaining_effort

            hours_left = max(0.1, (dl - now).total_seconds() / 3600)

            # Query existing committed events before deadline
            committed_events = db.query(CalendarEvent).filter(
                CalendarEvent.start_time >= now,
                CalendarEvent.end_time <= dl,
                CalendarEvent.status != "cancelled"
            ).all()

            committed_hours = sum((e.end_time - e.start_time).total_seconds() / 3600 for e in committed_events)
            available_free_hours = max(0.0, hours_left * 0.6 - committed_hours) # Assume 60% of time usable for study

            risk_level = "LOW"
            if remaining_effort > available_free_hours:
                risk_level = "CRITICAL"
            elif remaining_effort > available_free_hours * 0.75:
                risk_level = "HIGH"
            elif remaining_effort > available_free_hours * 0.5:
                risk_level = "MEDIUM"

            risks.append({
                "task_id": t.id,
                "title": t.title,
                "course_code": t.course_code,
                "deadline": dl.isoformat(),
                "hours_until_deadline": round(hours_left, 1),
                "remaining_effort_hours": remaining_effort,
                "available_free_hours": round(available_free_hours, 1),
                "risk_level": risk_level,
                "is_overloaded": remaining_effort > available_free_hours
            })

        overall_risk = "LOW"
        if any(r["risk_level"] == "CRITICAL" for r in risks):
            overall_risk = "CRITICAL"
        elif any(r["risk_level"] == "HIGH" for r in risks):
            overall_risk = "HIGH"
        elif any(r["risk_level"] == "MEDIUM" for r in risks):
            overall_risk = "MEDIUM"

        summary = {
            "overall_deadline_risk": overall_risk,
            "total_pending_tasks": len(tasks),
            "total_remaining_effort_hours": round(total_needed_effort, 1),
            "task_risks": risks
        }
        return summary, f"Overall Deadline Risk: {overall_risk}. Analyzed {len(tasks)} pending task(s)."
