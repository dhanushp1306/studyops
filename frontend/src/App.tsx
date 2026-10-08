import React, { useState, useEffect } from 'react';
import { PageId, Subject, Task, CalendarEvent, StudySession, StudyPlan, AgentActivity, AgentApproval, DashboardStats } from './types';
import { studyopsApi } from './api/client';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CreateTaskModal } from './components/CreateTaskModal';

import { Dashboard } from './pages/Dashboard';
import { AgentPage } from './pages/AgentPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { ApprovalsPage } from './pages/ApprovalsPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Application Data States
  const [stats, setStats] = useState<DashboardStats>({
    total_tasks: 0,
    pending_tasks: 0,
    high_priority_tasks: 0,
    completed_tasks: 0,
    upcoming_events_today: 0,
    weekly_planned_hours: 0,
    weekly_completed_hours: 0,
    pending_approvals_count: 0
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [approvals, setApprovals] = useState<AgentApproval[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [
        statsRes, 
        subjectsRes,
        tasksRes, 
        eventsRes, 
        sessionsRes,
        plansRes, 
        activitiesRes, 
        approvalsRes
      ] = await Promise.all([
        studyopsApi.getDashboardStats(),
        studyopsApi.getSubjects(),
        studyopsApi.getTasks(),
        studyopsApi.getCalendarEvents(),
        studyopsApi.getStudySessions(),
        studyopsApi.getStudyPlans(),
        studyopsApi.getAgentActivities(),
        studyopsApi.getApprovals()
      ]);

      setStats(statsRes);
      setSubjects(subjectsRes);
      setTasks(tasksRes);
      setEvents(eventsRes);
      setStudySessions(sessionsRes);
      setStudyPlans(plansRes);
      setActivities(activitiesRes);
      setApprovals(approvalsRes);
    } catch (err: any) {
      console.error("Error fetching data from studyops backend:", err);
      setApiError(err?.message || "Failed to sync data with backend server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSelectPromptFromDashboard = (prompt: string) => {
    setSelectedPrompt(prompt);
    setCurrentPage('agent');
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onRefreshData={fetchAllData}
          isLoading={isLoading}
        />

        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              tasks={tasks}
              events={events}
              approvals={approvals}
              onPageChange={setCurrentPage}
              onSelectPrompt={handleSelectPromptFromDashboard}
            />
          )}

          {currentPage === 'agent' && (
            <AgentPage
              initialPrompt={selectedPrompt}
              activities={activities}
              onRefresh={fetchAllData}
              onPageChange={setCurrentPage}
            />
          )}

          {currentPage === 'tasks' && (
            <TasksPage
              tasks={tasks}
              subjects={subjects}
              isLoading={isLoading}
              error={apiError}
              onRefresh={fetchAllData}
              onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
            />
          )}

          {currentPage === 'calendar' && (
            <CalendarPage
              events={events}
              studySessions={studySessions}
              subjects={subjects}
              tasks={tasks}
              isLoading={isLoading}
              error={apiError}
              onRefresh={fetchAllData}
            />
          )}

          {currentPage === 'study_plan' && (
            <StudyPlanPage
              plans={studyPlans}
            />
          )}

          {currentPage === 'agent_activity' && (
            <AgentActivityPage
              activities={activities}
            />
          )}

          {currentPage === 'approvals' && (
            <ApprovalsPage
              approvals={approvals}
              onRefresh={fetchAllData}
            />
          )}
        </main>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        subjects={subjects}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={fetchAllData}
      />
    </div>
  );
};

export default App;
