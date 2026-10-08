import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.routes import health, tasks, subjects, calendar, study_sessions, study_plans, agent_activity, approvals, seed, tools_route
from app.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    # Check if DB is empty or needs initial seed
    db = SessionLocal()
    try:
        from app.models import Task
        if db.query(Task).count() == 0:
            print("No tasks found in database. Running initial seed...")
            seed_database(db)
    except Exception as e:
        print(f"Auto-seed check note: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="studyops API",
    description="Autonomous Academic Operations Agent backend service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(subjects.router)
app.include_router(tasks.router)
app.include_router(calendar.router)
app.include_router(study_sessions.router)
app.include_router(study_plans.router)
app.include_router(agent_activity.router)
app.include_router(approvals.router)
app.include_router(seed.router)
app.include_router(tools_route.router)

@app.get("/")
def root():
    return {
        "app": "studyops - Autonomous Academic Operations Agent",
        "docs": "/docs",
        "health": "/api/health"
    }
