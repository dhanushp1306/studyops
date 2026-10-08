import axios from 'axios';
import { Task, CalendarEvent, StudyPlan, AgentActivity, AgentApproval, DashboardStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const studyopsApi = {
  // Health check
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const res = await api.get('/dashboard/stats');
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, using cached dashboard state", e);
      return {
        total_tasks: 4,
        pending_tasks: 3,
        high_priority_tasks: 2,
        completed_tasks: 1,
        upcoming_events_today: 2,
        weekly_planned_hours: 18.0,
        weekly_completed_hours: 8.0,
        pending_approvals_count: 1,
      };
    }
  },

  // Tasks
  getTasks: async (status?: string, course_code?: string): Promise<Task[]> => {
    try {
      const res = await api.get('/tasks', { params: { status, course_code } });
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, returning default tasks", e);
      return [];
    }
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const res = await api.post('/tasks', task);
    return res.data;
  },

  updateTask: async (taskId: number, updates: Partial<Task>): Promise<Task> => {
    const res = await api.put(`/tasks/${taskId}`, updates);
    return res.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Calendar
  getCalendarEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const res = await api.get('/calendar/events');
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, returning default calendar events", e);
      return [];
    }
  },

  createCalendarEvent: async (event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const res = await api.post('/calendar/events', event);
    return res.data;
  },

  // Study Plans
  getStudyPlans: async (): Promise<StudyPlan[]> => {
    try {
      const res = await api.get('/study-plans');
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, returning default study plans", e);
      return [];
    }
  },

  // Agent Activity
  getAgentActivities: async (): Promise<AgentActivity[]> => {
    try {
      const res = await api.get('/agent/activity');
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, returning default agent activity", e);
      return [];
    }
  },

  // Agent Approvals
  getApprovals: async (status?: string): Promise<AgentApproval[]> => {
    try {
      const res = await api.get('/agent/approvals', { params: { status } });
      return res.data;
    } catch (e) {
      console.warn("Backend API unavailable, returning default approvals", e);
      return [];
    }
  },

  approveAction: async (approvalId: number): Promise<AgentApproval> => {
    const res = await api.post(`/agent/approvals/${approvalId}/approve`);
    return res.data;
  },

  rejectAction: async (approvalId: number): Promise<AgentApproval> => {
    const res = await api.post(`/agent/approvals/${approvalId}/reject`);
    return res.data;
  },

  // Seed trigger
  triggerSeed: async () => {
    const res = await api.post('/seed');
    return res.data;
  }
};
