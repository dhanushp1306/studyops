from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Task, Subject, CalendarEvent, StudyPlan, AgentApproval
from app.schemas import TaskResponse, TaskCreate, TaskUpdate, DashboardStatsResponse

router = APIRouter(prefix="/api", tags=["Tasks"])

@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    subject_id: Optional[int] = None,
    course_code: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if subject_id:
        query = query.filter(Task.subject_id == subject_id)
    if course_code:
        query = query.filter(Task.course_code == course_code)
    if priority:
        query = query.filter(Task.priority == priority)
    return query.order_by(Task.deadline.asc()).all()

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task_data = task_in.model_dump()
    
    # Ensure deadline and due_date are synchronized
    if not task_data.get("deadline") and task_data.get("due_date"):
        task_data["deadline"] = task_data["due_date"]
    elif task_data.get("deadline") and not task_data.get("due_date"):
        task_data["due_date"] = task_data["deadline"]

    # If subject_id provided, sync course_code
    if task_data.get("subject_id"):
        subject = db.query(Subject).filter(Subject.id == task_data["subject_id"]).first()
        if subject:
            task_data["course_code"] = subject.code
            task_data["course_name"] = subject.name

    task = Task(**task_data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)

    # Sync deadline & due_date if updated
    if "deadline" in update_data and update_data["deadline"]:
        update_data["due_date"] = update_data["deadline"]
    elif "due_date" in update_data and update_data["due_date"]:
        update_data["deadline"] = update_data["due_date"]

    # Auto mark completed if progress reached 100%
    if "progress" in update_data and update_data["progress"] >= 100.0:
        update_data["status"] = "completed"

    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)

    total_tasks = db.query(Task).count()
    pending_tasks = db.query(Task).filter(Task.status.in_(["pending", "in_progress"])).count()
    high_priority_tasks = db.query(Task).filter(Task.priority == "high", Task.status != "completed").count()
    completed_tasks = db.query(Task).filter(Task.status == "completed").count()
    
    upcoming_today = db.query(CalendarEvent).filter(
        CalendarEvent.start_time >= today_start,
        CalendarEvent.start_time < today_end
    ).count()

    plans = db.query(StudyPlan).all()
    weekly_planned = sum(p.target_hours_per_week for p in plans)
    weekly_completed = sum(p.completed_hours for p in plans)

    pending_approvals = db.query(AgentApproval).filter(AgentApproval.status == "pending").count()

    return {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "high_priority_tasks": high_priority_tasks,
        "completed_tasks": completed_tasks,
        "upcoming_events_today": upcoming_today,
        "weekly_planned_hours": weekly_planned,
        "weekly_completed_hours": weekly_completed,
        "pending_approvals_count": pending_approvals
    }
