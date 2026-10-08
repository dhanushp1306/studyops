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
  Play,
  RotateCcw,
  Zap,
  Layers,
  ChevronRight
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
  
  // Active execution state simulation for UI demonstration
  const [currentPipelineStep, setCurrentPipelineStep] = useState<number | null>(null);
  const [simulatedRun, setSimulatedRun] = useState<AgentActivity | null>(null);

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
    setSimulatedRun(null);

    // Simulate multi-step autonomous agent execution visualizer
    // Step 1: Intent Recognition
    setCurrentPipelineStep(1);
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Plan Creation
    setCurrentPipelineStep(2);
    await new Promise(r => setTimeout(r, 700));

    // Step 3: Tool Selection & Execution
    setCurrentPipelineStep(3);
    await new Promise(r => setTimeout(r, 800));

    // Step 4: Final Action / Re-plan / Approval check
    setCurrentPipelineStep(4);
    await new Promise(r => setTimeout(r, 500));

    // Build execution result mock based on prompt
    const isRearrangePrompt = textToRun.toLowerCase().includes('rearrange') || textToRun.toLowerCase().includes('cannot finish');
    const newRun: AgentActivity = {
      id: Date.now(),
      run_id: `run-${Math.random().toString(36).substring(2, 9)}`,
      user_request: textToRun,
      intent: isRearrangePrompt ? "rearrange_schedule_due_to_delay" : "academic_operations_scheduling",
      plan_steps: [
        { step: 1, action: `Analyzed intent from request: "${textToRun}"` },
        { step: 2, action: "Evaluated current assignments, calendar slots, and priority weights" },
        { step: 3, action: "Executed database & scheduler tools to apply changes" },
        { step: 4, action: isRearrangePrompt ? "Formulated approval request for calendar shift" : "Successfully updated calendar & task records" }
      ],
      tools_used: ["task_manager", "calendar_slot_finder", "workload_optimizer"],
      execution_result: isRearrangePrompt 
        ? "Created pending approval to shift study session to tomorrow 5:00 PM without deadline breach."
        : "Successfully processed request. Updated task records and allocated optimal study blocks.",
      status: isRearrangePrompt ? "pending_approval" : "completed",
      duration_ms: 1240,
      created_at: new Date().toISOString()
    };

    setSimulatedRun(newRun);
    setIsExecuting(false);
    setCurrentPipelineStep(null);
    onRefresh();
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
              Input natural language requests. The agent analyzes intent, builds execution plans, selects tools, and executes actions.
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

      {/* Main Interactive Command Section */}
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
                      <span>Executing Plan...</span>
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

            {/* Execution Visualizer / Results Card */}
            {(isExecuting || simulatedRun || activities.length > 0) && (
              <div className="glass-panel p-6 rounded-2xl space-y-5 animate-fade-in border-emerald-500/20">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Live Agent Execution Progress</span>
                  </h4>
                  {isExecuting && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium animate-pulse">
                      Running Pipeline...
                    </span>
                  )}
                </div>

                {/* Pipeline Step Progress Bar */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { step: 1, title: 'Intent' },
                    { step: 2, title: 'Plan' },
                    { step: 3, title: 'Tools' },
                    { step: 4, title: 'Execute' }
                  ].map((s) => {
                    const isDone = simulatedRun || (currentPipelineStep && currentPipelineStep > s.step);
                    const isCurrent = currentPipelineStep === s.step;

                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : isCurrent
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold">STEP 0{s.step}</div>
                        <div className="text-xs font-semibold mt-0.5">{s.title}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Run Details */}
                {simulatedRun && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-emerald-400 uppercase font-mono">
                          Intent Identified: {simulatedRun.intent}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Duration: {simulatedRun.duration_ms}ms
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 font-sans">
                        <span className="font-semibold text-emerald-400">Result: </span>
                        {simulatedRun.execution_result}
                      </div>

                      {/* Generated Sub-Steps */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase">Execution Steps:</div>
                        {simulatedRun.plan_steps?.map((stepItem, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{stepItem.action}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tool Calls Executed */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Tools Invoked:</span>
                        <div className="flex items-center gap-1.5">
                          {simulatedRun.tools_used?.map((tool, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono text-[10px]">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* If pending approval trigger */}
                      {simulatedRun.status === 'pending_approval' && (
                        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 flex items-center justify-between">
                          <div className="text-xs text-rose-300 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>Requires Human Approval before final calendar mutation</span>
                          </div>
                          <button
                            onClick={() => onPageChange('approvals')}
                            className="px-3 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all"
                          >
                            Go to Approvals
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Agent Workflow Explanation */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Autonomous Agent Cycle</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-300">
                {[
                  { num: '1', title: 'User Request', desc: 'Receive natural text input' },
                  { num: '2', title: 'Understand Intent', desc: 'Parse CS course codes, deadlines, effort hours' },
                  { num: '3', title: 'Create Plan', desc: 'Synthesize optimal multi-step resolution' },
                  { num: '4', title: 'Select Tools', desc: 'Pick DB, calendar, & solver tools' },
                  { num: '5', title: 'Execute Tools', desc: 'Perform mutations & schedule updates' },
                  { num: '6', title: 'Observe & Re-Plan', desc: 'Detect conflicts & prompt approval if required' },
                ].map((item) => (
                  <div key={item.num} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {item.num}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{item.title}</div>
                      <div className="text-slate-400 text-[11px]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Workflow Pipeline Visualizer Tab */
        <div className="glass-panel p-8 rounded-2xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="font-heading font-extrabold text-2xl text-slate-100">
              Agent Execution Architecture
            </h3>
            <p className="text-xs text-slate-400">
              End-to-end trace of intent analysis, tool selection, plan generation, and human approval checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { step: '01', title: 'Intent Engine', icon: Sparkles, color: 'text-emerald-400', desc: 'Parses course codes, deadlines, estimated effort' },
              { step: '02', title: 'Planner', icon: Layers, color: 'text-cyan-400', desc: 'Calculates free slots & balances workload' },
              { step: '03', title: 'Tool Registry', icon: Wrench, color: 'text-indigo-400', desc: 'Executes Task DB & Calendar APIs' },
              { step: '04', title: 'Re-Planner', icon: RotateCcw, color: 'text-amber-400', desc: 'Detects conflicts & reschedules' },
              { step: '05', title: 'Human Approval', icon: ShieldAlert, color: 'text-rose-400', desc: 'Enforces student approval on shifts' },
            ].map((node, index) => {
              const IconComponent = node.icon;
              return (
                <div key={node.step} className="glass-panel p-5 rounded-xl border-slate-800 flex flex-col items-center text-center space-y-3 relative">
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
