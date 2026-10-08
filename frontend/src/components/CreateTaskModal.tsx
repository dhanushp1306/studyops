import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { PriorityLevel } from '../types';
import { studyopsApi } from '../api/client';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS301');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('3.0');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseCode || !dueDate) return;

    setIsSubmitting(true);
    try {
      await studyopsApi.createTask({
        title,
        course_code: courseCode,
        description,
        estimated_hours: parseFloat(estimatedHours) || 2.0,
        due_date: new Date(dueDate).toISOString(),
        priority,
        status: 'pending'
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-slate-700 bg-slate-900 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Add New CS Assignment</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Assignment Title *</label>
            <input
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS301"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Effort (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
