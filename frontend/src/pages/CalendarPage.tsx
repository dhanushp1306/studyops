import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarPageProps {
  events: CalendarEvent[];
  onRefresh: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ events }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100">Academic Schedule Calendar</h3>
            <p className="text-xs text-slate-400">Class lectures, auto-scheduled study sessions & assignment time blocks</p>
          </div>
        </div>
      </div>

      {/* Events Grid by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((evt) => {
          const start = new Date(evt.start_time);
          const end = new Date(evt.end_time);
          const formattedDate = start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          const formattedStart = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const formattedEnd = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const isStudySession = evt.event_type === 'study_session';
          const isClass = evt.event_type === 'class';
          const isAssignmentWork = evt.event_type === 'assignment_work';

          return (
            <div 
              key={evt.id} 
              className={`glass-panel p-5 rounded-2xl border-l-4 space-y-3 glass-panel-hover ${
                isClass ? 'border-l-indigo-500 bg-indigo-950/10' :
                isStudySession ? 'border-l-emerald-500 bg-emerald-950/10' :
                'border-l-cyan-500 bg-cyan-950/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {formattedDate}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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

              <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-slate-800">
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
          );
        })}
      </div>
    </div>
  );
};
