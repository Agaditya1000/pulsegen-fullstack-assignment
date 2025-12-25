# StreamSure - Video Upload & Streaming Application

A comprehensive full-stack application for video uploading, sensitivity processing, and streaming.

## Project Structure
- `backend/`: Node.js + Express + MongoDB + Socket.io
- `frontend/`: React + Vite + Tailwind CSS

## Prerequisites
- Node.js installed
- MongoDB URI (configured in `backend/.env`)

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder and install dependencies (if not already done):
```bash
cd backend
npm install
```

Start the backend server:
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 2. Frontend Setup
Navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

## Features
- **Authentication**: Register and Login (Viewer, Editor, Admin).
- **Video Upload**: Upload videos with progress tracking (Editor/Admin).
- **Processing**: Simulated sensitivity analysis with real-time updates.
- **Streaming**: Stream uploaded videos.
- **Dashboard**: View safe videos and their status.
