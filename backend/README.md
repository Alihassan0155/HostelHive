# HostelHelp Backend API

Backend API for HostelHelp - A comprehensive hostel maintenance management system.

## Features

- 🔐 Firebase Authentication & Authorization
- 👥 Multi-role support (Student, Admin, Worker)
- 🎫 Issue tracking and management
- 👷 Worker scheduling and assignment
- ⭐ Rating and feedback system
- 🔔 Real-time notifications
- 📊 Analytics and reporting

## Tech Stack

- Node.js + Express
- Firebase Admin SDK (Firestore)
- Express Validator
- CORS, Helmet, Morgan

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Firebase credentials:
```bash
cp .env.example .env
```

3. Download your Firebase service account key and place it in the project root, or configure environment variables.

4. Start the server:
```bash
npm run dev  # Development mode
npm start    # Production mode
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Hostels
- `GET /api/hostels` - Get all hostels
- `GET /api/hostels/:id` - Get hostel by ID
- `POST /api/hostels` - Create hostel (Admin only)
- `PUT /api/hostels/:id` - Update hostel (Admin only)
- `DELETE /api/hostels/:id` - Delete hostel (Admin only)

### Issues
- `GET /api/issues` - Get issues (filtered by role)
- `GET /api/issues/:id` - Get issue by ID
- `POST /api/issues` - Create new issue (Student)
- `PUT /api/issues/:id` - Update issue
- `PUT /api/issues/:id/assign` - Assign worker (Admin)
- `PUT /api/issues/:id/status` - Update status (Worker/Admin)
- `PUT /api/issues/:id/confirm` - Confirm fix (Student)

### Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker by ID
- `GET /api/workers/:id/availability` - Get worker availability
- `PUT /api/workers/:id/availability` - Update availability

### Ratings
- `GET /api/ratings` - Get ratings
- `GET /api/ratings/:id` - Get rating by ID
- `POST /api/ratings` - Create rating (Student)
- `GET /api/workers/:id/ratings` - Get worker ratings

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

## Project Structure

```
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## License

ISC

