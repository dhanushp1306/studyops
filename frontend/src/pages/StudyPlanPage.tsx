import React from 'react';
import { BookOpen, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react';
import { StudyPlan } from '../types';

interface StudyPlanPageProps {
  plans: StudyPlan[];
}

export const StudyPlanPage: React.FC<StudyPlanPageProps> = ({ plans }) => {
  const totalTarget = plans.reduce((acc, p) => acc + p.target_hours_per_week, 0);
  const totalCompleted = plans.reduce((acc, p) => acc + p.completed_hours, 0);
  const totalAllocated = plans.reduce((acc, p) => acc + p.allocated_hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100">Study Plan & Workload Optimization</h3>
            <p className="text-xs text-slate-400">Target study distribution across CS courses & subject load balance</p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-400 uppercase">Weekly Target Study Hours</div>
          <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">{totalTarget}h</div>
          <div className="text-xs text-emerald-400 mt-1">Target workload across all subjects</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hours Scheduled in Calendar</div>
          <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">{totalAllocated}h</div>
          <div className="text-xs text-cyan-400 mt-1">Auto-assigned study slots</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hours Completed This Week</div>
          <div className="text-3xl font-heading font-extrabold text-slate-100 mt-1">{totalCompleted}h</div>
          <div className="text-xs text-indigo-400 mt-1">Logged study progress</div>
        </div>
      </div>

      {/* Subject Workload Cards */}
      <div className="space-y-4">
        <h4 className="font-heading font-bold text-base text-slate-100">Subject Load Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan) => {
            const progressPercent = Math.min(100, Math.round((plan.completed_hours / (plan.target_hours_per_week || 1)) * 100));

            return (
              <div key={plan.id} className="glass-panel p-5 rounded-2xl space-y-4 border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {plan.course_code}
                    </span>
                    <h5 className="font-bold text-base text-slate-100 mt-1">{plan.subject}</h5>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                    plan.priority_level === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {plan.priority_level} priority
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>{plan.completed_hours}h completed</span>
                    <span>Target: {plan.target_hours_per_week}h/week</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
