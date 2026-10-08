import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Activity, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { PageId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onPageChange,
  pendingApprovalsCount 
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agent' as PageId, label: 'AI Agent Hub', icon: Bot, highlight: true },
    { id: 'tasks' as PageId, label: 'Assignments & Tasks', icon: CheckSquare },
    { id: 'calendar' as PageId, label: 'Schedule Calendar', icon: CalendarIcon },
    { id: 'study_plan' as PageId, label: 'Study & Workload Plan', icon: BookOpen },
    { id: 'agent_activity' as PageId, label: 'Agent Audit Trail', icon: Activity },
    { id: 'approvals' as PageId, label: 'Human Approvals', icon: ShieldAlert, badge: pendingApprovalsCount },
  ];

  return (
    <aside className="w-64 bg-[#090e1a]/90 backdrop-blur-xl border-r border-slate-800/80 h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-white bg-clip-text text-transparent">
              studyops
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Autonomous Operations
            </p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="px-3 py-4 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Academic Command Center
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40'
                  : item.highlight
                  ? 'text-cyan-300 hover:bg-slate-800/60 hover:text-cyan-200 border border-cyan-500/20 bg-cyan-950/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-emerald-400' : item.highlight ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  {item.badge}
                </span>
              )}

              {item.highlight && item.badge === undefined && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="glass-panel p-3 rounded-xl flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              AI
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090e1a]"></span>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-slate-200 truncate">Autonomous Engine</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Ready & Active
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
