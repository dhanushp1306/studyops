from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Subject
from app.schemas import SubjectResponse, SubjectCreate, SubjectUpdate

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.code.asc()).all()

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(subject_in: SubjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Subject).filter(Subject.code == subject_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code '{subject_in.code}' already exists.")
    
    subject = Subject(**subject_in.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, subject_in: SubjectUpdate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = subject_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return None
