from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed import seed_database

router = APIRouter(prefix="/api", tags=["Seed"])

@router.post("/seed", status_code=status.HTTP_200_OK)
def trigger_seed(db: Session = Depends(get_db)):
    seed_database(db)
    return {
        "status": "success",
        "message": "Database re-seeded with realistic CS student demo data (DAA, DBMS, OS, ML tasks, calendar blocks, study plans, agent activity & approvals)."
    }
