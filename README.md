# ParaHelper - AI Shift Companion for Paramedics

Voice-first, daily AI companion exclusively for paramedics. Built for the Centennial College WIMTACH Hackathon (March 2-4, 2026).

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas (3 databases configured)
- ChromaDB server (for medical knowledge)
- API keys: OpenRouter, ElevenLabs, SendGrid

### Setup

1. Clone and install:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure `.env` in root:
```
OPENROUTER_API_KEY=your_key
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/
CHROMA_URL=http://localhost:8000
ELEVENLABS_API_KEY=your_key
SENDGRID_API_KEY=your_key
JWT_SECRET=your_secret
PORT=5000
```
Note: One MongoDB URI for the whole cluster. The app uses 3 databases: parahelper_users, parahelper_conversations, parahelper_operations.

3. Seed ChromaDB with medical knowledge:
```bash
cd backend && node setupChromaDB.js
```

4. Start backend:
```bash
cd backend && node server.js
```

5. Start frontend:
```bash
cd frontend && npm start
```

### Test Credentials
| Name | Badge | PIN | Role |
|------|-------|-----|------|
| Kendall Anderson | S-5591 | 5915 | ACP |
| Cameron Lewis | S-7807 | 4032 | PCP |
| Parker Clark | S-8834 | 8812 | ACP |
| Kendall Harris | S-9250 | 0285 | ACP |
| Jamie Martin | S-6220 | 3808 | PCP |

## Architecture

- **Frontend**: React SPA with Web Speech API for voice input
- **Backend**: Node.js + Express with 9 specialized AI agents
- **Databases**: MongoDB Atlas (3 DBs) + ChromaDB (vector search)
- **AI**: Claude Sonnet via OpenRouter + Gemini Flash for fast tasks
- **Voice**: ElevenLabs TTS for AI responses

## Deployment

Configured for Render via `render.yaml`. Two services:
- `parahelper-backend` - Node.js web service
- `parahelper-frontend` - Static site (React build)
