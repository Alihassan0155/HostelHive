# HostelHelp Backend File Structure

Complete backend file structure for the HostelHelp project.

```
HostelHive/
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Node.js dependencies and scripts
├── README.md                    # Project documentation
├── BACKEND_STRUCTURE.md         # This file - structure documentation
│
└── src/
    ├── server.js                # Main server entry point
    │
    ├── config/                   # Configuration files
    │   ├── firebase.js          # Firebase Admin SDK initialization
    │   └── constants.js         # Application constants (roles, statuses, etc.)
    │
    ├── middleware/              # Express middleware
    │   ├── auth.js             # Authentication & authorization middleware
    │   ├── errorHandler.js     # Global error handling
    │   └── validator.js        # Request validation middleware
    │
    ├── models/                  # Data models/schemas
    │   ├── User.js             # User model
    │   ├── Hostel.js           # Hostel model
    │   ├── Issue.js            # Issue model
    │   ├── Rating.js           # Rating model
    │   └── Notification.js     # Notification model
    │
    ├── services/                # Business logic layer
    │   ├── userService.js      # User business logic
    │   ├── hostelService.js    # Hostel business logic
    │   ├── issueService.js     # Issue business logic
    │   ├── ratingService.js    # Rating business logic
    │   └── notificationService.js  # Notification business logic
    │
    ├── controllers/             # Request handlers
    │   ├── userController.js   # User request handlers
    │   ├── hostelController.js # Hostel request handlers
    │   ├── issueController.js  # Issue request handlers
    │   ├── ratingController.js # Rating request handlers
    │   └── notificationController.js  # Notification request handlers
    │
    ├── routes/                  # API route definitions
    │   ├── index.js            # Route aggregator
    │   ├── auth.js             # Authentication routes
    │   ├── users.js            # User routes
    │   ├── hostels.js          # Hostel routes
    │   ├── issues.js           # Issue routes
    │   ├── ratings.js          # Rating routes
    │   └── notifications.js    # Notification routes
    │
    └── utils/                   # Utility functions
        └── helpers.js          # Helper functions (tracking numbers, pagination, etc.)
```

## Collection Structure

### Firestore Collections

1. **users** - All users (students, admins, workers)
2. **hostels** - Hostel information
3. **issues** - Reported maintenance issues
4. **ratings** - Worker ratings and feedback
5. **notifications** - User notifications

## API Endpoints Overview

### Authentication
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/hostels/:hostelId/workers` - Get workers by hostel
- `GET /api/users/skills/:skill/workers` - Get workers by skill
- `PUT /api/users/:id/availability` - Update worker availability
- `PUT /api/users/:id/status` - Set worker status

### Hostels
- `GET /api/hostels` - Get all hostels
- `GET /api/hostels/:id` - Get hostel by ID
- `POST /api/hostels` - Create hostel (Admin)
- `PUT /api/hostels/:id` - Update hostel (Admin)
- `DELETE /api/hostels/:id` - Delete hostel (Admin)
- `POST /api/hostels/:id/workers` - Add worker to hostel (Admin)
- `DELETE /api/hostels/:id/workers` - Remove worker from hostel (Admin)

### Issues
- `GET /api/issues` - Get issues (filtered by role)
- `GET /api/issues/urgent` - Get urgent issues
- `GET /api/issues/:id` - Get issue by ID
- `POST /api/issues` - Create issue (Student)
- `PUT /api/issues/:id` - Update issue
- `PUT /api/issues/:id/assign` - Assign worker (Admin)
- `PUT /api/issues/:id/status` - Update status (Worker/Admin)
- `PUT /api/issues/:id/confirm` - Confirm fix (Student)
- `PUT /api/issues/:id/update` - Add worker update (Worker)

### Ratings
- `GET /api/ratings` - Get ratings
- `GET /api/ratings/:id` - Get rating by ID
- `POST /api/ratings` - Create rating (Student)
- `GET /api/ratings/workers/:id/average` - Get worker average rating
- `PUT /api/ratings/:id` - Update rating
- `DELETE /api/ratings/:id` - Delete rating (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Key Features

1. **Role-Based Access Control** - Students, Admins, and Workers have different permissions
2. **Issue Tracking** - Complete workflow from reporting to confirmation
3. **Worker Scheduling** - Availability management and assignment
4. **Notifications** - Real-time updates for all parties
5. **Rating System** - Feedback and ratings for workers
6. **Validation** - Comprehensive input validation
7. **Error Handling** - Centralized error handling
8. **Security** - Helmet, CORS, and authentication middleware

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure Firebase credentials
3. Start server: `npm run dev` (development) or `npm start` (production)
4. API will be available at `http://localhost:3000/api`

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase Admin SDK** - Backend services (Firestore, Auth)
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Compression** - Response compression

