import React, { useState } from 'react';
import { RefreshCw, Bell, Search, CheckCircle2, Sparkles } from 'lucide-react';
import { PageId } from '../types';

interface NavbarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onPageChange,
  onRefreshData,
  isLoading
}) => {
  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard': return { title: 'Academic Operations Dashboard', subtitle: 'Overview of workload, deadlines, and autonomous agent actions' };
      case 'agent': return { title: 'Autonomous AI Agent Hub', subtitle: 'Natural language intent processing, execution pipeline & tools' };
      case 'tasks': return { title: 'Assignments & Deadlines', subtitle: 'Manage CS course deliverables, effort estimates & priority queues' };
      case 'calendar': return { title: 'Schedule Calendar & Study Blocks', subtitle: 'Interactive weekly timetable with auto-scheduled study sessions' };
      case 'study_plan': return { title: 'Study Plan & Workload Optimization', subtitle: 'Target vs. actual study metrics and subject balance analytics' };
      case 'agent_activity': return { title: 'Agent Activity & Audit Trail', subtitle: 'Execution traces, intent breakdown, tool logs, and execution duration' };
      case 'approvals': return { title: 'Human Approval Queue', subtitle: 'Review and approve high-impact autonomous schedule modifications' };
    }
  };

  const { title, subtitle } = getPageTitle(currentPage);

  return (
    <header className="h-20 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
      <div>
        <h2 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Launch Agent Button */}
        {currentPage !== 'agent' && (
          <button
            onClick={() => onPageChange('agent')}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Launch Agent</span>
          </button>
        )}

        {/* Data Refresh Button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Refresh Backend Data"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* User Status Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
            CS
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-200">CS Student</div>
            <div className="text-[10px] text-slate-400">Term 6 • AI Track</div>
          </div>
        </div>
      </div>
    </header>
  );
};
