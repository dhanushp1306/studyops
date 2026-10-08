from datetime import datetime, timedelta
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.tools.base import BaseTool
from app.models import CalendarEvent, StudySession, Subject, Task

# --- 1. create_event ---
class CreateEventArgs(BaseModel):
    title: str = Field(..., description="Title of event e.g. DAA Study Session, DBMS Lecture")
    event_type: str = Field("study_session", description="Category: class, study_session, assignment_work, exam")
    start_time: datetime = Field(..., description="Start timestamp ISO string")
    end_time: datetime = Field(..., description="End timestamp ISO string")
    subject_code: Optional[str] = Field(None, description="Course code e.g. CS301")
    linked_task_id: Optional[int] = Field(None, description="Optional linked task ID")
    location: Optional[str] = Field(None, description="Location or venue e.g. Central Library")

class CreateEventTool(BaseTool):
    name = "create_event"
    description = "Create a new event or study block on the student calendar"
    args_schema = CreateEventArgs

    def _execute(self, db: Session, args: CreateEventArgs) -> tuple[Any, str]:
        if args.start_time >= args.end_time:
            raise ValueError("Event start_time must be strictly before end_time")

        subject_id = None
        course_code = args.subject_code

        if args.subject_code:
            subj = db.query(Subject).filter(Subject.code == args.subject_code.upper()).first()
            if subj:
                subject_id = subj.id
                course_code = subj.code

        event = CalendarEvent(
            title=args.title,
            event_type=args.event_type.lower(),
            subject_id=subject_id,
            course_code=course_code,
            start_time=args.start_time,
            end_time=args.end_time,
            location=args.location,
            linked_task_id=args.linked_task_id,
            status="scheduled"
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # If it's a study session, also create StudySession record
        if args.event_type.lower() in ["study_session", "assignment_work"] and subject_id:
            duration_mins = int((args.end_time - args.start_time).total_seconds() / 60)
            session = StudySession(
                title=args.title,
                subject_id=subject_id,
                task_id=args.linked_task_id,
                start_time=args.start_time,
                end_time=args.end_time,
                duration_minutes=duration_mins,
                status="scheduled"
            )
            db.add(session)
            db.commit()

        res_data = {
            "id": event.id,
            "title": event.title,
            "event_type": event.event_type,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "course_code": event.course_code
        }
        return res_data, f"Scheduled {event.event_type.replace('_', ' ')} '{event.title}' on {event.start_time.strftime('%b %d at %H:%M')}"


# --- 2. update_event ---
class UpdateEventArgs(BaseModel):
    event_id: int = Field(..., description="ID of calendar event to update")
    title: Optional[str] = Field(None, description="Updated event title")
    start_time: Optional[datetime] = Field(None, description="Updated start time")
    end_time: Optional[datetime] = Field(None, description="Updated end time")
    status: Optional[str] = Field(None, description="Updated status: scheduled, active, completed, cancelled, rescheduled")
    location: Optional[str] = Field(None, description="Updated venue")

class UpdateEventTool(BaseTool):
    name = "update_event"
    description = "Reschedule or modify an existing calendar event"
    args_schema = UpdateEventArgs

    def _execute(self, db: Session, args: UpdateEventArgs) -> tuple[Any, str]:
        event = db.query(CalendarEvent).filter(CalendarEvent.id == args.event_id).first()
        if not event:
            raise ValueError(f"Calendar event ID {args.event_id} not found")

        if args.title is not None: event.title = args.title
        if args.start_time is not None: event.start_time = args.start_time
        if args.end_time is not None: event.end_time = args.end_time
        if args.status is not None: event.status = args.status
        if args.location is not None: event.location = args.location

        db.commit()
        db.refresh(event)

        res_data = {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "status": event.status
        }
        return res_data, f"Updated calendar event ID {event.id} ('{event.title}')"


# --- 3. delete_event ---
class DeleteEventArgs(BaseModel):
    event_id: int = Field(..., description="ID of calendar event to delete")

class DeleteEventTool(BaseTool):
    name = "delete_event"
    description = "Remove a calendar event or study session"
    args_schema = DeleteEventArgs

    def _execute(self, db: Session, args: DeleteEventArgs) -> tuple[Any, str]:
        event = db.query(CalendarEvent).filter(CalendarEvent.id == args.event_id).first()
        if not event:
            raise ValueError(f"Calendar event ID {args.event_id} not found")

        title = event.title
        db.delete(event)
        db.commit()

        return {"id": args.event_id, "deleted": True}, f"Deleted calendar event '{title}' (ID: {args.event_id})"


# --- 4. get_schedule ---
class GetScheduleArgs(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Start date of schedule range")
    end_date: Optional[datetime] = Field(None, description="End date of schedule range")
    subject_code: Optional[str] = Field(None, description="Filter by course code e.g. CS301")

class GetScheduleTool(BaseTool):
    name = "get_schedule"
    description = "Retrieve list of scheduled events, study blocks, and classes for a time window"
    args_schema = GetScheduleArgs

    def _execute(self, db: Session, args: GetScheduleArgs) -> tuple[Any, str]:
        query = db.query(CalendarEvent)
        if args.start_date:
            query = query.filter(CalendarEvent.start_time >= args.start_date)
        if args.end_date:
            query = query.filter(CalendarEvent.end_time <= args.end_date)
        if args.subject_code:
            query = query.filter(CalendarEvent.course_code == args.subject_code.upper())

        events = query.order_by(CalendarEvent.start_time.asc()).all()
        events_data = [
            {
                "id": e.id,
                "title": e.title,
                "event_type": e.event_type,
                "course_code": e.course_code,
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat(),
                "location": e.location,
                "status": e.status
            }
            for e in events
        ]
        return events_data, f"Retrieved {len(events_data)} calendar event(s)"
