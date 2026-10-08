import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3,
  BookOpen,
  Percent,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Task, Subject, PriorityLevel, TaskStatus } from '../types';
import { studyopsApi } from '../api/client';
import { EditTaskModal } from '../components/EditTaskModal';
import { CreateSubjectModal } from '../components/CreateSubjectModal';

interface TasksPageProps {
  tasks: Task[];
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  subjects,
  isLoading,
  error,
  onRefresh,
  onOpenCreateModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Subject modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.course_code && task.course_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubjectId === 'all' || 
                           (task.subject_id && String(task.subject_id) === selectedSubjectId) ||
                           (task.course_code === selectedSubjectId);
    
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

    return matchesSearch && matchesSubject && matchesStatus && matchesPriority;
  });

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const nextProgress = task.status === 'completed' ? 0 : 100;
    try {
      await studyopsApi.updateTask(task.id, { status: nextStatus, progress: nextProgress });
      onRefresh();
    } catch (e) {
      console.error("Failed to update task status", e);
    }
  };

  const handleUpdateProgressInline = async (task: Task, newProgress: number) => {
    const nextStatus: TaskStatus = newProgress >= 100 ? 'completed' : (newProgress > 0 ? 'in_progress' : 'pending');
    try {
      await studyopsApi.updateTask(task.id, { progress: newProgress, status: nextStatus });
      onRefresh();
    } catch (e) {
      console.error("Failed to update progress", e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await studyopsApi.deleteTask(taskId);
        onRefresh();
      } catch (e) {
        console.error("Failed to delete task", e);
      }
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100">Assignments & Deadlines</h3>
            <p className="text-xs text-slate-400">Track CS course deliverables, completion progress %, and deadlines</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Add Subject</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="glass-panel p-4 rounded-2xl border-rose-500/30 bg-rose-950/20 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={onRefresh} className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-semibold">
            Retry Connection
          </button>
        </div>
      )}

      {/* Subject Badge Quick Filter */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSubjectId === 'all' 
                ? 'bg-slate-700 text-white border border-slate-600' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Subjects ({tasks.length})
          </button>

          {subjects.map(s => {
            const count = tasks.filter(t => t.subject_id === s.id || t.course_code === s.code).length;
            const isSelected = selectedSubjectId === String(s.id) || selectedSubjectId === s.code;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(String(s.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected 
                    ? 'bg-slate-800 text-slate-100 border border-slate-700' 
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#10b981' }} />
                <span>{s.code} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Multi Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments or topics..."
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 border-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 border-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-panel rounded-2xl overflow-hidden border-slate-800">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div>SHOWING {filteredTasks.length} ASSIGNMENTS</div>
          {isLoading && (
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing Data...</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-800/80">
          {isLoading && tasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <div className="text-slate-400 text-sm">Loading assignments...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-slate-400 text-sm">No assignments found matching criteria.</div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const deadlineDate = new Date(task.deadline || task.due_date);
              const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const subjectColor = task.subject?.color || '#10b981';

              return (
                <div 
                  key={task.id} 
                  className={`p-5 space-y-4 hover:bg-slate-800/40 transition-colors ${
                    task.status === 'completed' ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox button */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          task.status === 'completed' 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'border-slate-600 hover:border-emerald-400 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-950"
                            style={{ backgroundColor: subjectColor }}
                          >
                            {task.course_code || 'CS'}
                          </span>
                          <h4 className={`font-semibold text-base text-slate-100 ${
                            task.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}>
                            {task.title}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-400 mt-1">{task.description}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-emerald-400">
                            <Clock className="w-3.5 h-3.5" />
                            Est. Effort: {task.estimated_effort || task.estimated_hours}h
                          </span>
                          <span>Deadline: <strong className="text-slate-200">{formattedDeadline}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        task.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
                        title="Edit Assignment & Progress"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Quick Interactive Slider */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-emerald-400" />
                        <span>Completion Progress</span>
                      </span>
                      <span className="font-bold text-emerald-400">{task.progress || 0}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden p-0.5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={task.progress || 0}
                        onChange={(e) => handleUpdateProgressInline(task, Number(e.target.value))}
                        className="w-24 h-1.5 rounded-lg bg-slate-800 accent-emerald-500 cursor-pointer"
                        title="Quick slide progress"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        subjects={subjects}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Add Subject Modal */}
      <CreateSubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
