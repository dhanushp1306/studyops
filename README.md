# 🎓 studyops — Autonomous Academic Operations Agent

> **Hack2Skill AI Hackathon Project** | *Track: AI Personal Assistant & Autonomous Agents*

**studyops** is an autonomous AI agent system designed to automate academic operations for students. Instead of acting as a simple text chatbot, `studyops` understands complex natural language intents, extracts multi-assignment workloads, formulates multi-step execution plans, dynamically reschedules calendar conflicts, auto-allocates study time blocks, and manages academic workload with human-in-the-loop safety approvals.

---

## 🚩 The Problem

College CS students face overwhelming academic fragmentation:
1. **Multiple Deadlines & Bottlenecks**: Juggling assignments across DAA, DBMS, Operating Systems, and AI/ML without a clear sense of what to prioritize.
2. **Static Timetables**: Existing calendar tools are passive; they don't reschedule study sessions when tasks slip or classes overflow.
3. **Over-reliance on Unsafe Chatbots**: Traditional LLM chatbots often invent dummy actions or hallucinate SQL queries without real application safety boundaries.

---

## 💡 The Solution

`studyops` acts as an **Autonomous Academic Co-Pilot**:
- **Proactive Action Recommendation**: Asks and answers *"What Should I Do Now?"* dynamically by analyzing deadlines, priority scores, remaining effort, completion %, subject target weights, and calendar free slots.
- **Strict Safety Boundaries**: The LLM **NEVER** accesses the database or PostgreSQL directly. Every database mutation is strictly mediated by a **Controlled 12-Tool Registry**.
- **Human-in-the-Loop Approvals**: Potentially disruptive actions (moving calendar blocks, rescheduling tasks) generate explicit approval requests with side-by-side diff cards before execution.
- **Transparent Audit Trail**: Every autonomous decision emits a step-by-step observable execution timeline without exposing private LLM chain-of-thought.

---

## ⚡ Standout Feature: "What Should I Do Now?"

`studyops` features a proactive recommendation engine that continuously evaluates live database state:
$$\text{Priority Score} = f(\text{Deadline Urgency}, \text{Remaining Effort}, \text{Subject Weight}, \text{Workload Ratio})$$

### Example Output:
> *"Work on 'DAA assignment due Friday' (CS301) for 90 minutes now. It has LOW deadline risk, priority score of 59.8/100, and approximately 3.0 hours remaining effort before Friday's deadline."*

**Interactive Actions Provided to Student**:
- ⏱️ **Schedule It**: Automatically reserves an unallocated study slot in the calendar.
- ⚡ **Start Task**: Updates task status and logs study session progress.
- 📊 **Ask Why**: Displays the multi-variable priority calculation breakdown.

---

## 🌟 Key Features

1. **Messy Natural Language Multi-Task Extraction**:
   Handles complex prompts like: *"I have DAA due Friday, DBMS lab Monday and need to prepare CN for the internal. I have college until 4."*
2. **12 Controlled Agent Tools**:
   Task tools (`create_task`, `update_task`, `complete_task`, `list_tasks`), Calendar tools (`create_event`, `update_event`, `delete_event`, `get_schedule`), Planning tools (`find_free_slot`, `generate_study_plan`), and Analysis tools (`calculate_priority`, `calculate_deadline_risk`).
3. **Visual Human Approval Queue**:
   Reviews current state vs. proposed change with rationale banners before executing approved payloads via the Tool Registry.
4. **Observable Audit Timeline**:
   Displays `request_received`, `tool_selected`, `tool_executed`, `tool_result`, `conflict_detected`, `approval_requested`, `action_completed`.
5. **AI-Judge Discoverability**:
   1-click Suggested Prompts pill bar on the Agent Hub page.

---

## 🏗️ System Architecture & Workflow

```text
User Request / Messy NL Input
             │
             ▼
   ┌───────────────────┐
   │  LLM / NLP Layer  │  (Groq / OpenAI / Gemini / Offline NLP Fallback)
   └─────────┬─────────┘
             │ Parses Intent & Entity Constraints
             ▼
   ┌───────────────────┐
   │ AgentOrchestrator │  (Multi-Step Planner & Conflict Detector)
   └─────────┬─────────┘
             │ Structured Function Calls
             ▼
   ┌───────────────────┐
   │   Tool Registry   │  (12 Strongly-Typed Pydantic Tools)
   └─────────┬─────────┘
             ├────────────────────────┐
             ▼                        ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│  Database / Calendar    │  │  Human Approval Queue   │ (Requires Student Approval)
└─────────────────────────┘  └─────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Dark Glassmorphism Design System
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Python 3.14 + FastAPI
- **ORM & DB**: SQLAlchemy 2.0 + SQLite / PostgreSQL
- **LLM Integration**: Groq API (`llama-3.3-70b-versatile`), OpenAI API (`gpt-4o-mini`), Gemini API, or offline NLP fallback
- **Validation**: Pydantic v2

---

## 🚀 Quick Setup & Run Guide

### Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (Default port 8001)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Backend API will run at: `http://localhost:8001/api`  
Interactive OpenAPI Docs: `http://localhost:8001/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 🌐 Public Render Deployment & Live Demo Links

`studyops` is deployed on Render via blueprint (`render.yaml`). You can test it live without local installation:

- 🚀 **Live Web App**: [https://studyops-frontend.onrender.com](https://studyops-frontend.onrender.com)
- ⚙️ **Live Backend API**: [https://studyops-backend.onrender.com/api](https://studyops-backend.onrender.com/api)
- 📖 **Interactive OpenAPI Docs**: [https://studyops-backend.onrender.com/docs](https://studyops-backend.onrender.com/docs)

### ⚡ Populating Live Data (1-Click Seed)
When inspecting a fresh deployment, populate sample CS courses (DAA, DBMS, OS, ML), upcoming deadlines, calendar timetable blocks, study plans, agent traces, and pending human approvals instantly via:
```bash
curl -X POST https://studyops-backend.onrender.com/api/seed
```
*(Or navigate to `/docs`, click `POST /api/seed` $\rightarrow$ **Try it out** $\rightarrow$ **Execute**)*.

---

## 🚀 Quick Setup & Run Guide (Local Development)

### Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (Default port 8001)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Backend API will run at: `http://localhost:8001/api`  
Interactive OpenAPI Docs: `http://localhost:8001/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend application will run locally at: `http://localhost:5173`

---

## 🧪 Automated Test Suite

Run the comprehensive 10-scenario test suite verifying all agent workflows:

```bash
cd backend
python test_agent.py
```

**Test Output**:
```text
Tests Passed: 9/9 (Covering 10 AI-judge scenarios)
[PASS] ALL TESTS PASSED!
```

## 🎯 Sample Agent Prompts

Try these 1-click prompts directly on the **AI Agent Hub** page ([https://studyops-frontend.onrender.com](https://studyops-frontend.onrender.com) or local `http://localhost:5173`):

1. **Proactive Recommendation**: *"What should I do now?"*
2. **Assignment & Scheduling**: *"Add my DAA assignment due Friday. It will take 3 hours."*
3. **Messy Multi-Task Input**: *"I have DAA due Friday, DBMS lab Monday and need to prepare CN for the internal. I have college until 4."*
4. **Weekly Study Optimization**: *"Organize my week around my deadlines."*
5. **Schedule Shift & Approval**: *"I cannot finish my DBMS assignment today. Rearrange my schedule."*

---

## 💡 Overview & Architecture Summary
`studyops` represents a production-ready, lightweight codebase (< 1 MB source tracked) demonstrating real autonomous decision making, controlled tool boundaries, human-in-the-loop safety, and full execution explainability.
