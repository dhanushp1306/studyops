"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-08 23:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tasks
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('course_code', sa.String(length=50), nullable=False),
        sa.Column('course_name', sa.String(length=255), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('estimated_hours', sa.Float(), nullable=True),
        sa.Column('completed_hours', sa.Float(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_course_code'), 'tasks', ['course_code'], unique=False)
    op.create_index(op.f('ix_tasks_due_date'), 'tasks', ['due_date'], unique=False)

    # Calendar Events
    op.create_table(
        'calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=True),
        sa.Column('course_code', sa.String(length=50), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('linked_task_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['linked_task_id'], ['tasks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_calendar_events_id'), 'calendar_events', ['id'], unique=False)
    op.create_index(op.f('ix_calendar_events_start_time'), 'calendar_events', ['start_time'], unique=False)

    # Study Plans
    op.create_table(
        'study_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=False),
        sa.Column('course_code', sa.String(length=50), nullable=False),
        sa.Column('target_hours_per_week', sa.Float(), nullable=True),
        sa.Column('allocated_hours', sa.Float(), nullable=True),
        sa.Column('completed_hours', sa.Float(), nullable=True),
        sa.Column('priority_level', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_plans_id'), 'study_plans', ['id'], unique=False)

    # Agent Activities
    op.create_table(
        'agent_activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.String(length=100), nullable=False),
        sa.Column('user_request', sa.Text(), nullable=False),
        sa.Column('intent', sa.String(length=100), nullable=False),
        sa.Column('plan_steps', sa.JSON(), nullable=True),
        sa.Column('tools_used', sa.JSON(), nullable=True),
        sa.Column('execution_result', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agent_activities_id'), 'agent_activities', ['id'], unique=False)
    op.create_index(op.f('ix_agent_activities_run_id'), 'agent_activities', ['run_id'], unique=True)

    # Agent Approvals
    op.create_table(
        'agent_approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=True),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('impact_level', sa.String(length=20), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['agent_activities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agent_approvals_id'), 'agent_approvals', ['id'], unique=False)

def downgrade() -> None:
    op.drop_table('agent_approvals')
    op.drop_table('agent_activities')
    op.drop_table('study_plans')
    op.drop_table('calendar_events')
    op.drop_table('tasks')
