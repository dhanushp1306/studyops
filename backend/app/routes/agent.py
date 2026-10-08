from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.agent.orchestrator import AgentOrchestrator, AgentRunResponse

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])

class AgentRunRequest(BaseModel):
    user_request: str = Field(..., description="Natural language prompt e.g. 'Add my DAA assignment due Friday. It will take 3 hours.'")

orchestrator = AgentOrchestrator()

@router.post("/run", response_model=AgentRunResponse)
def run_agent_orchestrator(req: AgentRunRequest, db: Session = Depends(get_db)):
    if not req.user_request.strip():
        raise HTTPException(status_code=400, detail="user_request prompt cannot be empty")
    
    result = orchestrator.run(req.user_request, db)
    return result
