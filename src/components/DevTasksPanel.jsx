/**
 * DevTasksPanel - Hidden Developer Task Management (Easter Egg)
 * Access: Ctrl+Shift+D or type "devmode" anywhere
 *
 * Matches the game's glassmorphism dark theme aesthetic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadTasks, addTask, updateTask, deleteTask,
  loadPersons, addPerson,
  TASK_TYPES, PRIORITIES, STATUSES,
  sortTasks, filterTasks
} from '../utils/devTasksStorage';

// Shared styles matching game aesthetic
const panelStyle = {
  background: 'linear-gradient(145deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 20, 0.98) 100%)',
  borderRadius: 16,
  border: 'none',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(100, 100, 150, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05)
  `,
  backdropFilter: 'blur(20px)',
};

const buttonStyle = {
  background: 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
  transition: 'all 0.2s ease',
};

const inputStyle = {
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(100, 100, 150, 0.3)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#ffffff',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

// Quick Add Mini Panel (floating)
function QuickAddPanel({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), type, priority });
    setTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10001,
      ...panelStyle,
      padding: 24,
      minWidth: 400,
    }}>
      <div style={{
        color: '#88aaff',
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 16,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        Quick Add Task
        <span style={{
          marginLeft: 'auto',
          color: '#666',
          fontSize: 10,
          fontWeight: 400,
          fontFamily: 'monospace',
        }}>
          ESC to close
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          >
            {Object.entries(TASK_TYPES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>{icon} {label}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          >
            {Object.entries(PRIORITIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" style={{ ...buttonStyle, flex: 1, background: 'linear-gradient(145deg, #4a6a8a 0%, #3a5a7a 100%)' }}>
            Add Task
          </button>
          <button type="button" onClick={onClose} style={{ ...buttonStyle }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Task Item Component
function TaskItem({ task, onUpdate, onDelete, onSelect, isSelected }) {
  const typeInfo = TASK_TYPES[task.type] || TASK_TYPES.task;
  const priorityInfo = PRIORITIES[task.priority] || PRIORITIES.medium;
  const statusInfo = STATUSES[task.status] || STATUSES.open;

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        background: isSelected
          ? 'rgba(100, 130, 200, 0.2)'
          : 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        border: isSelected
          ? '1px solid rgba(100, 150, 255, 0.4)'
          : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Type icon */}
        <span style={{ fontSize: 16 }}>{typeInfo.icon}</span>

        {/* Title */}
        <span style={{
          flex: 1,
          color: task.status === 'done' ? '#888' : '#fff',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          fontSize: 14,
          fontWeight: 500,
        }}>
          {task.title || '(untitled)'}
        </span>

        {/* Priority badge */}
        <span style={{
          background: priorityInfo.color + '33',
          color: priorityInfo.color,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {priorityInfo.label}
        </span>

        {/* Status badge */}
        <span style={{
          background: statusInfo.color + '22',
          color: statusInfo.color,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
        }}>
          {statusInfo.label}
        </span>
      </div>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {task.tags.map(tag => (
            <span key={tag} style={{
              background: 'rgba(100, 100, 150, 0.3)',
              color: '#aabbcc',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Assignee */}
      {task.assignee && (
        <div style={{
          color: '#88aacc',
          fontSize: 11,
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>👤</span> {task.assignee}
        </div>
      )}
    </div>
  );
}

// Task Detail/Edit Panel
function TaskDetail({ task, onUpdate, onDelete, onClose, persons, onAddPerson }) {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newTag, setNewTag] = useState('');
  const [newPerson, setNewPerson] = useState('');

  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const handleSave = () => {
    onUpdate(task.id, editedTask);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTask.tags?.includes(newTag.trim())) {
      setEditedTask({
        ...editedTask,
        tags: [...(editedTask.tags || []), newTag.trim().toLowerCase()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setEditedTask({
      ...editedTask,
      tags: editedTask.tags.filter(t => t !== tag),
    });
  };

  const handleAddPersonClick = async () => {
    if (newPerson.trim()) {
      await onAddPerson(newPerson.trim());
      setEditedTask({ ...editedTask, assignee: newPerson.trim() });
      setNewPerson('');
    }
  };

  return (
    <div style={{
      ...panelStyle,
      padding: 20,
      width: 350,
      maxHeight: '80vh',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <span style={{
          color: '#88aaff',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          Edit Task
        </span>
        <button
          onClick={onClose}
          style={{
            ...buttonStyle,
            padding: '4px 10px',
            fontSize: 11,
          }}
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Title</label>
      <input
        type="text"
        value={editedTask.title || ''}
        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      {/* Description */}
      <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Description</label>
      <textarea
        value={editedTask.description || ''}
        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
        rows={4}
        style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }}
      />

      {/* Type & Priority */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Type</label>
          <select
            value={editedTask.type || 'task'}
            onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value })}
            style={selectStyle}
          >
            {Object.entries(TASK_TYPES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>{icon} {label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Priority</label>
          <select
            value={editedTask.priority || 'medium'}
            onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
            style={selectStyle}
          >
            {Object.entries(PRIORITIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Status</label>
      <select
        value={editedTask.status || 'open'}
        onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
        style={{ ...selectStyle, marginBottom: 12 }}
      >
        {Object.entries(STATUSES).map(([key, { label }]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {/* Assignee */}
      <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Assignee</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={editedTask.assignee || ''}
          onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
          style={{ ...selectStyle, flex: 1 }}
        >
          <option value="">Unassigned</option>
          {persons.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          value={newPerson}
          onChange={(e) => setNewPerson(e.target.value)}
          placeholder="New person"
          onKeyDown={(e) => e.key === 'Enter' && handleAddPersonClick()}
          style={{ ...inputStyle, width: 100 }}
        />
        <button onClick={handleAddPersonClick} style={{ ...buttonStyle, padding: '8px 12px' }}>+</button>
      </div>

      {/* Tags */}
      <label style={{ color: '#888', fontSize: 11, marginBottom: 4, display: 'block' }}>Tags</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {editedTask.tags?.map(tag => (
          <span
            key={tag}
            onClick={() => handleRemoveTag(tag)}
            style={{
              background: 'rgba(100, 100, 150, 0.3)',
              color: '#aabbcc',
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            #{tag} ✕
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add tag"
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleAddTag} style={{ ...buttonStyle, padding: '8px 12px' }}>+</button>
      </div>

      {/* Date info */}
      <div style={{
        color: '#666',
        fontSize: 10,
        fontFamily: 'monospace',
        marginBottom: 16,
        padding: '8px 10px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
      }}>
        Created: {new Date(editedTask.createdAt).toLocaleString()}<br/>
        Updated: {new Date(editedTask.updatedAt).toLocaleString()}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          style={{ ...buttonStyle, flex: 1, background: 'linear-gradient(145deg, #4a7a5a 0%, #3a6a4a 100%)' }}
        >
          Save Changes
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this task?')) {
              onDelete(task.id);
              onClose();
            }
          }}
          style={{ ...buttonStyle, background: 'linear-gradient(145deg, #8a4a4a 0%, #6a3a3a 100%)' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Main Panel Component
export default function DevTasksPanel({ isOpen, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [persons, setPersons] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [view, setView] = useState('list'); // list | board
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Load data from Firestore
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([loadTasks(), loadPersons()])
        .then(([tasksData, personsData]) => {
          setTasks(tasksData);
          setPersons(personsData);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const refreshTasks = useCallback(async () => {
    const tasksData = await loadTasks();
    setTasks(tasksData);
  }, []);

  const refreshPersons = useCallback(async () => {
    const personsData = await loadPersons();
    setPersons(personsData);
  }, []);

  const handleAddTask = async (taskData) => {
    await addTask(taskData);
    await refreshTasks();
    setShowQuickAdd(false);
  };

  const handleUpdateTask = async (taskId, updates) => {
    await updateTask(taskId, updates);
    await refreshTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    await refreshTasks();
    setSelectedTask(null);
  };

  const handleAddPerson = async (name) => {
    await addPerson(name);
    await refreshPersons();
  };

  // Keyboard shortcuts within panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showQuickAdd) setShowQuickAdd(false);
        else if (selectedTask) setSelectedTask(null);
        else onClose();
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowQuickAdd(true);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showQuickAdd, selectedTask, onClose]);

  if (!isOpen) return null;

  // Filter and sort tasks
  const filteredTasks = filterTasks(tasks, { ...filters, search: searchTerm });
  const sortedTasks = sortTasks(filteredTasks, sortBy);

  // Group by status for board view
  const tasksByStatus = {};
  Object.keys(STATUSES).forEach(status => {
    tasksByStatus[status] = sortedTasks.filter(t => t.status === status);
  });

  // Get all tags from current tasks
  const allTags = [...new Set(tasks.flatMap(t => t.tags || []))].sort();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }}
      />

      {/* Main Panel */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        display: 'flex',
        gap: 16,
        maxWidth: '95vw',
        maxHeight: '90vh',
      }}>
        {/* Left: Task List */}
        <div style={{
          ...panelStyle,
          padding: 20,
          width: view === 'board' ? 800 : 500,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔧</span>
              <span style={{
                color: '#88aaff',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                Dev Tasks
              </span>
              <span style={{
                color: '#666',
                fontSize: 11,
                fontFamily: 'monospace',
                background: 'rgba(100, 100, 150, 0.2)',
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {loading ? 'Loading...' : `${tasks.length} tasks`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowQuickAdd(true)}
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(145deg, #5a7a5a 0%, #4a6a4a 100%)',
                  padding: '6px 14px',
                }}
              >
                + New
              </button>
              <button
                onClick={() => setView(view === 'list' ? 'board' : 'list')}
                style={{ ...buttonStyle, padding: '6px 14px' }}
              >
                {view === 'list' ? '▦ Board' : '≡ List'}
              </button>
              <button
                onClick={onClose}
                style={{ ...buttonStyle, padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
              >
                <option value="">All Types</option>
                {Object.entries(TASK_TYPES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUSES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
              >
                <option value="">All Priorities</option>
                {Object.entries(PRIORITIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filters.assignee || ''}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value || undefined })}
                style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
              >
                <option value="">All Assignees</option>
                {persons.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {allTags.length > 0 && (
                <select
                  value={filters.tag || ''}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value || undefined })}
                  style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ ...selectStyle, width: 'auto', padding: '6px 30px 6px 10px', fontSize: 12 }}
              >
                <option value="priority">Sort: Priority</option>
                <option value="date">Sort: Newest</option>
                <option value="updated">Sort: Updated</option>
                <option value="type">Sort: Type</option>
              </select>
              {Object.values(filters).some(v => v) && (
                <button
                  onClick={() => setFilters({})}
                  style={{ ...buttonStyle, padding: '4px 10px', fontSize: 11 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Task List or Board */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {view === 'list' ? (
              sortedTasks.length > 0 ? (
                sortedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                    isSelected={selectedTask?.id === task.id}
                  />
                ))
              ) : (
                <div style={{
                  color: '#666',
                  textAlign: 'center',
                  padding: 40,
                  fontSize: 14,
                }}>
                  No tasks found. Press Ctrl+N to add one!
                </div>
              )
            ) : (
              /* Board View */
              <div style={{ display: 'flex', gap: 12, minHeight: 400 }}>
                {Object.entries(STATUSES).slice(0, 4).map(([status, { label, color }]) => (
                  <div key={status} style={{ flex: 1, minWidth: 180 }}>
                    <div style={{
                      color: color,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 10,
                      padding: '6px 10px',
                      background: color + '15',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      {label}
                      <span style={{
                        background: color + '33',
                        padding: '0 6px',
                        borderRadius: 4,
                      }}>
                        {tasksByStatus[status]?.length || 0}
                      </span>
                    </div>
                    <div style={{
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: 8,
                      padding: 8,
                      minHeight: 300,
                    }}>
                      {tasksByStatus[status]?.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onUpdate={handleUpdateTask}
                          onDelete={handleDeleteTask}
                          onSelect={setSelectedTask}
                          isSelected={selectedTask?.id === task.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            color: '#555',
            fontSize: 10,
            fontFamily: 'monospace',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(100, 100, 150, 0.15)',
          }}>
            Ctrl+N: New task • ESC: Close • Click task to edit
          </div>
        </div>

        {/* Right: Task Detail */}
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onClose={() => setSelectedTask(null)}
            persons={persons}
            onAddPerson={handleAddPerson}
          />
        )}
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <QuickAddPanel
          onAdd={handleAddTask}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </>
  );
}
