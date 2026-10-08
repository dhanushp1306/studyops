from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_code: str
    course_name: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    estimated_hours: float = 2.0
    completed_hours: float = 0.0
    due_date: datetime

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_hours: Optional[float] = None
    completed_hours: Optional[float] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Calendar Event Schemas ---
class CalendarEventBase(BaseModel):
    title: str
    event_type: str = "study_session"
    course_code: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    status: str = "scheduled"
    linked_task_id: Optional[int] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    course_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    linked_task_id: Optional[int] = None

class CalendarEventResponse(CalendarEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Study Plan Schemas ---
class StudyPlanBase(BaseModel):
    subject: str
    course_code: str
    target_hours_per_week: float = 5.0
    allocated_hours: float = 0.0
    completed_hours: float = 0.0
    priority_level: str = "medium"
    status: str = "active"

class StudyPlanCreate(StudyPlanBase):
    pass

class StudyPlanResponse(StudyPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Agent Activity Schemas ---
class AgentActivityBase(BaseModel):
    run_id: str
    user_request: str
    intent: str
    plan_steps: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[str]] = None
    execution_result: Optional[str] = None
    status: str = "completed"
    duration_ms: int = 0

class AgentActivityCreate(AgentActivityBase):
    pass

class AgentActivityResponse(AgentActivityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Agent Approval Schemas ---
class AgentApprovalBase(BaseModel):
    activity_id: Optional[int] = None
    action_type: str
    title: str
    description: str
    impact_level: str = "medium"
    payload: Optional[Dict[str, Any]] = None
    status: str = "pending"

class AgentApprovalCreate(AgentApprovalBase):
    pass

class AgentApprovalResponse(AgentApprovalBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Health & Stats Schemas ---
class HealthCheckResponse(BaseModel):
    status: str
    app: str
    version: str
    database: str
    timestamp: str

class DashboardStatsResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    high_priority_tasks: int
    completed_tasks: int
    upcoming_events_today: int
    weekly_planned_hours: float
    weekly_completed_hours: float
    pending_approvals_count: int
