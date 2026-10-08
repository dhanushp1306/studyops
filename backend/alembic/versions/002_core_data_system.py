"""Add subjects and study sessions tables

Revision ID: 002_core_data_system
Revises: 001_initial_schema
Create Date: 2026-10-08 23:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_core_data_system'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Subjects table
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=30), nullable=True),
        sa.Column('target_hours_per_week', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subjects_code'), 'subjects', ['code'], unique=True)
    op.create_index(op.f('ix_subjects_id'), 'subjects', ['id'], unique=False)

    # 2. Add columns to tasks
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('subject_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('progress', sa.Float(), nullable=True, server_default='0.0'))
        batch_op.add_column(sa.Column('estimated_effort', sa.Float(), nullable=True, server_default='2.0'))
        batch_op.add_column(sa.Column('deadline', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_tasks_subject_id'), ['subject_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_tasks_deadline'), ['deadline'], unique=False)
        batch_op.create_foreign_key('fk_tasks_subject_id', 'subjects', ['subject_id'], ['id'], ondelete='SET NULL')

    # 3. Add columns to calendar_events
    with op.batch_alter_table('calendar_events') as batch_op:
        batch_op.add_column(sa.Column('subject_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_calendar_events_subject_id', 'subjects', ['subject_id'], ['id'], ondelete='SET NULL')

    # 4. Study Sessions table
    op.create_table(
        'study_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_sessions_id'), 'study_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_study_sessions_subject_id'), 'study_sessions', ['subject_id'], unique=False)
    op.create_index(op.f('ix_study_sessions_task_id'), 'study_sessions', ['task_id'], unique=False)
    op.create_index(op.f('ix_study_sessions_start_time'), 'study_sessions', ['start_time'], unique=False)

def downgrade() -> None:
    op.drop_table('study_sessions')
    with op.batch_alter_table('calendar_events') as batch_op:
        batch_op.drop_constraint('fk_calendar_events_subject_id', type_='foreignkey')
        batch_op.drop_column('subject_id')
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_constraint('fk_tasks_subject_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_tasks_deadline'))
        batch_op.drop_index(batch_op.f('ix_tasks_subject_id'))
        batch_op.drop_column('deadline')
        batch_op.drop_column('estimated_effort')
        batch_op.drop_column('progress')
        batch_op.drop_column('subject_id')
    op.drop_table('subjects')
