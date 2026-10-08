import axios from 'axios';
import { Subject, Task, CalendarEvent, StudySession, StudyPlan, AgentActivity, AgentApproval, DashboardStats } from '../types';

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
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  // Subjects API
  getSubjects: async (): Promise<Subject[]> => {
    const res = await api.get('/subjects');
    return res.data;
  },

  createSubject: async (subject: Partial<Subject>): Promise<Subject> => {
    const res = await api.post('/subjects', subject);
    return res.data;
  },

  updateSubject: async (id: number, updates: Partial<Subject>): Promise<Subject> => {
    const res = await api.put(`/subjects/${id}`, updates);
    return res.data;
  },

  deleteSubject: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },

  // Tasks API
  getTasks: async (status?: string, subject_id?: number, course_code?: string): Promise<Task[]> => {
    const res = await api.get('/tasks', { params: { status, subject_id, course_code } });
    return res.data;
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

  // Calendar Events API
  getCalendarEvents: async (start?: string, end?: string): Promise<CalendarEvent[]> => {
    const res = await api.get('/calendar/events', { params: { start, end } });
    return res.data;
  },

  createCalendarEvent: async (event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const res = await api.post('/calendar/events', event);
    return res.data;
  },

  updateCalendarEvent: async (id: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const res = await api.put(`/calendar/events/${id}`, updates);
    return res.data;
  },

  deleteCalendarEvent: async (id: number): Promise<void> => {
    await api.delete(`/calendar/events/${id}`);
  },

  // Study Sessions API
  getStudySessions: async (subject_id?: number, status?: string): Promise<StudySession[]> => {
    const res = await api.get('/study-sessions', { params: { subject_id, status } });
    return res.data;
  },

  createStudySession: async (session: Partial<StudySession>): Promise<StudySession> => {
    const res = await api.post('/study-sessions', session);
    return res.data;
  },

  updateStudySession: async (id: number, updates: Partial<StudySession>): Promise<StudySession> => {
    const res = await api.put(`/study-sessions/${id}`, updates);
    return res.data;
  },

  deleteStudySession: async (id: number): Promise<void> => {
    await api.delete(`/study-sessions/${id}`);
  },

  // Study Plans API
  getStudyPlans: async (): Promise<StudyPlan[]> => {
    const res = await api.get('/study-plans');
    return res.data;
  },

  // Agent Activity API
  getAgentActivities: async (): Promise<AgentActivity[]> => {
    const res = await api.get('/agent/activity');
    return res.data;
  },

  // Agent Approvals API
  getApprovals: async (status?: string): Promise<AgentApproval[]> => {
    const res = await api.get('/agent/approvals', { params: { status } });
    return res.data;
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
