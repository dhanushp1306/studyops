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
  BookOpen
} from 'lucide-react';
import { Task, PriorityLevel, TaskStatus } from '../types';
import { studyopsApi } from '../api/client';

interface TasksPageProps {
  tasks: Task[];
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onRefresh,
  onOpenCreateModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter tasks logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourse = selectedCourse === 'all' || task.course_code === selectedCourse;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await studyopsApi.updateTask(task.id, { status: nextStatus });
      onRefresh();
    } catch (e) {
      console.error("Failed to update task status", e);
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

  const courses = Array.from(new Set(tasks.map(t => t.course_code)));

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-slate-100">Assignments & Tasks</h3>
            <p className="text-xs text-slate-400">Track deadlines, estimated hours, and course deliverables</p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Assignment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
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

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 border-slate-700"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Tasks Table / Card List */}
      <div className="glass-panel rounded-2xl overflow-hidden border-slate-800">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div>SHOWING {filteredTasks.length} ASSIGNMENTS</div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-slate-400 text-sm">No assignments found matching criteria.</div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const dueDate = new Date(task.due_date);
              const formattedDate = dueDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={task.id} 
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors ${
                    task.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleStatus(task)}
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {task.course_code}
                        </span>
                        <h4 className={`font-semibold text-sm text-slate-100 ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-emerald-400">
                          <Clock className="w-3 h-3" />
                          Est. {task.estimated_hours}h ({task.completed_hours}h done)
                        </span>
                        <span>Due: <strong className="text-slate-300">{formattedDate}</strong></span>
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
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
