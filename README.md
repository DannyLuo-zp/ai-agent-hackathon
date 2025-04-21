# ai-agent-hackathon
Repository for Microsoft AI agent Hackathon April 2025

## Project Structure

### Backend (FastAPI + Socket.IO)
- Real-time communication using Socket.IO
- Session management for chat conversations
- Extensible architecture for future voice/audio APIs
- Python-based with FastAPI framework

### Frontend (Next.js + React)
- ChatGPT-like UI using Next.js and Tailwind CSS
- Real-time WebSocket communication
- Session persistence across reconnections
- TypeScript for type safety

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

