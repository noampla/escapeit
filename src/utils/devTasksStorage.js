/**
 * Developer Tasks Storage - Hidden Easter Egg Feature
 * Firestore-based task management for developers
 * Access via secret key combo: Ctrl+Shift+D (or type "devmode")
 */

import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const TASKS_COLLECTION = 'dev_tasks';
const PERSONS_COLLECTION = 'dev_persons';

// Task types with their colors and icons
export const TASK_TYPES = {
  bug: { label: 'Bug', color: '#ff6666', icon: '🐛' },
  feature: { label: 'Feature', color: '#66aaff', icon: '✨' },
  task: { label: 'Task', color: '#aaaaaa', icon: '📋' },
  idea: { label: 'Idea', color: '#ffcc66', icon: '💡' },
  note: { label: 'Note', color: '#88ff88', icon: '📝' },
};

// Priority levels
export const PRIORITIES = {
  critical: { label: 'Critical', color: '#ff4444', order: 0 },
  high: { label: 'High', color: '#ff8844', order: 1 },
  medium: { label: 'Medium', color: '#ffcc44', order: 2 },
  low: { label: 'Low', color: '#88ccff', order: 3 },
  someday: { label: 'Someday', color: '#888888', order: 4 },
};

// Task statuses
export const STATUSES = {
  open: { label: 'Open', color: '#ffffff' },
  inProgress: { label: 'In Progress', color: '#ffcc44' },
  testing: { label: 'Testing', color: '#88ccff' },
  done: { label: 'Done', color: '#88ff88' },
  wontfix: { label: "Won't Fix", color: '#888888' },
};

export function generateTaskId() {
  return 'task_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Load all tasks from Firestore
export async function loadTasks() {
  try {
    const snapshot = await getDocs(collection(db, TASKS_COLLECTION));
    const tasks = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    // Sort by createdAt descending (newest first)
    return tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error('Failed to load dev tasks:', e);
    return [];
  }
}

// Save a single task (create or update)
export async function saveTask(task) {
  try {
    await setDoc(doc(db, TASKS_COLLECTION, task.id), task);
  } catch (e) {
    console.error('Failed to save dev task:', e);
  }
}

// Add a new task
export async function addTask(task) {
  const newTask = {
    id: generateTaskId(),
    type: 'task',
    priority: 'medium',
    status: 'open',
    title: '',
    description: '',
    tags: [],
    assignee: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...task,
  };
  await saveTask(newTask);
  return newTask;
}

// Update an existing task
export async function updateTask(taskId, updates) {
  try {
    const updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await updateDoc(doc(db, TASKS_COLLECTION, taskId), updatedData);
    return { id: taskId, ...updatedData };
  } catch (e) {
    console.error('Failed to update dev task:', e);
    return null;
  }
}

// Delete a task
export async function deleteTask(taskId) {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (e) {
    console.error('Failed to delete dev task:', e);
  }
}

// Persons management
export async function loadPersons() {
  try {
    const snapshot = await getDocs(collection(db, PERSONS_COLLECTION));
    if (snapshot.empty) {
      return ['Me'];
    }
    const persons = snapshot.docs.map(d => d.data().name).filter(Boolean);
    return persons.length > 0 ? persons : ['Me'];
  } catch (e) {
    console.error('Failed to load persons:', e);
    return ['Me'];
  }
}

export async function addPerson(name) {
  try {
    const personId = name.toLowerCase().replace(/\s+/g, '_');
    await setDoc(doc(db, PERSONS_COLLECTION, personId), { name });
    return await loadPersons();
  } catch (e) {
    console.error('Failed to add person:', e);
    return await loadPersons();
  }
}

// Get all unique tags from tasks
export async function getAllTags() {
  const tasks = await loadTasks();
  const tags = new Set();
  tasks.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

// Sort tasks by priority and date
export function sortTasks(tasks, sortBy = 'priority') {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pa = PRIORITIES[a.priority]?.order ?? 99;
      const pb = PRIORITIES[b.priority]?.order ?? 99;
      if (pa !== pb) return pa - pb;
      return b.createdAt - a.createdAt;
    }
    if (sortBy === 'date') {
      return b.createdAt - a.createdAt;
    }
    if (sortBy === 'updated') {
      return b.updatedAt - a.updatedAt;
    }
    if (sortBy === 'type') {
      return (a.type || '').localeCompare(b.type || '');
    }
    return 0;
  });
}

// Filter tasks
export function filterTasks(tasks, filters = {}) {
  return tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && t.assignee !== filters.assignee) return false;
    if (filters.tag && !t.tags?.includes(filters.tag)) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const inTitle = t.title?.toLowerCase().includes(s);
      const inDesc = t.description?.toLowerCase().includes(s);
      const inTags = t.tags?.some(tag => tag.toLowerCase().includes(s));
      if (!inTitle && !inDesc && !inTags) return false;
    }
    return true;
  });
}
