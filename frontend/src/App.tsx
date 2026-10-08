import React, { useState, useEffect } from 'react';
import { PageId, Task, CalendarEvent, StudyPlan, AgentActivity, AgentApproval, DashboardStats } from './types';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [approvals, setApprovals] = useState<AgentApproval[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, tasksRes, eventsRes, plansRes, activitiesRes, approvalsRes] = await Promise.all([
        studyopsApi.getDashboardStats(),
        studyopsApi.getTasks(),
        studyopsApi.getCalendarEvents(),
        studyopsApi.getStudyPlans(),
        studyopsApi.getAgentActivities(),
        studyopsApi.getApprovals()
      ]);

      setStats(statsRes);
      setTasks(tasksRes);
      setEvents(eventsRes);
      setStudyPlans(plansRes);
      setActivities(activitiesRes);
      setApprovals(approvalsRes);
    } catch (err) {
      console.error("Error fetching data from studyops backend:", err);
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
              onRefresh={fetchAllData}
              onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
            />
          )}

          {currentPage === 'calendar' && (
            <CalendarPage
              events={events}
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
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={fetchAllData}
      />
    </div>
  );
};

export default App;
