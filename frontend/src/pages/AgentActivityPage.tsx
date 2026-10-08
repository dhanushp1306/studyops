import React from 'react';
import { Activity, Clock, Wrench, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { AgentActivity } from '../types';

interface AgentActivityPageProps {
  activities: AgentActivity[];
}

export const AgentActivityPage: React.FC<AgentActivityPageProps> = ({ activities }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-xl text-slate-100">Agent Audit Trail & Activity Logs</h3>
          <p className="text-xs text-slate-400">Historical trace of autonomous decisions, tool execution runs & performance metrics</p>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="space-y-4">
        {activities.map((act) => {
          const createdAt = new Date(act.created_at).toLocaleString();

          return (
            <div key={act.id} className="glass-panel p-6 rounded-2xl space-y-4 border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-mono text-xs font-semibold">
                    {act.run_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    act.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                    act.status === 'pending_approval' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {act.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {act.duration_ms}ms
                  </span>
                  <span>{createdAt}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Request</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">"{act.user_request}"</div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl space-y-2 border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 font-mono uppercase">
                  Intent Recognized: {act.intent}
                </div>
                <div className="text-xs text-slate-300 font-sans">{act.execution_result}</div>
              </div>

              {/* Observable Event Steps Timeline */}
              {act.plan_steps && act.plan_steps.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Observable Execution Timeline:</div>
                  <div className="space-y-2">
                    {act.plan_steps.map((s, idx) => {
                      const evtType = s.event_type || "action_completed";
                      const isWarning = evtType === "conflict_detected" || evtType === "approval_requested";
                      
                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isWarning ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/60 border-slate-800'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 border border-slate-700">
                              {s.step || idx + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              evtType === 'conflict_detected' ? 'bg-amber-500/20 text-amber-300' :
                              evtType === 'approval_requested' ? 'bg-rose-500/20 text-rose-300' :
                              evtType === 'tool_selected' || evtType === 'tool_executed' ? 'bg-cyan-500/20 text-cyan-300' :
                              'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {evtType.replace('_', ' ')}
                            </span>
                            <span className="text-slate-200 font-medium">{s.action}</span>
                          </div>

                          {s.tool && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700 self-start sm:self-auto">
                              {s.tool}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tools list */}
              {act.tools_used && act.tools_used.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase">Tools Called:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {act.tools_used.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
