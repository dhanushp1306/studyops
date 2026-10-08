import React from 'react';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { Task, CalendarEvent, DashboardStats, PageId, AgentApproval } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  tasks: Task[];
  events: CalendarEvent[];
  approvals: AgentApproval[];
  onPageChange: (page: PageId) => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  tasks,
  events,
  approvals,
  onPageChange,
  onSelectPrompt
}) => {
  const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 4);
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  const examplePrompts = [
    "Add my DAA assignment due Friday. It will take 3 hours.",
    "Find me two hours tomorrow to work on DAA.",
    "Organize my week around my deadlines.",
    "I cannot finish my DBMS assignment today. Rearrange my schedule.",
    "What should I work on right now?"
  ];

  const handlePromptClick = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
    onPageChange('agent');
  };

  return (
    <div className="space-y-6">
      {/* Pending Approval Alert Banner */}
      {pendingApprovals.length > 0 && (
        <div className="glass-panel border-rose-500/30 bg-rose-950/20 p-4 rounded-2xl flex items-center justify-between animate-fade-in shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-rose-200">
                {pendingApprovals.length} Agent Action{pendingApprovals.length > 1 ? 's' : ''} Awaiting Approval
              </div>
              <div className="text-xs text-rose-300/80">
                {pendingApprovals[0].title}
              </div>
            </div>
          </div>
          <button
            onClick={() => onPageChange('approvals')}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-md shadow-rose-900/40 flex items-center gap-2"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Widget: What Should I Do Now? */}
      <div className="glass-panel p-6 rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-cyan-950/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Standout Feature
              </span>
              <h3 className="font-heading font-extrabold text-xl text-slate-100">What Should I Do Now?</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Dynamic multi-variable analysis of deadlines, remaining effort, priority scores & calendar gaps
            </p>
          </div>
        </div>

        <button
          onClick={() => handlePromptClick("What should I do now?")}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Get Recommended Action</span>
        </button>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</div>
            <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">
              {stats.pending_tasks}
            </div>
            <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>{stats.high_priority_tasks} High Priority</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-cyan-500">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Events Today</div>
            <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">
              {stats.upcoming_events_today}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 font-medium">
              Classes & Study Sessions
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Progress</div>
            <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">
              {stats.weekly_completed_hours}h <span className="text-sm text-slate-400 font-normal">/ {stats.weekly_planned_hours}h</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">
              {Math.round((stats.weekly_completed_hours / (stats.weekly_planned_hours || 1)) * 100)}% Study Target Completed
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approval Queue</div>
            <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">
              {stats.pending_approvals_count}
            </div>
            <div className="text-[11px] text-indigo-400 mt-1 font-medium">
              Action Permissions Needed
            </div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Agent Quick Assistant & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Agent Execution Prompts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-100">Quick Agent Commands</h3>
                  <p className="text-xs text-slate-400">Launch autonomous academic workflows instantly</p>
                </div>
              </div>
              <button
                onClick={() => onPageChange('agent')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <span>Agent Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-slate-200 text-xs font-medium flex items-center justify-between group transition-all"
                >
                  <span className="group-hover:text-emerald-300 transition-colors">"{prompt}"</span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Execute</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Assignments List */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <span>Upcoming CS Assignments</span>
              </h3>
              <button
                onClick={() => onPageChange('tasks')}
                className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingTasks.map((task) => {
                const dueDate = new Date(task.due_date);
                const formattedDate = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                return (
                  <div key={task.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between gap-4 hover:border-slate-600 transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        task.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {task.course_code}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{task.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.estimated_hours}h effort</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Due {formattedDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Timeline Schedule */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                <span>Today's Schedule</span>
              </h3>
              <button
                onClick={() => onPageChange('calendar')}
                className="text-xs text-slate-400 hover:text-cyan-400 font-semibold transition-colors"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {events.slice(0, 5).map((evt) => {
                const startTime = new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(evt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={evt.id} className="relative pl-7 flex items-start justify-between group">
                    <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-[#090e1a] bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {evt.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{startTime} - {endTime}</span>
                        {evt.location && <span className="text-slate-500">• {evt.location}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      evt.event_type === 'class' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {evt.event_type.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Agent Banner */}
          <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">Studyops Agent Ready</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous agent monitors assignments, calendar events, and study goals 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
