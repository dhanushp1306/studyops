from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudyPlan
from app.schemas import StudyPlanResponse, StudyPlanCreate

router = APIRouter(prefix="/api/study-plans", tags=["Study Plans"])

@router.get("", response_model=List[StudyPlanResponse])
def get_study_plans(db: Session = Depends(get_db)):
    return db.query(StudyPlan).order_by(StudyPlan.priority_level.asc()).all()

@router.post("", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(plan_in: StudyPlanCreate, db: Session = Depends(get_db)):
    plan = StudyPlan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=StudyPlanResponse)
def update_study_plan(plan_id: int, plan_in: StudyPlanCreate, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.delete(plan)
    db.commit()
    return None
