from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.tools.base import BaseTool
from app.models import Task, Subject

# --- 1. create_task ---
class CreateTaskArgs(BaseModel):
    title: str = Field(..., description="Title of the assignment or task")
    description: Optional[str] = Field(None, description="Detailed instructions or problem description")
    subject_code: Optional[str] = Field(None, description="Subject code e.g. CS301, CS302")
    deadline: datetime = Field(..., description="Target due date and time ISO string")
    priority: str = Field("medium", description="Priority level: high, medium, low")
    estimated_effort: float = Field(2.0, description="Estimated effort in hours e.g. 3.0")

class CreateTaskTool(BaseTool):
    name = "create_task"
    description = "Create a new CS assignment or study task in the database"
    args_schema = CreateTaskArgs

    def _execute(self, db: Session, args: CreateTaskArgs) -> tuple[Any, str]:
        subject_id = None
        course_name = None
        course_code = args.subject_code or "CS301"

        if args.subject_code:
            subj = db.query(Subject).filter(Subject.code == args.subject_code.upper()).first()
            if subj:
                subject_id = subj.id
                course_name = subj.name
                course_code = subj.code

        task = Task(
            title=args.title,
            description=args.description,
            subject_id=subject_id,
            course_code=course_code,
            course_name=course_name,
            priority=args.priority.lower(),
            status="pending",
            progress=0.0,
            estimated_effort=args.estimated_effort,
            completed_hours=0.0,
            deadline=args.deadline,
            due_date=args.deadline
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        res_data = {
            "id": task.id,
            "title": task.title,
            "course_code": task.course_code,
            "priority": task.priority,
            "status": task.status,
            "deadline": task.deadline.isoformat(),
            "estimated_effort": task.estimated_effort
        }
        return res_data, f"Created assignment '{task.title}' (ID: {task.id}) due {task.deadline.strftime('%b %d, %H:%M')}"


# --- 2. update_task ---
class UpdateTaskArgs(BaseModel):
    task_id: int = Field(..., description="ID of the task to update")
    title: Optional[str] = Field(None, description="Updated title")
    description: Optional[str] = Field(None, description="Updated description")
    deadline: Optional[datetime] = Field(None, description="Updated deadline")
    priority: Optional[str] = Field(None, description="Updated priority: high, medium, low")
    progress: Optional[float] = Field(None, ge=0.0, le=100.0, description="Completion percentage 0.0 to 100.0")
    status: Optional[str] = Field(None, description="Status: pending, in_progress, completed, overdue")
    estimated_effort: Optional[float] = Field(None, description="Updated effort estimate in hours")

class UpdateTaskTool(BaseTool):
    name = "update_task"
    description = "Update details, status, deadline, or progress percentage of an existing task"
    args_schema = UpdateTaskArgs

    def _execute(self, db: Session, args: UpdateTaskArgs) -> tuple[Any, str]:
        task = db.query(Task).filter(Task.id == args.task_id).first()
        if not task:
            raise ValueError(f"Task with ID {args.task_id} not found")

        if args.title is not None: task.title = args.title
        if args.description is not None: task.description = args.description
        if args.priority is not None: task.priority = args.priority.lower()
        if args.estimated_effort is not None: task.estimated_effort = args.estimated_effort
        if args.deadline is not None:
            task.deadline = args.deadline
            task.due_date = args.deadline
        
        if args.progress is not None:
            task.progress = args.progress
            if args.progress >= 100.0:
                task.status = "completed"
            elif args.progress > 0 and task.status == "pending":
                task.status = "in_progress"

        if args.status is not None:
            task.status = args.status
            if args.status == "completed":
                task.progress = 100.0

        db.commit()
        db.refresh(task)

        res_data = {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "progress": task.progress,
            "deadline": task.deadline.isoformat()
        }
        return res_data, f"Updated task ID {task.id} ('{task.title}') - Status: {task.status}, Progress: {task.progress}%"


# --- 3. complete_task ---
class CompleteTaskArgs(BaseModel):
    task_id: int = Field(..., description="ID of the task to mark completed")

class CompleteTaskTool(BaseTool):
    name = "complete_task"
    description = "Mark an assignment or task as fully completed (100% progress)"
    args_schema = CompleteTaskArgs

    def _execute(self, db: Session, args: CompleteTaskArgs) -> tuple[Any, str]:
        task = db.query(Task).filter(Task.id == args.task_id).first()
        if not task:
            raise ValueError(f"Task with ID {args.task_id} not found")

        task.status = "completed"
        task.progress = 100.0
        task.completed_hours = task.estimated_effort
        db.commit()

        return {"id": task.id, "title": task.title, "status": "completed"}, f"Completed assignment '{task.title}' (ID: {task.id})"


# --- 4. list_tasks ---
class ListTasksArgs(BaseModel):
    status: Optional[str] = Field(None, description="Filter by status: pending, in_progress, completed, overdue")
    subject_code: Optional[str] = Field(None, description="Filter by course code e.g. CS301")
    priority: Optional[str] = Field(None, description="Filter by priority: high, medium, low")
    sort_by_deadline: bool = Field(True, description="Sort tasks by earliest deadline first")

class ListTasksTool(BaseTool):
    name = "list_tasks"
    description = "Retrieve list of tasks/assignments filtered by status, subject, or priority"
    args_schema = ListTasksArgs

    def _execute(self, db: Session, args: ListTasksArgs) -> tuple[Any, str]:
        query = db.query(Task)
        if args.status:
            query = query.filter(Task.status == args.status)
        if args.subject_code:
            query = query.filter(Task.course_code == args.subject_code.upper())
        if args.priority:
            query = query.filter(Task.priority == args.priority.lower())

        if args.sort_by_deadline:
            query = query.order_by(Task.deadline.asc())

        tasks = query.all()
        tasks_data = [
            {
                "id": t.id,
                "title": t.title,
                "course_code": t.course_code,
                "priority": t.priority,
                "status": t.status,
                "progress": t.progress,
                "estimated_effort": t.estimated_effort,
                "deadline": t.deadline.isoformat()
            }
            for t in tasks
        ]
        return tasks_data, f"Retrieved {len(tasks_data)} task(s)"
