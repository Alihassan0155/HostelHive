# Signup API Documentation

## Endpoint
`POST /api/auth/register`

## Request Body

### For Student:
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

### For Admin:
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

**Note for Admin:**
- If hostel exists: Uses existing hostel
- If hostel doesn't exist: Creates new hostel with provided details (address, totalRooms required)

## Response

### Success (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "uid": "firebase-user-id",
    "email": "ali@gmail.com",
    "customToken": "firebase-custom-token",
    "userData": {
      "id": "firebase-user-id",
      "name": "Ali Hassan",
      "firstName": "Ali",
      "lastName": "Hassan",
      "email": "ali@gmail.com",
      "role": "student",
      "hostelId": "hostel-id",
      "roomNumber": "A101",
      ...
    }
  }
}
```

### Error - Hostel Not Found (404) - Student:
```json
{
  "success": false,
  "message": "Hostel \"Hostel Name\" not found. Please check the hostel name."
}
```

### Error - Hostel Not Found (400) - Admin:
```json
{
  "success": false,
  "message": "Hostel \"Hostel Name\" not found. Please provide hostel details: address and totalRooms are required to create a new hostel."
}
```

## Behavior

### Student Signup:
1. User provides `hostelName`
2. System searches for hostel by name
3. If found: Gets hostel ID and stores in user record
4. If not found: Returns 404 error

### Admin Signup:
1. User provides `hostelName`
2. System searches for hostel by name
3. If found: Uses existing hostel ID
4. If not found: 
   - Requires `hostelAddress` and `hostelTotalRooms`
   - Creates new hostel
   - Sets admin as the hostel admin
   - Stores hostel ID in user record

