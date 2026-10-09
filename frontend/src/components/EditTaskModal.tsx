import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Clock, Percent, AlertCircle } from 'lucide-react';
import { Task, Subject, PriorityLevel, TaskStatus } from '../types';
import { studyopsApi } from '../api/client';

interface EditTaskModalProps {
  task: Task | null;
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  subjects,
  isOpen,
  onClose,
  onSuccess
}) => {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !task) return;
    const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, task, onClose]);

  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [subjectId, setSubjectId] = useState<string>(task.subject_id ? String(task.subject_id) : '');
  const [priority, setPriority] = useState<PriorityLevel>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress || 0);
  const [estimatedEffort, setEstimatedEffort] = useState<string>(String(task.estimated_effort || 2.0));
  const [deadline, setDeadline] = useState<string>(
    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const selectedSubject = subjects.find(s => s.id === parseInt(subjectId));

      await studyopsApi.updateTask(task.id, {
        title,
        description,
        subject_id: subjectId ? parseInt(subjectId) : undefined,
        course_code: selectedSubject?.code || task.course_code,
        course_name: selectedSubject?.name || task.course_name,
        priority,
        status: progress >= 100 ? 'completed' : status,
        progress: Number(progress),
        estimated_effort: parseFloat(estimatedEffort) || 2.0,
        deadline: new Date(deadline).toISOString()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update task", err);
      setErrorMsg(err?.response?.data?.detail || "Failed to update assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-slate-700 bg-slate-900 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="edit-task-title" className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
            <Save className="w-5 h-5 text-emerald-400" />
            <span>Edit Assignment & Progress</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Progress Slider 0 - 100% */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completion Progress:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-800 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Effort (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Deadline Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input p-3 rounded-xl text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? 'Updating...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
