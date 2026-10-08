# 🎓 studyops — Autonomous Academic Operations Agent

> **Hack2Skill Hackathon Project** | *Track: AI Personal Assistant & Autonomous Agents*

**studyops** is an AI agent system designed to streamline and automate academic operations for students. Instead of acting as a simple text chatbot, `studyops` understands complex user intents, builds multi-step execution plans, dynamically reschedules calendar conflicts, tracks deadlines, auto-allocates study time blocks, and manages workload balance with human-in-the-loop approvals.

---

## 🌟 Key Features

- ⚡ **Autonomous Execution Pipeline**: Intent Analysis → Dynamic Planning → Tool Selection → Action Execution → Re-planning & Approval Requests.
- 📊 **Academic Dashboard**: Real-time view of deadlines, workload intensity, upcoming study blocks, and agent activity metrics.
- 🤖 **Interactive AI Agent Hub**: Visual execution pipeline displaying intent recognition, generated sub-plans, tool calls, and real-time execution feedback.
- 📋 **Assignment & Task Management**: Intelligent priority tracking, course tagging (DAA, DBMS, OS, AI/ML), effort estimation (hours), and status workflow.
- 📅 **Dynamic Study Calendar**: Auto-balanced calendar integration for study blocks, class schedules, and deadline milestones.
- ⚖️ **Workload & Study Planner**: Target vs. actual study metrics, subject balance analytics, and automated weekly schedule optimization.
- 📜 **Agent Audit Trail & Activity Log**: Full trace of autonomous decisions, tool invocations, reasoning steps, and timestamps.
- 🛡️ **Human-in-the-Loop Approvals**: Approval queue for high-impact actions like rescheduling deadlines, dropping non-critical tasks, or shifting study blocks.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Dark Glassmorphism Design System
- **Icons**: Lucide React
- **API Client**: Axios

### Backend
- **Framework**: Python 3.14 + FastAPI
- **ORM & DB**: SQLAlchemy 2.0 (Async/Sync) + Alembic Migrations
- **Database**: PostgreSQL (with automatic SQLite fallback for lightweight local dev)
- **Validation**: Pydantic v2

---

## 📁 Repository Structure

```
studyops/
├── frontend/             # React + TypeScript + Vite UI Application
│   ├── src/
│   │   ├── api/          # API client integration layer
│   │   ├── components/   # UI Layout (Sidebar, Navbar, Cards)
│   │   ├── pages/        # 7 Main Pages (Dashboard, AI Agent, Tasks, Calendar, etc.)
│   │   └── types/        # TypeScript interfaces & types
│   ├── package.json
│   └── tailwind.config.js
├── backend/              # FastAPI + SQLAlchemy backend service
│   ├── app/
│   │   ├── routes/       # FastAPI REST endpoints
│   │   ├── models.py     # SQLAlchemy DB models
│   │   ├── schemas.py    # Pydantic validation schemas
│   │   ├── database.py   # DB Connection & session setup
│   │   └── seed.py       # Realistic CS student demo data generator
│   ├── alembic/          # Migration scripts
│   ├── main.py           # Backend server entrypoint
│   └── requirements.txt  # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **Python**: 3.10+ (3.14 recommended)

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed demo data
python app/seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend API will be accessible at: `http://localhost:8000`  
Health check endpoint: `http://localhost:8000/api/health`  
Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend application will be accessible at: `http://localhost:5173`

---

## 🔗 API Health Endpoint

Send a GET request to verify system operational status:

`GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "app": "studyops - Autonomous Academic Operations Agent",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-10-08T23:15:00Z"
}
```

---

## 🏆 Hackathon Context
Built for **Hack2Skill Hackathon - AI Personal Assistant & Autonomous Agents Track**.
Designed to showcase real autonomous execution, multi-tool orchestration, human approvals, and academic operations optimization.
