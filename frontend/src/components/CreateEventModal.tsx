import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { Subject, Task, EventType } from '../types';
import { studyopsApi } from '../api/client';

interface CreateEventModalProps {
  isOpen: boolean;
  subjects: Subject[];
  tasks: Task[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  subjects,
  tasks,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('study_session');
  const [subjectId, setSubjectId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
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
    if (!title || !startTime || !endTime) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const selectedSubject = subjects.find(s => s.id === parseInt(subjectId));
      
      await studyopsApi.createCalendarEvent({
        title,
        event_type: eventType,
        subject_id: subjectId ? parseInt(subjectId) : undefined,
        course_code: selectedSubject?.code,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location: location || undefined,
        linked_task_id: taskId ? parseInt(taskId) : undefined,
        status: 'scheduled'
      });

      // Also create StudySession if event_type is study_session
      if (eventType === 'study_session' && subjectId) {
        await studyopsApi.createStudySession({
          title,
          subject_id: parseInt(subjectId),
          task_id: taskId ? parseInt(taskId) : undefined,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          status: 'scheduled'
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create calendar event", err);
      setErrorMsg(err?.response?.data?.detail || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border-slate-700 bg-slate-900 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="create-event-title" className="font-heading font-bold text-lg text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>Schedule Calendar Event / Session</span>
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Event Title *</label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DAA Dynamic Programming Study Session"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Event Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="study_session">Study Session</option>
                <option value="assignment_work">Assignment Work</option>
                <option value="class">Class Lecture</option>
                <option value="exam">Exam / Quiz</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="">-- Optional Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">End Time *</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Linked Task</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border-slate-700"
              >
                <option value="">-- No Linked Task --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Location / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library 2nd Floor"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
