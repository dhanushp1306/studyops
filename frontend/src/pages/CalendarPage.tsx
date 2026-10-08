import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  BookOpen, 
  Plus, 
  RefreshCw,
  AlertCircle,
  Layers,
  Trash2
} from 'lucide-react';
import { CalendarEvent, StudySession, Subject, Task } from '../types';
import { studyopsApi } from '../api/client';
import { CreateEventModal } from '../components/CreateEventModal';

interface CalendarPageProps {
  events: CalendarEvent[];
  studySessions: StudySession[];
  subjects: Subject[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  studySessions,
  subjects,
  tasks,
  isLoading,
  error,
  onRefresh
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'study_session' | 'class'>('all');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Filter events
  const filteredEvents = events.filter(evt => {
    const matchesSubject = selectedSubjectId === 'all' || 
                           (evt.subject_id && String(evt.subject_id) === selectedSubjectId) ||
                           (evt.course_code === selectedSubjectId);
    
    const matchesTab = activeTab === 'all' || evt.event_type === activeTab;
    return matchesSubject && matchesTab;
  });

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm("Delete this calendar event?")) {
      try {
        await studyopsApi.deleteCalendarEvent(eventId);
        onRefresh();
      } catch (e) {
        console.error("Failed to delete event", e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100">Academic Timetable & Study Sessions</h3>
            <p className="text-xs text-slate-400">Manage class lectures, auto-scheduled study slots, and assignment work blocks</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateEventModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Event / Session</span>
        </button>
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

      {/* Filter Tabs & Subject Filter */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {(['all', 'study_session', 'class'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}s
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Filter Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 border-slate-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading && events.length === 0 ? (
          <div className="col-span-full p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <div className="text-slate-400 text-sm">Loading calendar events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center space-y-3 rounded-2xl">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-slate-400 text-sm">No scheduled events found.</div>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const start = new Date(evt.start_time);
            const end = new Date(evt.end_time);
            const formattedDate = start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const formattedStart = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedEnd = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const isClass = evt.event_type === 'class';
            const isStudySession = evt.event_type === 'study_session';
            const subjectColor = evt.subject?.color || '#06b6d4';

            return (
              <div 
                key={evt.id} 
                className="glass-panel p-5 rounded-2xl border-l-4 space-y-3 glass-panel-hover flex flex-col justify-between"
                style={{ borderLeftColor: subjectColor }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {formattedDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isClass ? 'bg-indigo-500/20 text-indigo-300' :
                      isStudySession ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {evt.event_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-slate-100">{evt.title}</h4>
                    {evt.course_code && (
                      <span className="text-xs text-slate-400 font-semibold">{evt.course_code}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono">{formattedStart} - {formattedEnd}</span>
                    </div>
                    {evt.location && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{evt.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        subjects={subjects}
        tasks={tasks}
        onClose={() => setIsCreateEventModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
