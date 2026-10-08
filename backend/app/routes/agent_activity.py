from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AgentActivity
from app.schemas import AgentActivityResponse, AgentActivityCreate

router = APIRouter(prefix="/api/agent/activity", tags=["Agent Activity"])

@router.get("", response_model=List[AgentActivityResponse])
def get_agent_activities(db: Session = Depends(get_db)):
    return db.query(AgentActivity).order_by(AgentActivity.created_at.desc()).all()

@router.post("", response_model=AgentActivityResponse, status_code=status.HTTP_201_CREATED)
def create_agent_activity(activity_in: AgentActivityCreate, db: Session = Depends(get_db)):
    activity = AgentActivity(**activity_in.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.get("/{activity_id}", response_model=AgentActivityResponse)
def get_agent_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(AgentActivity).filter(AgentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Agent activity run not found")
    return activity
