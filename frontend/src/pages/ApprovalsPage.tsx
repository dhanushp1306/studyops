import React from 'react';
import { ShieldAlert, Check, X, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { AgentApproval } from '../types';
import { studyopsApi } from '../api/client';

interface ApprovalsPageProps {
  approvals: AgentApproval[];
  onRefresh: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ approvals, onRefresh }) => {
  const handleApprove = async (approvalId: number) => {
    try {
      await studyopsApi.approveAction(approvalId);
      onRefresh();
    } catch (e) {
      console.error("Failed to approve action", e);
    }
  };

  const handleReject = async (approvalId: number) => {
    try {
      await studyopsApi.rejectAction(approvalId);
      onRefresh();
    } catch (e) {
      console.error("Failed to reject action", e);
    }
  };

  const pendingList = approvals.filter(a => a.status === 'pending');
  const historyList = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-xl text-slate-100">Human Approval Queue</h3>
          <p className="text-xs text-slate-400">Review and authorize high-impact autonomous schedule shifts & deadline modifications</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-4">
        <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
          <span>Pending Approvals ({pendingList.length})</span>
        </h4>

        {pendingList.length === 0 ? (
          <div className="glass-panel p-8 text-center space-y-2 rounded-2xl">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-slate-300 font-semibold text-sm">No Pending Approvals</div>
            <p className="text-xs text-slate-500">The agent is operating smoothly without unresolved conflicts.</p>
          </div>
        ) : (
          pendingList.map((appr) => (
            <div key={appr.id} className="glass-panel p-6 rounded-2xl border-rose-500/30 bg-rose-950/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase">
                    {appr.action_type.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300">
                    {appr.impact_level} impact
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Requested: {new Date(appr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-100">{appr.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{appr.description}</p>
              </div>

              {/* Payload Breakdown */}
              {appr.payload && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-400 uppercase text-[10px]">Action Impact Details:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono">
                    {Object.entries(appr.payload).map(([k, v]) => (
                      <div key={k} className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-slate-500">{k}: </span>
                        <span className="text-cyan-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  onClick={() => handleReject(appr.id)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Reject Action</span>
                </button>

                <button
                  onClick={() => handleApprove(appr.id)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Execute</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History */}
      {historyList.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h4 className="font-heading font-bold text-base text-slate-400">Approval History</h4>
          <div className="space-y-3">
            {historyList.map((appr) => (
              <div key={appr.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{appr.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{appr.description}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  appr.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {appr.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
