from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AgentApproval
from app.schemas import AgentApprovalResponse

router = APIRouter(prefix="/api/agent/approvals", tags=["Agent Approvals"])

@router.get("", response_model=List[AgentApprovalResponse])
def get_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentApproval)
    if status:
        query = query.filter(AgentApproval.status == status)
    return query.order_by(AgentApproval.created_at.desc()).all()

@router.post("/{approval_id}/approve", response_model=AgentApprovalResponse)
def approve_action(approval_id: int, db: Session = Depends(get_db)):
    approval = db.query(AgentApproval).filter(AgentApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval.status = "approved"
    approval.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(approval)
    return approval

@router.post("/{approval_id}/reject", response_model=AgentApprovalResponse)
def reject_action(approval_id: int, db: Session = Depends(get_db)):
    approval = db.query(AgentApproval).filter(AgentApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval.status = "rejected"
    approval.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(approval)
    return approval
