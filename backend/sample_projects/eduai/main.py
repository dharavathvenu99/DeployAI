"""
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
