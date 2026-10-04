"""
Sample Projects Manager for Hackathon Demo Mode
Pre-bundles EduAI, React E-Commerce, Next.js Showcase, and DeployAI Static Sample
"""
import os
import json
import zipfile
from ..config import settings

class SamplesManager:

    @staticmethod
    def ensure_sample_projects():
        """
        Creates sample project directories and their zipped archives.
        """
        samples_root = settings.SAMPLES_DIR
        os.makedirs(samples_root, exist_ok=True)

        # 1. EduAI Project (Python FastAPI + LangChain + SQLite)
        eduai_dir = os.path.join(samples_root, "eduai")
        os.makedirs(eduai_dir, exist_ok=True)

        with open(os.path.join(eduai_dir, "requirements.txt"), "w", encoding="utf-8") as f:
            f.write("fastapi==0.111.0\nuvicorn==0.30.1\npydantic==2.7.4\nlangchain==0.2.6\nsqlalchemy==2.0.30\n")

        with open(os.path.join(eduai_dir, ".env.example"), "w", encoding="utf-8") as f:
            f.write("# EduAI Environment Configuration\nPORT=8000\nDATABASE_URL=sqlite:///./eduai.db\nGEMINI_API_KEY=your_gemini_key_here\nAI_MODEL=gemini-1.5-flash\n")

        with open(os.path.join(eduai_dir, "main.py"), "w", encoding="utf-8") as f:
            f.write('''"""
EduAI - Intelligent Adaptive Learning Backend
"""
import os
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="EduAI API", version="1.0.0")

class QuestionRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "EduAI Backend", "version": "1.0.0"}

@app.get("/healthz")
def health_check():
    return {"status": "ok", "database": "connected"}

@app.post("/api/generate-quiz")
def generate_quiz(req: QuestionRequest):
    return {
        "subject": req.subject,
        "topic": req.topic,
        "questions": [
            {
                "id": 1,
                "question": f"What is the core principle of {req.topic}?",
                "options": ["Abstraction", "Concurrency", "Induction", "Polymorphism"],
                "answer": "Abstraction"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
''')

        with open(os.path.join(eduai_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write("# EduAI — AI Classroom Assistant\nFastAPI backend for generative study quizzes and adaptive flashcards.\n")

        # Zip EduAI
        eduai_zip = os.path.join(samples_root, "eduai.zip")
        with zipfile.ZipFile(eduai_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(eduai_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, eduai_dir)
                    zf.write(full_path, arcname)

        # 2. React E-Commerce (React + Vite + Tailwind)
        react_dir = os.path.join(samples_root, "react-ecommerce")
        os.makedirs(os.path.join(react_dir, "src"), exist_ok=True)

        package_json_content = {
            "name": "react-swiftcart",
            "version": "1.0.0",
            "type": "module",
            "scripts": {
                "dev": "vite",
                "build": "vite build",
                "preview": "vite preview"
            },
            "dependencies": {
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "lucide-react": "^0.395.0"
            },
            "devDependencies": {
                "@vitejs/plugin-react": "^4.3.0",
                "vite": "^5.3.1",
                "tailwindcss": "^3.4.4",
                "typescript": "^5.4.5"
            }
        }
        with open(os.path.join(react_dir, "package.json"), "w", encoding="utf-8") as f:
            json.dump(package_json_content, f, indent=2)

        with open(os.path.join(react_dir, "vite.config.ts"), "w", encoding="utf-8") as f:
            f.write('import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 5173 }\n});\n')

        with open(os.path.join(react_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write('<!DOCTYPE html>\n<html><head><title>SwiftCart</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>')

        with open(os.path.join(react_dir, "src", "main.tsx"), "w", encoding="utf-8") as f:
            f.write('import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(<App />);\n')

        with open(os.path.join(react_dir, "src", "App.tsx"), "w", encoding="utf-8") as f:
            f.write('import React from "react";\n\nexport default function App() {\n  return (\n    <main className="p-8 text-center">\n      <h1 className="text-3xl font-bold">SwiftCart Store</h1>\n      <p>Mobile-first modern catalog.</p>\n    </main>\n  );\n}\n')

        with open(os.path.join(react_dir, ".env.example"), "w", encoding="utf-8") as f:
            f.write("VITE_STORE_API_KEY=pk_live_swiftcart_demo\nVITE_CURRENCY=INR\n")

        with open(os.path.join(react_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write("# SwiftCart - Modern React E-Commerce\nSingle-page shopping experience built with React 18 and Vite.\n")

        # Zip React
        react_zip = os.path.join(samples_root, "react-ecommerce.zip")
        with zipfile.ZipFile(react_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(react_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, react_dir)
                    zf.write(full_path, arcname)

        # 3. Next.js Fullstack Dashboard
        next_dir = os.path.join(samples_root, "nextjs-dashboard")
        os.makedirs(os.path.join(next_dir, "app"), exist_ok=True)

        next_pkg = {
            "name": "nextcloud-dashboard",
            "version": "1.0.0",
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start"
            },
            "dependencies": {
                "next": "14.2.4",
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "@prisma/client": "^5.15.0"
            },
            "devDependencies": {
                "prisma": "^5.15.0",
                "typescript": "^5.4.5"
            }
        }
        with open(os.path.join(next_dir, "package.json"), "w", encoding="utf-8") as f:
            json.dump(next_pkg, f, indent=2)

        with open(os.path.join(next_dir, "next.config.js"), "w", encoding="utf-8") as f:
            f.write("/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true };\nmodule.exports = nextConfig;\n")

        with open(os.path.join(next_dir, "app", "page.tsx"), "w", encoding="utf-8") as f:
            f.write('export default function Page() {\n  return <div>Next.js Enterprise Cloud Dashboard</div>;\n}\n')

        with open(os.path.join(next_dir, ".env.example"), "w", encoding="utf-8") as f:
            f.write("DATABASE_URL=postgresql://user:pass@render.com/db\nNEXTAUTH_SECRET=supersecret123\n")

        with open(os.path.join(next_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write("# NextCloud - Enterprise Analytics Dashboard\nFullstack SSR Next.js 14 application with Prisma ORM.\n")

        # Zip Next.js
        next_zip = os.path.join(samples_root, "nextjs-dashboard.zip")
        with zipfile.ZipFile(next_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(next_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, next_dir)
                    zf.write(full_path, arcname)

        # 4. DeployAI Static Sample (React + Vite) - For Demo Deployment
        static_dir = os.path.join(samples_root, "deployai-static-sample")
        os.makedirs(os.path.join(static_dir, "src"), exist_ok=True)

        static_pkg = {
            "name": "deployai-static-sample",
            "version": "1.0.0",
            "type": "module",
            "scripts": {
                "dev": "vite",
                "build": "vite build",
                "preview": "vite preview"
            },
            "dependencies": {
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "lucide-react": "^0.395.0"
            },
            "devDependencies": {
                "@vitejs/plugin-react": "^4.3.0",
                "vite": "^5.3.1",
                "tailwindcss": "^3.4.4",
                "postcss": "^8.4.38",
                "autoprefixer": "^10.4.19"
            }
        }
        with open(os.path.join(static_dir, "package.json"), "w", encoding="utf-8") as f:
            json.dump(static_pkg, f, indent=2)

        with open(os.path.join(static_dir, "vite.config.js"), "w", encoding="utf-8") as f:
            f.write('import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 5173 },\n  build: {\n    outDir: "dist",\n    sourcemap: false\n  }\n});\n')

        with open(os.path.join(static_dir, "postcss.config.js"), "w", encoding="utf-8") as f:
            f.write('export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n')

        with open(os.path.join(static_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write('<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>DeployAI Deployment Successful</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>')

        with open(os.path.join(static_dir, "src", "main.jsx"), "w", encoding="utf-8") as f:
            f.write('import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n')

        with open(os.path.join(static_dir, "src", "App.jsx"), "w", encoding="utf-8") as f:
            f.write('''import React, { useState, useEffect } from 'react';
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
''')

        with open(os.path.join(static_dir, "src", "index.css"), "w", encoding="utf-8") as f:
            f.write('''@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  padding: 0;
  background-color: #070814;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0b0d1e;
}
::-webkit-scrollbar-thumb {
  background: #25284a;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8b5cf6;
}

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.safe-top {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}
''')

        with open(os.path.join(static_dir, ".env.example"), "w", encoding="utf-8") as f:
            f.write("# DeployAI Static Sample Project - Environment Example\n# No environment variables required for this static demo\n# This file is included in the download ZIP\n\n# Example variables for a real project:\n# VITE_API_URL=https://api.example.com\n# VITE_APP_TITLE=My App\n")

        with open(os.path.join(static_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write("# DeployAI Static Sample\nInteractive demo project with counter and task manager.\n")

        # Zip DeployAI Static Sample
        static_zip = os.path.join(samples_root, "deployai-static-sample.zip")
        with zipfile.ZipFile(static_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(static_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, static_dir)
                    zf.write(full_path, arcname)

    @staticmethod
    def get_sample_list():
        return [
            {
                "id": "eduai",
                "name": "EduAI — AI Study Assistant",
                "framework": "FastAPI (Python 3)",
                "description": "High-performance Python microservice with SQLite database, AI quiz generator, and Uvicorn server.",
                "language": "Python",
                "recommended_provider": "Render",
                "badge": "AI & Backend",
                "icon": "bot",
                "download_url": "/api/samples/download/eduai.zip"
            },
            {
                "id": "react-ecommerce",
                "name": "SwiftCart — Modern React Store",
                "framework": "React 18 (Vite)",
                "description": "Fast single page e-commerce frontend with Tailwind CSS and modular UI components.",
                "language": "TypeScript / React",
                "recommended_provider": "Vercel",
                "badge": "Frontend & Edge",
                "icon": "shopping-cart",
                "download_url": "/api/samples/download/react-ecommerce.zip"
            },
            {
                "id": "nextjs-dashboard",
                "name": "NextCloud — Analytics Portal",
                "framework": "Next.js 14 (App Router)",
                "description": "Fullstack SSR Next.js portal with server-side rendering, Prisma ORM, and PostgreSQL connection.",
                "language": "TypeScript / Next.js",
                "recommended_provider": "Vercel",
                "badge": "Fullstack SSR",
                "icon": "layout-dashboard",
                "download_url": "/api/samples/download/nextjs-dashboard.zip"
            },
            {
                "id": "deployai-static-sample",
                "name": "DeployAI Static Sample",
                "framework": "React 18 (Vite)",
                "description": "Interactive demo project with working counter, task manager, and deployment details. Used for live deployment testing.",
                "language": "JavaScript / React",
                "recommended_provider": "Netlify",
                "badge": "Demo & Testing",
                "icon": "rocket",
                "download_url": "/api/samples/download/deployai-static-sample.zip"
            }
        ]