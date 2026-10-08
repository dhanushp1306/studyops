from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AgentApproval, AgentActivity
from app.schemas import AgentApprovalResponse
from app.tools.registry import registry

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
    
    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request #{approval_id} is already resolved ({approval.status}). Duplicate execution prevented."
        )

    # Execute approved action through controlled Tool Registry
    execution_msg = "Approved action executed via Tool Registry."
    if approval.payload and isinstance(approval.payload, dict):
        tool_name = approval.payload.get("proposed_tool") or approval.payload.get("tool_name")
        tool_args = approval.payload.get("arguments") or approval.payload.get("tool_args") or {}

        if tool_name and registry.get_tool(tool_name):
            try:
                res = registry.execute(tool_name, db, tool_args)
                if not res.success:
                    raise HTTPException(status_code=400, detail=f"Tool execution failed: {res.error}")
                execution_msg = f"Executed {tool_name} via Tool Registry: {res.message}"
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Execution error via Tool Registry: {str(e)}")

    approval.status = "approved"
    approval.resolved_at = datetime.utcnow()
    
    # Audit log entry
    audit = AgentActivity(
        run_id=f"approval-{approval.id}-{uuid.uuid4().hex[:6]}",
        user_request=f"User approved action #{approval.id}: {approval.title}",
        intent="human_approval_executed",
        status="completed",
        plan_steps=[
            {"step": 1, "action": f"Human approval #{approval.id} granted by user."},
            {"step": 2, "action": execution_msg}
        ],
        tools_used=[approval.payload.get("proposed_tool", "update_event")] if approval.payload else [],
        execution_result=execution_msg,
        duration_ms=15
    )
    db.add(audit)
    db.commit()
    db.refresh(approval)
    return approval

@router.post("/{approval_id}/reject", response_model=AgentApprovalResponse)
def reject_action(approval_id: int, db: Session = Depends(get_db)):
    approval = db.query(AgentApproval).filter(AgentApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request #{approval_id} is already resolved ({approval.status})."
        )
    
    approval.status = "rejected"
    approval.resolved_at = datetime.utcnow()

    # Audit log entry for rejection
    audit = AgentActivity(
        run_id=f"reject-{approval.id}-{uuid.uuid4().hex[:6]}",
        user_request=f"User rejected action #{approval.id}: {approval.title}",
        intent="human_approval_rejected",
        status="failed",
        plan_steps=[
            {"step": 1, "action": f"Human approval #{approval.id} rejected by user. Proposed payload execution cancelled."}
        ],
        tools_used=[],
        execution_result="Action rejected. No database changes were made.",
        duration_ms=5
    )
    db.add(audit)
    db.commit()
    db.refresh(approval)
    return approval
