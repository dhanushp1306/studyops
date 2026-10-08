from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True, index=True) # e.g. CS301
    description = Column(Text, nullable=True)
    color = Column(String(30), default="#10b981") # Accent color hex code
    target_hours_per_week = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="subject", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="subject")
    study_sessions = relationship("StudySession", back_populates="subject", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    course_code = Column(String(50), nullable=True) # Fallback / display cache
    course_name = Column(String(255), nullable=True)
    priority = Column(String(20), default="medium") # high, medium, low
    status = Column(String(20), default="pending") # pending, in_progress, completed, overdue
    progress = Column(Float, default=0.0) # 0.0 to 100.0 percentage
    estimated_effort = Column(Float, default=2.0) # Estimated effort in hours
    completed_hours = Column(Float, default=0.0) # Hours completed so far
    deadline = Column(DateTime, nullable=False, index=True)
    due_date = Column(DateTime, nullable=False) # Synonym/compat field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="tasks")
    calendar_events = relationship("CalendarEvent", back_populates="task", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="task", cascade="all, delete-orphan")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(50), default="study_session") # class, study_session, assignment_work, deadline, exam
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    course_code = Column(String(50), nullable=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    status = Column(String(20), default="scheduled") # scheduled, active, completed, cancelled, rescheduled
    linked_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="calendar_events")
    task = relationship("Task", back_populates="calendar_events")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String(20), default="scheduled") # scheduled, in_progress, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="study_sessions")
    task = relationship("Task", back_populates="study_sessions")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False)
    course_code = Column(String(50), nullable=False)
    target_hours_per_week = Column(Float, default=5.0)
    allocated_hours = Column(Float, default=0.0)
    completed_hours = Column(Float, default=0.0)
    priority_level = Column(String(20), default="medium") # high, medium, low
    status = Column(String(20), default="active") # active, on_track, behind, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentActivity(Base):
    __tablename__ = "agent_activities"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), unique=True, index=True, nullable=False)
    user_request = Column(Text, nullable=False)
    intent = Column(String(100), nullable=False)
    plan_steps = Column(JSON, nullable=True)
    tools_used = Column(JSON, nullable=True)
    execution_result = Column(Text, nullable=True)
    status = Column(String(30), default="completed")
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    approvals = relationship("AgentApproval", back_populates="activity", cascade="all, delete-orphan")


class AgentApproval(Base):
    __tablename__ = "agent_approvals"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("agent_activities.id", ondelete="CASCADE"), nullable=True)
    action_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    impact_level = Column(String(20), default="medium")
    payload = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    activity = relationship("AgentActivity", back_populates="approvals")
