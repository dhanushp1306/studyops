import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowRight, 
  ShieldAlert,
  RotateCcw,
  Zap,
  Layers,
  AlertCircle
} from 'lucide-react';
import { AgentActivity, PageId } from '../types';
import { studyopsApi } from '../api/client';

interface AgentPageProps {
  initialPrompt?: string;
  activities: AgentActivity[];
  onRefresh: () => void;
  onPageChange: (page: PageId) => void;
}

export const AgentPage: React.FC<AgentPageProps> = ({
  initialPrompt = '',
  activities,
  onRefresh,
  onPageChange
}) => {
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactive' | 'pipeline'>('interactive');
  const [observableActions, setObservableActions] = useState<string[]>([]);
  const [currentRunResult, setCurrentRunResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const promptShortcuts = [
    "Add my DAA assignment due Friday. It will take 3 hours.",
    "Find me two hours tomorrow to work on DAA.",
    "Organize my week around my deadlines.",
    "I cannot finish my DBMS assignment today. Rearrange my schedule.",
    "What should I work on right now?"
  ];

  const handleExecutePrompt = async (textToRun: string) => {
    if (!textToRun.trim()) return;
    setPromptInput(textToRun);
    setIsExecuting(true);
    setErrorMsg(null);
    setObservableActions(["Understanding your request intent..."]);
    setCurrentRunResult(null);

    try {
      // Stream simulated initial observable steps while calling real backend endpoint
      setTimeout(() => {
        setObservableActions(prev => [...prev, "Checking your calendar and task deadlines..."]);
      }, 300);

      const response = await studyopsApi.runAgent(textToRun);

      if (response.observable_actions && response.observable_actions.length > 0) {
        setObservableActions(response.observable_actions);
      } else {
        setObservableActions(["Completed agent execution pipeline."]);
      }

      setCurrentRunResult(response);
      onRefresh();
    } catch (err: any) {
      console.error("Agent execution failed:", err);
      setErrorMsg(err?.response?.data?.detail || err?.message || "Failed to execute agent request");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
              Autonomous Agent Command Center
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural language prompt parsing, dynamic tool selection, execution loops & conflict resolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'interactive' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Agent Command Mode
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pipeline' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Workflow Pipeline Visualizer
          </button>
        </div>
      </div>

      {/* Main Command Section */}
      {activeTab === 'interactive' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input Box & Shortcuts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Command Input Box */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 relative overflow-hidden">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Enter Agent Instruction</span>
              </label>

              <div className="relative">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Add my DAA assignment due Friday. It will take 3 hours."
                  rows={3}
                  className="w-full glass-input p-4 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 resize-none font-sans"
                />
                <button
                  onClick={() => handleExecutePrompt(promptInput)}
                  disabled={isExecuting || !promptInput.trim()}
                  className="absolute right-3 bottom-3 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Agent</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset Example Prompts */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Click Quick Command Shortcut:
                </div>
                <div className="flex flex-wrap gap-2">
                  {promptShortcuts.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExecutePrompt(chip)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-medium transition-all text-left"
                    >
                      "{chip}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message if Any */}
            {errorMsg && (
              <div className="glass-panel p-4 rounded-2xl border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Observable Actions & Execution Results */}
            {(isExecuting || currentRunResult) && (
              <div className="glass-panel p-6 rounded-2xl space-y-5 animate-fade-in border-emerald-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Observable Agent Actions</span>
                  </h4>
                  {isExecuting ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium animate-pulse">
                      Running Pipeline...
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">
                      Duration: {currentRunResult?.duration_ms}ms
                    </span>
                  )}
                </div>

                {/* Concise Observable Actions List */}
                <div className="space-y-2">
                  {observableActions.map((action, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center gap-2.5 font-sans">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-ping"></div>
                      <span>"{action}"</span>
                    </div>
                  ))}
                </div>

                {/* Final Result Card */}
                {currentRunResult && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-400 font-mono uppercase">
                        Intent: {currentRunResult.intent}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        currentRunResult.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        currentRunResult.status === 'pending_approval' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {currentRunResult.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-slate-100 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      {currentRunResult.final_response}
                    </div>

                    {/* Executed Tools */}
                    {currentRunResult.tools_used && currentRunResult.tools_used.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Tools Executed:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentRunResult.tools_used.map((t: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Approval Alert */}
                    {currentRunResult.status === 'pending_approval' && (
                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3">
                        <div className="text-xs text-rose-300 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>Action requires human approval before calendar mutation.</span>
                        </div>
                        <button
                          onClick={() => onPageChange('approvals')}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-rose-950/40"
                        >
                          <span>Review Approval</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Recent Activities */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Recent Agent Runs</span>
              </h4>

              <div className="space-y-3">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cyan-400 font-bold">{act.intent}</span>
                      <span className="text-slate-500">{act.duration_ms}ms</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">"{act.user_request}"</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{act.execution_result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Workflow Visualizer Tab */
        <div className="glass-panel p-8 rounded-2xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="font-heading font-extrabold text-2xl text-slate-100">
              Agent Orchestrator Architecture
            </h3>
            <p className="text-xs text-slate-400">
              End-to-end flow: Natural Language parsing → Tool Selection → Execution → Conflict Evaluation & Human Approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Intent Engine', icon: Sparkles, color: 'text-emerald-400', desc: 'Parses course codes, deadlines, estimated effort' },
              { step: '02', title: 'Planner', icon: Layers, color: 'text-cyan-400', desc: 'Calculates free slots & balances workload' },
              { step: '03', title: 'Tool Registry', icon: Wrench, color: 'text-indigo-400', desc: 'Executes Task DB & Calendar APIs' },
              { step: '04', title: 'Re-Planner', icon: RotateCcw, color: 'text-amber-400', desc: 'Detects conflicts & reschedules' },
              { step: '05', title: 'Human Approval', icon: ShieldAlert, color: 'text-rose-400', desc: 'Enforces student approval on shifts' },
            ].map((node) => {
              const IconComponent = node.icon;
              return (
                <div key={node.step} className="glass-panel p-5 rounded-xl border-slate-800 flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-xl bg-slate-900 border border-slate-700 ${node.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">STAGE {node.step}</span>
                  <div className="text-sm font-bold text-slate-100">{node.title}</div>
                  <p className="text-[11px] text-slate-400">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
