from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CalendarEvent
from app.schemas import CalendarEventResponse, CalendarEventCreate, CalendarEventUpdate

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

@router.get("/events", response_model=List[CalendarEventResponse])
def get_calendar_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CalendarEvent)
    if start:
        query = query.filter(CalendarEvent.start_time >= start)
    if end:
        query = query.filter(CalendarEvent.end_time <= end)
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    return query.order_by(CalendarEvent.start_time.asc()).all()

@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_calendar_event(event_in: CalendarEventCreate, db: Session = Depends(get_db)):
    event = CalendarEvent(**event_in.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return event

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(event_id: int, event_in: CalendarEventUpdate, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return event

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    db.delete(event)
    db.commit()
    return None
