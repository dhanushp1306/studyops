from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudySession, Subject, Task
from app.schemas import StudySessionResponse, StudySessionCreate, StudySessionUpdate

router = APIRouter(prefix="/api/study-sessions", tags=["Study Sessions"])

@router.get("", response_model=List[StudySessionResponse])
def get_study_sessions(
    subject_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StudySession)
    if subject_id:
        query = query.filter(StudySession.subject_id == subject_id)
    if status:
        query = query.filter(StudySession.status == status)
    return query.order_by(StudySession.start_time.asc()).all()

@router.post("", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def create_study_session(session_in: StudySessionCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == session_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Invalid subject_id provided")

    if session_in.task_id:
        task = db.query(Task).filter(Task.id == session_in.task_id).first()
        if not task:
            raise HTTPException(status_code=400, detail="Invalid task_id provided")

    session_data = session_in.model_dump()
    # Calculate duration_minutes if not explicit
    if session_in.start_time and session_in.end_time:
        diff = session_in.end_time - session_in.start_time
        session_data["duration_minutes"] = max(15, int(diff.total_seconds() / 60))

    study_session = StudySession(**session_data)
    db.add(study_session)
    db.commit()
    db.refresh(study_session)
    return study_session

@router.get("/{session_id}", response_model=StudySessionResponse)
def get_study_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    return session

@router.put("/{session_id}", response_model=StudySessionResponse)
def update_study_session(session_id: int, session_in: StudySessionUpdate, db: Session = Depends(get_db)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    update_data = session_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    db.delete(session)
    db.commit()
    return None
