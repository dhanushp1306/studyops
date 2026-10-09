import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, Clock, BookOpen } from 'lucide-react';
import { Subject, PriorityLevel } from '../types';
import { studyopsApi } from '../api/client';

interface CreateTaskModalProps {
  isOpen: boolean;
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  subjects,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState('3.0');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const selectedSubject = subjects.find(s => s.id === parseInt(subjectId));

      await studyopsApi.createTask({
        title,
        subject_id: subjectId ? parseInt(subjectId) : undefined,
        course_code: selectedSubject?.code || 'CS301',
        course_name: selectedSubject?.name,
        description,
        estimated_effort: parseFloat(estimatedEffort) || 2.0,
        deadline: new Date(deadline).toISOString(),
        due_date: new Date(deadline).toISOString(),
        priority,
        progress: Number(progress),
        status: progress >= 100 ? 'completed' : 'pending'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create task", err);
      setErrorMsg(err?.response?.data?.detail || "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-slate-700 bg-slate-900 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="create-task-title" className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Add New CS Assignment</span>
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Assignment Title *</label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DAA Assignment 4 - Dynamic Programming"
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Effort (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-semibold uppercase border transition-all ${
                    priority === p 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key problems, required algorithm implementations, submission requirements..."
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
              {isSubmitting ? 'Creating...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
