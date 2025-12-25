# StreamSure - Secure Video Streaming & Management Platform

StreamSure is a full-stack MERN application for uploading, managing, and streaming video content with robust Role-Based Access Control (RBAC) and an automated processing pipeline.

## 🚀 Key Features

*   **✨ Premium UI/UX:**
    *   Modern **Glassmorphism Design** with ambient lighting and blur effects.
    *   Fully Responsive Layout with smooth transitions and animations.
    *   Interactive Hero Section for landing page.
*   **🛡️ Role-Based Access Control (RBAC):**
    *   **Admin:** Full system control, User Management, Content Moderation, System Settings.
    *   **Editor:** Complete Video Lifecycle Management:
        *   **Upload** & **Delete** videos.
        *   **Edit Details:** Title, Description, Visibility.
        *   **Replace Content:** Update video files without losing metadata.
        *   **Access Control:** Assign private videos to specific users.
    *   **Viewer:** Read-only access to Public videos or specifically assigned Private videos.
*   **🎬 Video Processing Pipeline:**
    *   **Upload Validation:** Strict checks for video file types and 100MB size limit.
    *   **Automated Processing:** Metadata extraction, AI Sensitivity Analysis (simulated), and Transcoding (simulated).
    *   **Real-time Updates:** Push notifications for processing status via Socket.io.
*   **Secure Streaming:**
    *   Internal streaming API supporting HTTP Range requests for smooth playback.
    *   Privacy checks for restricted content.
*   **Admin Dashboard:**
    *   User Management (List, Delete, Change Role).
    *   System Settings (Maintenance Mode, Registration Control).
    *   Stats Overview.
*   **Advanced Filtering:**
    *   Search by Title.
    *   Filter by Status (Safe, Flagged).

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS v4, Socket.io-client, Lucide React.
*   **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, Multer.
*   **Testing:** Jest, Supertest.

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*   Create a `.env` file in `backend/`:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Testing
Run the backend integration tests:
```bash
cd backend
npm test
```

## 👥 Usage Guide

### User Roles
1.  **Register** a new account. By default, it will be a **Viewer**.
2.  **Admin Access**: Manually change your role in the database or use the provided seed credentials (if applicable).
3.  **Uploading (Editor/Admin)**:
    *   Navigate to Dashboard -> Upload Video.
    *   Select file, add Title/Description.
    *   Toggle "Make Public" for general visibility.
4.  **Admin Panel**:
    *   Navigate to `/admin` (via Navbar profile icon).
    *   Manage users and system configurations.

## 🧪 Testing

We use Jest and Supertest for backend integration testing.
To run tests: `npm test` inside the `backend` directory.

## 📁 Project Structure

```
├── backend/
│   ├── controllers/   # Business logic (Video, User, Settings)
│   ├── middleware/    # Auth, Role Checks, Upload
│   ├── models/        # MongoDB Schemas
│   ├── routes/        # API Endpoints
│   ├── tests/         # Integration Tests
│   └── uploads/       # Video storage
└── frontend/
    ├── src/
    │   ├── components/# Reusable UI (Navbar, Player)
    │   ├── context/   # Auth Context
    │   ├── pages/     # Dashboard, AdminPanel, Login
    │   └── ...
```

## 📜 License
Unlicensed (Assignment Project)
