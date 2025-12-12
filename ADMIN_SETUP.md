# Admin User Setup Guide

This guide explains how to create and manage admin users who can see all tournaments in the Footy Fest app.

## What is an Admin User?

Admin users have special privileges:
- **See all tournaments** created by any user (not just their own)
- **View organizer information** for each tournament
- **Full access** to all tournament data

## How to Set a User as Admin

### Method 1: Using the Script (Recommended)

1. **Find the user's UID or email:**
   - Go to Firebase Console → Authentication → Users
   - Find the user and copy their UID
   - Or use their email address

2. **Run the script:**
   ```bash
   node scripts/set-admin-user.js <user-uid-or-email>
   ```

   Examples:
   ```bash
   # Using UID
   node scripts/set-admin-user.js abc123xyz456
   
   # Using email
   node scripts/set-admin-user.js admin@footyfest.com
   ```

3. **Verify the change:**
   - The script will confirm if the user is now an admin
   - The user will see "Admin View" badge when they log in

### Method 2: Manual Setup via Firebase Console

1. **Open Firebase Console:**
   - Go to https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore:**
   - Click on "Firestore Database" in the left menu

3. **Find the user document:**
   - Go to the `users` collection
   - Find the user document (by UID)

4. **Update the role field:**
   - Click on the user document
   - Edit the `role` field
   - Change it from `"spectator"` or `"organizer"` to `"admin"`
   - Save the changes

## Verifying Admin Status

After setting a user as admin:

1. **The user should log out and log back in** (to refresh their role)
2. **Check the Tournament List screen:**
   - Title should say "All Tournaments (Admin)"
   - Green "Admin View" badge should appear
   - All tournaments from all users should be visible
   - Each tournament card shows the organizer's name (if available)

## Admin Features

### What Admins Can Do:
- ✅ **View all tournaments** created by any user
- ✅ **See organizer information** for each tournament
- ✅ **Edit any tournament** (update details, matches, teams, etc.)
- ✅ **Delete any tournament**
- ✅ **Manage teams** for any tournament
- ✅ **Full access** to all tournament data and management features

### Admin Privileges Summary:
Admins have full control over all tournaments in the system, not just their own. This includes:
- Creating, reading, updating, and deleting any tournament
- Managing matches and teams for any tournament
- Viewing all tournament data regardless of who created it

## Removing Admin Status

To remove admin status from a user:

1. **Using the script:**
   ```bash
   # You'll need to modify the script or use Firebase Console
   ```

2. **Using Firebase Console:**
   - Go to Firestore → `users` collection
   - Find the user document
   - Change `role` from `"admin"` to `"organizer"` or `"spectator"`

## Troubleshooting

### User doesn't see all tournaments after being set as admin:
- **Solution:** Have the user log out and log back in to refresh their role

### Script says "User not found":
- **Solution:** Make sure the user has signed up and has a document in the `users` collection
- Users are automatically created when they sign up

### Can't find user in Firestore:
- **Solution:** Check Firebase Console → Authentication to find the user's UID
- The user document in Firestore should have the same UID as the Authentication user

## Security Notes

⚠️ **Important Security Considerations:**

1. **Admin access is powerful** - Only grant admin status to trusted users
2. **Firestore Security Rules** - Make sure your Firestore rules allow users to read their own role:
   ```javascript
   match /users/{userId} {
     allow read: if request.auth != null && request.auth.uid == userId;
     allow write: if false; // Only allow writes via admin scripts/console
   }
   ```
3. **Regular Audits** - Periodically review who has admin access

## Future Enhancements

Potential admin features to add:
- Edit/delete any tournament
- Manage user accounts
- View system statistics
- Export tournament data
- Manage app settings

