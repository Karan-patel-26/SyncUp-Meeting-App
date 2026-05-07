# 🌌 SyncUp - Enterprise AI Video Conferencing

SyncUp is a premium, real-time video conferencing platform built with the MERN stack, featuring AI-driven intelligence, distributed state persistence, and enterprise-grade security.

![SyncUp Demo](./frontend/public/demo.png)

## 🚀 Core Features

### 🤖 AI-Powered Intelligence
- **Real-time Transcription**: Powered by Web Speech API.
- **AI Meeting Summaries**: Automated post-meeting summaries and action item extraction using **Google Gemini Pro**.
- **Visual Effects**: AI-driven silhouette detection for background blur and virtual backgrounds using **MediaPipe Selfie Segmentation**.

### 🛠 Collaborative Tools
- **Shared Interactive Notes**: Real-time collaborative text editor with **React-Quill**.
- **Interactive Whiteboard**: Multi-user drawing canvas for visual brainstorming.
- **Persistent State**: Notes and whiteboard states are persisted via **Redis**, ensuring they survive server restarts.

### 🛡 Enterprise Security
- **Encrypted Credentials**: Password protection for rooms using **bcryptjs**.
- **Host Control**: Dedicated Waiting Rooms with Admit/Deny controls.
- **Production Hardened**: Rate limiting, security headers (Helmet), and request logging (Winston).

## 💻 Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Lucide Icons, Vanilla CSS (Glassmorphism).
- **Backend**: Node.js, Express, Socket.io (Signaling), MongoDB (Data), Redis (Caching).
- **Media**: WebRTC (P2P), Cloudinary (Recording storage).
- **AI**: Google Generative AI, MediaPipe.

## 📦 Getting Started

### 1. Prerequisites
- Node.js 20+
- MongoDB
- Redis Server
- Cloudinary Account
- Gemini API Key

### 2. Environment Setup
Create a `.env` file in the `backend/` directory (see `.env.example`):
```env
MONGODB_URI=your_uri
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

### 3. Installation & Run
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 🐳 Docker Deployment
You can spin up the entire production stack using Docker Compose:
```bash
docker-compose up --build
```
This will launch the Frontend (Nginx), Backend, MongoDB, and Redis containers.

## 🧪 Testing
```bash
# End-to-End Tests
npm run test:e2e

# Performance Load Test
npm run test:perf
```

---
Built with ❤️ for the future of remote collaboration.
