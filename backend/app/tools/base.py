import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

class ToolResult(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str
    error: Optional[str] = None
    execution_time_ms: int = 0

class BaseTool(ABC):
    name: str
    description: str
    args_schema: Type[BaseModel]

    def run(self, db: Session, args: Dict[str, Any]) -> ToolResult:
        start_time = time.time()
        try:
            # Validate input using Pydantic schema
            validated_args = self.args_schema(**args)
            result_data, message = self._execute(db, validated_args)
            execution_time = int((time.time() - start_time) * 1000)
            return ToolResult(
                success=True,
                data=result_data,
                message=message,
                execution_time_ms=execution_time
            )
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            return ToolResult(
                success=False,
                data=None,
                message=f"Tool execution failed: {str(e)}",
                error=str(e),
                execution_time_ms=execution_time
            )

    @abstractmethod
    def _execute(self, db: Session, args: BaseModel) -> tuple[Any, str]:
        """Implement tool logic in subclass. Return (result_data, success_message)."""
        pass
