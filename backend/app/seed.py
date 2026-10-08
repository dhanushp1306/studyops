import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import Task, Subject, CalendarEvent, StudySession, StudyPlan, AgentActivity, AgentApproval

def seed_database(db: Session):
    # Recreate tables to reflect updated schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.utcnow()
    
    # Calculate key dates
    days_until_friday = (4 - now.weekday()) % 7
    if days_until_friday == 0:
        days_until_friday = 7
    this_friday = (now + timedelta(days=days_until_friday)).replace(hour=23, minute=59, second=0)
    tomorrow = (now + timedelta(days=1)).replace(hour=14, minute=0, second=0)
    day_after = (now + timedelta(days=2)).replace(hour=10, minute=0, second=0)

    # 1. Create CS Subjects
    subject_daa = Subject(
        name="Design & Analysis of Algorithms",
        code="CS301",
        description="Core algorithms, dynamic programming, graph theory, and greedy algorithms.",
        color="#10b981", # Emerald
        target_hours_per_week=6.0
    )
    subject_dbms = Subject(
        name="Database Management Systems",
        code="CS302",
        description="Relational data modeling, SQL indexing, transaction management & concurrency.",
        color="#06b6d4", # Cyan
        target_hours_per_week=5.0
    )
    subject_os = Subject(
        name="Operating Systems",
        code="CS303",
        description="Process scheduling, memory management, file systems & concurrency primitives.",
        color="#8b5cf6", # Violet
        target_hours_per_week=4.0
    )
    subject_ml = Subject(
        name="Machine Learning & Deep Learning",
        code="CS405",
        description="Supervised learning, Transformer neural networks & attention mechanisms.",
        color="#f59e0b", # Amber
        target_hours_per_week=3.0
    )

    db.add_all([subject_daa, subject_dbms, subject_os, subject_ml])
    db.commit()

    db.refresh(subject_daa)
    db.refresh(subject_dbms)
    db.refresh(subject_os)
    db.refresh(subject_ml)

    # 2. Create Tasks / Assignments with Subject FK, Progress %, Estimated Effort
    task_daa = Task(
        title="DAA Assignment 4 - Dynamic Programming & Greedy Algorithms",
        description="Solve 5 problems on Floyd-Warshall, Knapsack and Activity Selection. Implement in Python with complexity analysis.",
        subject_id=subject_daa.id,
        course_code=subject_daa.code,
        course_name=subject_daa.name,
        priority="high",
        status="in_progress",
        progress=25.0,
        estimated_effort=3.0,
        completed_hours=0.75,
        deadline=this_friday,
        due_date=this_friday
    )

    task_dbms = Task(
        title="DBMS Mini Project Phase 2 - Indexing & Query Optimization",
        description="Implement B+ Tree index visualization and benchmark SELECT performance against unindexed tables.",
        subject_id=subject_dbms.id,
        course_code=subject_dbms.code,
        course_name=subject_dbms.name,
        priority="high",
        status="in_progress",
        progress=33.0,
        estimated_effort=4.5,
        completed_hours=1.5,
        deadline=now + timedelta(days=4),
        due_date=now + timedelta(days=4)
    )

    task_os = Task(
        title="OS Lab 3 - Process Scheduling Simulator",
        description="Simulate Round Robin, Shortest Remaining Time First (SRTF), and Multi-Level Feedback Queue schedulers.",
        subject_id=subject_os.id,
        course_code=subject_os.code,
        course_name=subject_os.name,
        priority="medium",
        status="pending",
        progress=0.0,
        estimated_effort=2.5,
        completed_hours=0.0,
        deadline=now + timedelta(days=6),
        due_date=now + timedelta(days=6)
    )

    task_ml = Task(
        title="Machine Learning Paper Review - Attention Mechanisms in Transformers",
        description="Read 'Attention Is All You Need' and write a 2-page synthesis on self-attention matrix calculation.",
        subject_id=subject_ml.id,
        course_code=subject_ml.code,
        course_name=subject_ml.name,
        priority="medium",
        status="completed",
        progress=100.0,
        estimated_effort=2.0,
        completed_hours=2.0,
        deadline=now - timedelta(days=1),
        due_date=now - timedelta(days=1)
    )

    db.add_all([task_daa, task_dbms, task_os, task_ml])
    db.commit()

    db.refresh(task_daa)
    db.refresh(task_dbms)
    db.refresh(task_os)

    # 3. Create Calendar Events
    events = [
        CalendarEvent(
            title="DAA Lecture: Graph Algorithms",
            event_type="class",
            subject_id=subject_daa.id,
            course_code=subject_daa.code,
            start_time=now.replace(hour=9, minute=0, second=0),
            end_time=now.replace(hour=10, minute=30, second=0),
            location="Hall 102",
            status="completed"
        ),
        CalendarEvent(
            title="DBMS Lab Session",
            event_type="class",
            subject_id=subject_dbms.id,
            course_code=subject_dbms.code,
            start_time=now.replace(hour=11, minute=0, second=0),
            end_time=now.replace(hour=13, minute=0, second=0),
            location="CS Lab 3",
            status="completed"
        ),
        CalendarEvent(
            title="DAA Study Session - DP Practice",
            event_type="study_session",
            subject_id=subject_daa.id,
            course_code=subject_daa.code,
            start_time=tomorrow.replace(hour=14, minute=0, second=0),
            end_time=tomorrow.replace(hour=16, minute=0, second=0),
            location="Central Library 2nd Floor",
            status="scheduled",
            linked_task_id=task_daa.id
        ),
        CalendarEvent(
            title="DBMS Query Optimization Block",
            event_type="assignment_work",
            subject_id=subject_dbms.id,
            course_code=subject_dbms.code,
            start_time=tomorrow.replace(hour=17, minute=0, second=0),
            end_time=tomorrow.replace(hour=19, minute=0, second=0),
            location="Dorm Study Room",
            status="scheduled",
            linked_task_id=task_dbms.id
        ),
        CalendarEvent(
            title="DAA Assignment Finalizing Block",
            event_type="assignment_work",
            subject_id=subject_daa.id,
            course_code=subject_daa.code,
            start_time=this_friday.replace(hour=10, minute=0, second=0),
            end_time=this_friday.replace(hour=12, minute=0, second=0),
            location="Library Room A",
            status="scheduled",
            linked_task_id=task_daa.id
        )
    ]
    db.add_all(events)

    # 4. Create Dedicated Study Sessions
    sessions = [
        StudySession(
            title="DAA Dynamic Programming Intensive",
            subject_id=subject_daa.id,
            task_id=task_daa.id,
            start_time=tomorrow.replace(hour=14, minute=0, second=0),
            end_time=tomorrow.replace(hour=16, minute=0, second=0),
            duration_minutes=120,
            status="scheduled",
            notes="Focus on 0/1 Knapsack recurrence relations."
        ),
        StudySession(
            title="DBMS B+ Tree Index Implementation",
            subject_id=subject_dbms.id,
            task_id=task_dbms.id,
            start_time=tomorrow.replace(hour=17, minute=0, second=0),
            end_time=tomorrow.replace(hour=19, minute=0, second=0),
            duration_minutes=120,
            status="scheduled",
            notes="Benchmark node splitting overhead."
        ),
        StudySession(
            title="OS Process Scheduling Review",
            subject_id=subject_os.id,
            task_id=task_os.id,
            start_time=day_after.replace(hour=15, minute=0, second=0),
            end_time=day_after.replace(hour=17, minute=0, second=0),
            duration_minutes=120,
            status="scheduled",
            notes="Implement SRTF queue simulation logic."
        )
    ]
    db.add_all(sessions)

    # 5. Create Study Plans
    plans = [
        StudyPlan(
            subject=subject_daa.name,
            course_code=subject_daa.code,
            target_hours_per_week=subject_daa.target_hours_per_week,
            allocated_hours=5.0,
            completed_hours=2.5,
            priority_level="high",
            status="on_track"
        ),
        StudyPlan(
            subject=subject_dbms.name,
            course_code=subject_dbms.code,
            target_hours_per_week=subject_dbms.target_hours_per_week,
            allocated_hours=4.0,
            completed_hours=1.5,
            priority_level="high",
            status="on_track"
        ),
        StudyPlan(
            subject=subject_os.name,
            course_code=subject_os.code,
            target_hours_per_week=subject_os.target_hours_per_week,
            allocated_hours=2.5,
            completed_hours=1.0,
            priority_level="medium",
            status="on_track"
        ),
        StudyPlan(
            subject=subject_ml.name,
            course_code=subject_ml.code,
            target_hours_per_week=subject_ml.target_hours_per_week,
            allocated_hours=3.0,
            completed_hours=3.0,
            priority_level="medium",
            status="completed"
        )
    ]
    db.add_all(plans)

    # 6. Create Agent Activities
    run_1_id = f"run-{uuid.uuid4().hex[:8]}"
    activity_1 = AgentActivity(
        run_id=run_1_id,
        user_request="Add my DAA assignment due Friday. It will take 3 hours.",
        intent="create_assignment_and_schedule_blocks",
        plan_steps=[
            {"step": 1, "action": "Parsed intent: Create Task for CS301 DAA (Est: 3h, Due: Friday)"},
            {"step": 2, "action": "Searched subject registry for CS301 (Design & Analysis of Algorithms)"},
            {"step": 3, "action": "Created Task record with progress=0.0%"},
            {"step": 4, "action": "Scheduled 2 study sessions totaling 3.0 hours"}
        ],
        tools_used=["subject_registry", "task_creator", "calendar_scheduler"],
        execution_result="Created DAA Assignment due Friday. Scheduled 2 study sessions totaling 3.0 hours.",
        status="completed",
        duration_ms=840,
        created_at=now - timedelta(hours=3)
    )

    run_2_id = f"run-{uuid.uuid4().hex[:8]}"
    activity_2 = AgentActivity(
        run_id=run_2_id,
        user_request="I cannot finish my DBMS assignment today. Rearrange my schedule.",
        intent="rearrange_schedule_due_to_delay",
        plan_steps=[
            {"step": 1, "action": "Detect conflict: DBMS Assignment incomplete for today (Progress 33%)"},
            {"step": 2, "action": "Evaluate remaining effort (3.0 hours needed)"},
            {"step": 3, "action": "Formulate plan to shift DBMS block to tomorrow 5:00 PM"},
            {"step": 4, "action": "Request human approval for shifting study block"}
        ],
        tools_used=["conflict_detector", "replanner_engine", "approval_requester"],
        execution_result="Proposed rescheduling DBMS block from today to tomorrow 5:00 PM - 7:00 PM. Awaiting approval.",
        status="pending_approval",
        duration_ms=620,
        created_at=now - timedelta(minutes=45)
    )

    db.add_all([activity_1, activity_2])
    db.commit()
    db.refresh(activity_2)

    # 7. Create Agent Approvals
    approval_1 = AgentApproval(
        activity_id=activity_2.id,
        action_type="reallocate_study_blocks",
        title="Shift DBMS Study Block to Tomorrow 5:00 PM",
        description="The agent detected that DBMS Mini Project Phase 2 was delayed today. Reallocating 2 hours to tomorrow evening without violating DAA deadline.",
        impact_level="medium",
        payload={
            "task_id": task_dbms.id,
            "subject_id": subject_dbms.id,
            "original_slot": "Today 4:00 PM - 6:00 PM",
            "proposed_slot": "Tomorrow 5:00 PM - 7:00 PM",
            "reason": "Avoid overload & maintain high priority DAA allocation"
        },
        status="pending",
        created_at=now - timedelta(minutes=45)
    )

    db.add_all([approval_1])
    db.commit()
    print("Database successfully seeded with Subjects, Tasks, Calendar Events & Study Sessions!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
