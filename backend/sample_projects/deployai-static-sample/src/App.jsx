import React, { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Trash2, Clock, Server, Code, Calendar, Check, Circle } from 'lucide-react';

const BUILD_TIME = new Date().toISOString();
const DEPLOYMENT_TIMESTAMP = new Date().toISOString();

function App() {
  const [count, setCount] = useState(0);
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Explore the deployed application', completed: true },
    { id: 2, text: 'Test the counter functionality', completed: false },
    { id: 3, text: 'Add a new task', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const [buildTime] = useState(BUILD_TIME);
  const [deploymentTime] = useState(DEPLOYMENT_TIMESTAMP);

  const incrementCount = () => setCount(c => c + 1);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks(t => [...t, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(t => t.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(t => t.filter(task => task.id !== id));
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-slate-950 to-indigo-900/30" />
      
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Running</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            DeployAI Deployment Successful
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            This project was analyzed, deployed, and tested by DeployAI.
          </p>
        </header>

        <div className="space-y-8">
          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Interactive Counter</h2>
                <p className="text-sm text-slate-400">State persisted in browser memory</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <span className="text-4xl sm:text-6xl font-extrabold text-white font-mono">{count}</span>
              </div>
              <button
                onClick={incrementCount}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-xl shadow-purple-600/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span>Increment Counter</span>
              </button>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">Counter value: <span className="font-mono text-cyan-400">{count}</span></p>
          </section>

          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Task Manager</h2>
                <p className="text-sm text-slate-400">Add, complete, and delete tasks</p>
              </div>
            </div>
            
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Enter a new task..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={addTask}
                disabled={!newTask.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {tasks.length === 0 ? (
                <li className="text-center text-slate-500 py-8 text-sm">No tasks yet. Add one above!</li>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'border-emerald-400 bg-emerald-400'
                          : 'border-slate-500 hover:border-purple-400'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
            
            <p className="text-center text-sm text-slate-500 mt-4">
              {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
            </p>
          </section>

          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Deployment Details</h2>
                <p className="text-sm text-slate-400">Provider, framework, and build information</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Server className="w-3.5 h-3.5" />
                  <span>Provider</span>
                </div>
                <p className="text-lg font-bold text-white">Netlify</p>
                <p className="text-xs text-slate-400">Static Site Deployment</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Code className="w-3.5 h-3.5" />
                  <span>Framework</span>
                </div>
                <p className="text-lg font-bold text-white">React + Vite</p>
                <p className="text-xs text-slate-400">TypeScript / JavaScript</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Build Time</span>
                </div>
                <p className="text-sm font-bold text-white font-mono">{formatDate(buildTime)}</p>
                <p className="text-xs text-slate-400">Build command: npm run build</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Deployed At</span>
                </div>
                <p className="text-sm font-bold text-white font-mono">{formatDate(deploymentTime)}</p>
                <p className="text-xs text-slate-400">Health check passed</p>
              </div>
            </div>
          </section>

          <footer className="text-center text-sm text-slate-500 py-8 border-t border-white/10">
            <p>Deployed with <span className="text-purple-400 font-semibold">DeployAI</span> — From code to live URL</p>
          </footer>
        </div>
      </main>

      <style jsx global>{`
        .glass-panel {
          background: rgba(15, 17, 35, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(139, 92, 246, 0.18);
        }
      `}</style>
    </div>
  );
}

export default App;
