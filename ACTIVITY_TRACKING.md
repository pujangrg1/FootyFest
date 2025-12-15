# User Activity Tracking

This document describes the user activity tracking system implemented in the Footy Fest app.

## Overview

The activity tracking system automatically logs user authentication events (logins, signups, logouts) and role changes to Firestore. This data can be viewed by administrators for analytics and security purposes.

## What Gets Tracked

### 1. User Signups
- **When**: Every time a new user account is created
- **Data Captured**:
  - User ID and email
  - Display name
  - Roles assigned
  - Signup method (email or phone)
  - Timestamp

### 2. User Logins
- **When**: Every time a user successfully logs in
- **Data Captured**:
  - User ID and email
  - Login method (email or phone)
  - Platform (web, ios, android)
  - Timestamp
  - Last login timestamp is also updated in the user document

### 3. User Logouts
- **When**: Every time a user signs out
- **Data Captured**:
  - User ID and email
  - Platform
  - Timestamp

### 4. Role Changes
- **When**: When a user's roles are updated (e.g., adding organizer role to existing user)
- **Data Captured**:
  - User ID and email
  - Previous roles
  - New roles
  - Timestamp

## Firestore Structure

### Collection: `user_activity`

Each document contains:
```javascript
{
  userId: string,           // User's UID
  email: string,           // User's email
  activityType: string,    // 'login', 'signup', 'logout', 'role_change'
  metadata: {              // Additional context
    method: string,        // 'email' or 'phone'
    platform: string,      // 'web', 'ios', 'android'
    roles: array,          // For signups/role changes
    displayName: string,   // For signups
    previousRoles: array,  // For role changes
    newRoles: array,       // For role changes
  },
  timestamp: Timestamp,     // Firestore server timestamp
  createdAt: string,       // ISO string timestamp (fallback)
}
```

### User Document Updates

The `users` collection is also updated with:
- `lastLoginAt`: Firestore timestamp of last login
- `lastLoginAtISO`: ISO string of last login (for easier querying)

## Accessing Activity Logs

### For Administrators

1. **Via UI**: 
   - Navigate to the Tournaments screen (as admin)
   - Click the "View Activity Logs" button
   - View logs by category: Logins, Signups, or Statistics

2. **Via Code**:
   ```javascript
   import { getAllLoginLogs, getAllSignupLogs, getActivityStats } from './services/activityLog';
   
   // Get all login logs
   const loginLogs = await getAllLoginLogs(100);
   
   // Get all signup logs
   const signupLogs = await getAllSignupLogs(100);
   
   // Get activity statistics
   const stats = await getActivityStats();
   ```

## Security Rules

Add these Firestore security rules to protect activity logs:

```javascript
match /user_activity/{activityId} {
  // Users can only read their own activity
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  
  // Only authenticated users can write (system writes)
  allow write: if request.auth != null;
  
  // Admins can read all activity
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin']);
}
```

## Privacy Considerations

- Activity logs contain user email addresses and timestamps
- Only administrators should have access to all logs
- Users can view their own activity logs
- Consider implementing data retention policies (e.g., delete logs older than 1 year)

## Performance Considerations

- Activity logging is asynchronous and won't block authentication flows
- If logging fails, it won't prevent users from logging in
- Logs are indexed by `userId` and `activityType` for efficient querying
- Consider implementing pagination for large log queries

## Future Enhancements

Potential improvements:
- Export logs to CSV/JSON
- Email notifications for suspicious activity
- Activity graphs and charts
- Filter logs by date range
- Search logs by user email
- Automatic cleanup of old logs

