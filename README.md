# Graduation Project Management System - Backend

## Overview

The Graduation Project Management System is a web-based platform developed to support the management and monitoring of university graduation projects.

The system enables students, supervisors, and administrators to collaborate efficiently throughout the graduation project lifecycle, including team formation, supervisor assignment, task management, project file sharing, progress monitoring, and presentation scheduling.

This repository contains the backend API built with Node.js, Express.js, MongoDB, and JWT authentication.

---

## Features

### Authentication
- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes

### Student Features
- Create a graduation project
- Join an existing project using a team code
- View project details
- View project members
- Create and manage project tasks
- Upload and manage project files

### Supervisor Features
- View assigned projects
- View supervised students
- Manage availability status
- Set maximum project capacity
- Monitor project progress
- Review team tasks
- Schedule final presentations

### Admin Features
- View all users
- Delete users
- View all projects
- Manage platform data

### Task Management
- Create tasks
- Assign tasks to project members
- Update task progress and status
- Delete tasks
- Automated reminder support

### File Management
- Upload project files
- View project files
- Download files
- Delete files
- Google Drive integration for storage

### Dashboard
- Project statistics
- Progress monitoring
- Team activity overview

---

## Technology Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication & Security
- JSON Web Tokens (JWT)
- bcrypt

### File Storage
- Multer
- Google Drive API

### Email Services
- Nodemailer

### Scheduled Tasks
- node-cron

---

## Project Structure

```text
graduation-backend/
│
├── controllers/
│   ├── dashboardController.js
│   ├── projectController.js
│   ├── projectFilesController.js
│   ├── supervisorController.js
│   ├── taskController.js
│   └── userController.js
│
├── middleware/
│   ├── adminMiddleware.js
│   ├── supervisorMiddleware.js
│   ├── verifyToken.js
│   └── upload.js
│
├── models/
│   ├── User.js
│   ├── Project.js
│   ├── ProjectFile.js
│   └── Task.js
│
├── routes/
│   ├── dashboardRoutes.js
│   ├── projectFilesRoutes.js
│   ├── projectRoutes.js
│   ├── supervisorRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js
│
├── jobs/
│   └── reminderJob.js
│
├── services/
│   └── drive.service.js
│
├── utils/
│   ├── generateCode.js
│   ├── mailer.js
│   └── response.js
│
├── server.js
├── package.json
└── .gitignore
```

---

## System Workflow

1. Users register and log in using secure authentication.
2. Students can create a graduation project or join an existing team.
3. Project leaders invite team members using generated team codes.
4. Students select an available supervisor.
5. Supervisors manage project supervision and monitor progress.
6. Team members collaborate through task management and file sharing.
7. Final presentations are scheduled and tracked within the system.

---

## Installation

### Prerequisites

Before running the application, make sure you have:

- Node.js (v18+ recommended)
- MongoDB Database
- Google Drive API credentials (for file storage)

### Clone the Repository

```bash
git clone https://github.com/mohammedh897/graduation-backend.git
cd graduation-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

GOOGLE_CLIENT_EMAIL=your_google_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
```

### Run the Application

Development:

```bash
npm run dev
```

Production:

```bash
node server.js
```

The server will run on:

```text
http://localhost:5000
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /register | Register a new user |
| POST | /login | User login |

---

### Projects

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /projects/create | Create a new project |
| POST | /projects/join | Join a project using team code |
| GET | /projects/my-project | Get current project |
| GET | /projects/members | Get project members |
| PUT | /projects/:projectId/final-presentation | Schedule presentation |
| GET | /projects/:projectId/final-presentation | View presentation details |

---

### Tasks

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /task | Create task |
| GET | /tasks | Get project tasks |
| PUT | /task/:id | Update task |
| DELETE | /task/:id | Delete task |

---

### Supervisors

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /supervisors/available | List available supervisors |
| PUT | /supervisors/status | Update supervisor status |
| PUT | /supervisors/max-projects | Set project capacity |
| GET | /supervisors/projects | Get assigned projects |
| GET | /supervisors/students | Get supervised students |
| GET | /supervisors/team/:projectId | Get project team |
| GET | /supervisors/tasks/:projectId | Get project tasks |

---

### Dashboard

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /dashboard | Dashboard statistics |

---

### File Management

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /api/projects/:projectId/files/upload | Upload file |
| GET | /api/projects/:projectId/files/list | List project files |
| GET | /api/projects/:projectId/files/:id/download | Download file |
| DELETE | /api/projects/:projectId/files/:id/delete | Delete file |

---

## Database Models

### User

| Field | Description |
|---------|-------------|
| username | User name |
| email | User email |
| password | Hashed password |
| userType | Student or Supervisor |
| isAdmin | Admin privileges |
| status | Supervisor availability |
| maxProjects | Maximum supervised projects |
| currentProjects | Current assigned projects |

### Project

| Field | Description |
|---------|-------------|
| projectName | Project title |
| description | Project description |
| supervisor | Assigned supervisor |
| leader | Team leader |
| members | Project members |
| teamCode | Invitation code |
| status | Project status |
| finalPresentation | Presentation details |

### Task

| Field | Description |
|---------|-------------|
| title | Task title |
| description | Task details |
| assignedBy | Creator |
| assignedTo | Assigned member |
| status | Task status |
| progress | Completion percentage |
| dueDate | Deadline |
| reminderDate | Reminder schedule |

### ProjectFile

| Field | Description |
|---------|-------------|
| projectId | Associated project |
| uploadedBy | Uploader |
| fileName | File name |
| driveFileId | Google Drive ID |
| uploadedAt | Upload date |

---

## Security Features

- JWT Authentication
- Password Hashing with bcrypt
- Role-Based Authorization
- Protected API Routes
- Environment Variable Configuration
- Secure File Upload Handling

---

## Future Enhancements

- Real-time notifications
- In-app messaging system
- Supervisor evaluation module
- Project milestone tracking
- Analytics and reporting dashboard
- Real-time collaboration features
- Project grading system

---

## Contributors

### Graduation Project Team

- Mohammed Hussein
- Graduation Project Team Members

---

## License

This project was developed as part of a Computer Engineering Graduation Project for educational and academic purposes.

---

## Author

**Mohammed Hussein**

Computer Engineering Graduate

For any additional questions, please contact **Mohammed Hussein** via [LinkedIn](https://www.linkedin.com/in/mohd-husein/).

---
