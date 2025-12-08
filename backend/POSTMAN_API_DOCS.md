# HostelHelp API Documentation for Postman

Base URL: `http://localhost:3000/api`

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## 🔐 Authentication Endpoints

### 1. Register (Signup)
**POST** `/auth/register`

**Request Body (Student):**
```json
{
  "email": "ali@gmail.com",
  "password": "password123",
  "firstName": "Ali",
  "lastName": "Hassan",
  "role": "student",
  "hostelName": "Hostel A",
  "roomNumber": "A101"
}
```

**Request Body (Admin):**
```json
{
  "email": "admin@gmail.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "hostelName": "Hostel A",
  "hostelAddress": "123 Main St, City",
  "hostelTotalRooms": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "uid": "firebase-uid",
    "email": "ali@gmail.com",
    "customToken": "custom-token",
    "userData": { ... }
  }
}
```

---

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "idToken": "firebase-id-token-from-client"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "firebase-uid",
    "email": "ali@gmail.com",
    "userData": { ... }
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "firebase-uid",
    "email": "ali@gmail.com",
    "userData": { ... }
  }
}
```

---

### 4. Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👥 User Endpoints

### 1. Get All Users (Admin Only)
**GET** `/users?role=student&hostelId=h001&page=1&limit=20`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `role` (optional): Filter by role (student/admin/worker)
- `hostelId` (optional): Filter by hostel
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### 2. Get User by ID
**GET** `/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Update User
**PUT** `/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "roomNumber": "A102"
}
```

---

### 4. Delete User (Admin Only)
**DELETE** `/users/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

---

### 5. Get Workers by Hostel
**GET** `/users/hostels/:hostelId/workers`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 6. Get Workers by Skill
**GET** `/users/skills/:skill/workers`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `/users/skills/electrical/workers`

---

### 7. Update Worker Availability
**PUT** `/users/:id/availability`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "availability": {
    "Monday": ["10:00-12:00", "14:00-16:00"],
    "Tuesday": ["09:00-11:00"]
  }
}
```

---

### 8. Set Worker Status
**PUT** `/users/:id/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isAvailable": true
}
```

---

## 🏢 Hostel Endpoints

### 1. Get All Hostels
**GET** `/hostels`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 2. Get Hostel by ID
**GET** `/hostels/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Create Hostel (Admin Only)
**POST** `/hostels`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Hostel A",
  "address": "123 Main St, City",
  "totalRooms": 50,
  "adminId": "admin-user-id"
}
```

---

### 4. Update Hostel (Admin Only)
**PUT** `/hostels/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Updated Hostel Name",
  "address": "New Address",
  "totalRooms": 60
}
```

---

### 5. Delete Hostel (Admin Only)
**DELETE** `/hostels/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

---

### 6. Add Worker to Hostel (Admin Only)
**POST** `/hostels/:id/workers`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "workerId": "worker-user-id"
}
```

---

### 7. Remove Worker from Hostel (Admin Only)
**DELETE** `/hostels/:id/workers`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "workerId": "worker-user-id"
}
```

---

## 🎫 Issue Endpoints

### 1. Get Issues
**GET** `/issues?status=pending&type=electrical&urgency=urgent&page=1&limit=20`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): pending, assigned, in_progress, completed, closed
- `type` (optional): electrical, plumbing, cleaning, furniture, internet, other
- `urgency` (optional): urgent, schedule
- `hostelId` (optional): Filter by hostel (Admin only)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Note:** 
- Students see only their own issues
- Workers see only assigned issues
- Admins see all issues in their hostel

---

### 2. Get Urgent Issues
**GET** `/issues/urgent`

**Headers:**
```
Authorization: Bearer <admin-or-worker-token>
```

---

### 3. Get Issue by ID
**GET** `/issues/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 4. Create Issue (Student Only)
**POST** `/issues`

**Headers:**
```
Authorization: Bearer <student-token>
```

**Request Body:**
```json
{
  "title": "AC not cooling",
  "description": "AC making noise, not cooling properly",
  "type": "electrical",
  "urgency": "urgent",
  "hostelId": "h001",
  "roomNumber": "A101",
  "photos": ["url1", "url2"],
  "scheduledTime": "2025-12-07T10:00:00Z"
}
```

**Note:** `scheduledTime` is required if `urgency` is "schedule"

---

### 5. Update Issue
**PUT** `/issues/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress"
}
```

---

### 6. Assign Worker to Issue (Admin Only)
**PUT** `/issues/:id/assign`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "workerId": "worker-user-id",
  "scheduledTime": "2025-12-07T10:00:00Z"
}
```

---

### 7. Update Issue Status
**PUT** `/issues/:id/status`

**Headers:**
```
Authorization: Bearer <worker-or-admin-token>
```

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Valid statuses:** pending, assigned, in_progress, completed, closed

---

### 8. Confirm Issue Fix (Student Only)
**PUT** `/issues/:id/confirm`

**Headers:**
```
Authorization: Bearer <student-token>
```

**Request Body:**
```json
{
  "isFixed": true
}
```

---

### 9. Add Worker Update (Worker Only)
**PUT** `/issues/:id/update`

**Headers:**
```
Authorization: Bearer <worker-token>
```

**Request Body:**
```json
{
  "notes": "Replaced capacitor, AC working now",
  "photos": ["url1", "url2"]
}
```

---

## ⭐ Rating Endpoints

### 1. Get Ratings
**GET** `/ratings?workerId=w001&issueId=i001&studentId=s001&page=1&limit=20`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `workerId` (optional): Filter by worker
- `issueId` (optional): Filter by issue
- `studentId` (optional): Filter by student
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### 2. Get Rating by ID
**GET** `/ratings/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Create Rating (Student Only)
**POST** `/ratings`

**Headers:**
```
Authorization: Bearer <student-token>
```

**Request Body:**
```json
{
  "issueId": "i001",
  "rating": 5,
  "feedback": "Worker fixed the issue quickly and efficiently!"
}
```

---

### 4. Get Worker Average Rating
**GET** `/ratings/workers/:id/average`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "average": 4.5,
    "count": 10,
    "ratings": [ ... ]
  }
}
```

---

### 5. Update Rating
**PUT** `/ratings/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Updated feedback"
}
```

---

### 6. Delete Rating (Admin Only)
**DELETE** `/ratings/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

---

## 🔔 Notification Endpoints

### 1. Get User Notifications
**GET** `/notifications?read=false&limit=50`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `read` (optional): true/false to filter by read status
- `limit` (optional): Number of notifications

---

### 2. Get Unread Count
**GET** `/notifications/unread/count`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 3. Mark Notification as Read
**PUT** `/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 4. Mark All Notifications as Read
**PUT** `/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 5. Delete Notification
**DELETE** `/notifications/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 📊 Health Check

### Health Check
**GET** `/health`

**No authentication required**

**Response:**
```json
{
  "success": true,
  "message": "HostelHelp API is running",
  "timestamp": "2025-12-06T10:00:00.000Z"
}
```

---

## Testing Tips

1. **Get Firebase Token for Testing:**
   - Use the `/auth/register` endpoint first
   - Or use Firebase Console to create a test user
   - Get the ID token from Firebase Auth SDK

2. **For Postman:**
   - Set base URL: `http://localhost:3000/api`
   - Add Authorization header: `Bearer <token>`
   - Use JSON body for POST/PUT requests

3. **Common Test Flow:**
   - Register a user → Get token
   - Use token for authenticated requests
   - Create hostel (admin)
   - Create issue (student)
   - Assign worker (admin)
   - Update status (worker)
   - Confirm fix (student)
   - Rate worker (student)

