from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.tools.registry import registry
from app.tools.base import ToolResult

router = APIRouter(prefix="/api/agent/tools", tags=["Agent Tools"])

class ExecuteToolRequest(BaseModel):
    tool_name: str = Field(..., description="Name of registered tool e.g. create_task, find_free_slot")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Input arguments payload for the tool")

@router.get("", response_model=Dict[str, Any])
def list_agent_tools():
    tools = registry.list_tools()
    return {
        "count": len(tools),
        "tools": tools
    }

@router.post("/execute", response_model=ToolResult)
def execute_agent_tool(req: ExecuteToolRequest, db: Session = Depends(get_db)):
    result = registry.execute(req.tool_name, db, req.arguments)
    return result
