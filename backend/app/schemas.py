from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    color: str = "#10b981"
    target_hours_per_week: float = 5.0

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    target_hours_per_week: Optional[float] = None

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    course_code: Optional[str] = "CS301"
    course_name: Optional[str] = None
    priority: str = "medium" # high, medium, low
    status: str = "pending" # pending, in_progress, completed, overdue
    progress: float = Field(default=0.0, ge=0.0, le=100.0) # 0.0 to 100.0%
    estimated_effort: float = Field(default=2.0, gt=0.0) # hours
    completed_hours: float = 0.0
    deadline: datetime
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    estimated_effort: Optional[float] = None
    completed_hours: Optional[float] = None
    deadline: Optional[datetime] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    due_date: datetime
    estimated_hours: Optional[float] = None  # Alias for estimated_effort for frontend compatibility
    subject: Optional[SubjectResponse] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode='before')
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, '__dict__'):
            # SQLAlchemy model instance
            obj_dict = {}
            for k in ['id', 'title', 'description', 'subject_id', 'course_code', 'course_name',
                      'priority', 'status', 'progress', 'estimated_effort', 'completed_hours',
                      'deadline', 'due_date', 'created_at', 'updated_at', 'subject']:
                obj_dict[k] = getattr(data, k, None)
            obj_dict['estimated_hours'] = obj_dict.get('estimated_effort', 2.0)
            if not obj_dict.get('due_date') and obj_dict.get('deadline'):
                obj_dict['due_date'] = obj_dict['deadline']
            return obj_dict
        if isinstance(data, dict):
            data['estimated_hours'] = data.get('estimated_hours') or data.get('estimated_effort', 2.0)
            if not data.get('due_date') and data.get('deadline'):
                data['due_date'] = data['deadline']
        return data

    class Config:
        from_attributes = True


# --- Calendar Event Schemas ---
class CalendarEventBase(BaseModel):
    title: str
    event_type: str = "study_session"
    subject_id: Optional[int] = None
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
    subject_id: Optional[int] = None
    course_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    linked_task_id: Optional[int] = None

class CalendarEventResponse(CalendarEventBase):
    id: int
    subject: Optional[SubjectResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Study Session Schemas ---
class StudySessionBase(BaseModel):
    title: str
    subject_id: int
    task_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 60
    status: str = "scheduled"
    notes: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[int] = None
    task_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class StudySessionResponse(StudySessionBase):
    id: int
    subject: Optional[SubjectResponse] = None
    created_at: datetime
    updated_at: datetime

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


# --- Agent Activity & Approval Schemas ---
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
