from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.tools.base import BaseTool, ToolResult

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.args_schema.model_json_schema()
            }
            for tool in self._tools.values()
        ]

    def execute(self, name: str, db: Session, args: Dict[str, Any]) -> ToolResult:
        tool = self.get_tool(name)
        if not tool:
            return ToolResult(
                success=False,
                message=f"Tool '{name}' not found in Tool Registry.",
                error=f"Unregistered tool: {name}"
            )
        return tool.run(db, args)

# Global Tool Registry Instance
registry = ToolRegistry()

def init_tool_registry():
    from app.tools.task_tools import CreateTaskTool, UpdateTaskTool, CompleteTaskTool, ListTasksTool
    from app.tools.calendar_tools import CreateEventTool, UpdateEventTool, DeleteEventTool, GetScheduleTool
    from app.tools.planning_tools import FindFreeSlotTool, GenerateStudyPlanTool
    from app.tools.analysis_tools import CalculatePriorityTool, CalculateDeadlineRiskTool

    tools = [
        # Task tools
        CreateTaskTool(),
        UpdateTaskTool(),
        CompleteTaskTool(),
        ListTasksTool(),
        # Calendar tools
        CreateEventTool(),
        UpdateEventTool(),
        DeleteEventTool(),
        GetScheduleTool(),
        # Planning tools
        FindFreeSlotTool(),
        GenerateStudyPlanTool(),
        # Analysis tools
        CalculatePriorityTool(),
        CalculateDeadlineRiskTool()
    ]

    for tool in tools:
        registry.register(tool)

# Initialize registry immediately upon import
init_tool_registry()
