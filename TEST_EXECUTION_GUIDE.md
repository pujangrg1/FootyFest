# End-to-End Test Execution Guide

## Pre-Testing Setup

1. **Verify Firebase Configuration**
   - [ ] Check `firebase/config.js` has valid Firebase credentials
   - [ ] Verify Firebase project is active
   - [ ] Test Firebase connection

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the App**
   ```bash
   npm start
   # Or
   npx expo start
   ```

---

## Test Execution Steps

### Phase 1: Authentication Testing

#### Test 1.1: Organizer Signup & Login
1. Open app → Should show Login screen
2. Tap "Create an account"
3. Fill form:
   - Name: `Test Organizer`
   - Phone: `+1234567890`
   - Email: `test.organizer@test.com`
   - Password: `Test123!@#`
   - Role: Select **Organizer**
4. Tap "Sign Up"
5. **Expected**: Navigate to Organizer view (Tournaments tab)
6. Sign out
7. Login with same credentials
8. **Expected**: Email auto-filled, login successful

#### Test 1.2: Team Signup & Login
1. Sign out
2. Sign up with:
   - Email: `test.team@test.com`
   - Password: `Test123!@#`
   - Role: Select **Teams**
3. **Expected**: Navigate to Create Team screen
4. Sign out and login again
5. **Expected**: Navigate to Create Team screen (if no team) or Team Home

#### Test 1.3: Spectator Signup & Login
1. Sign out
2. Sign up with:
   - Email: `test.spectator@test.com`
   - Password: `Test123!@#`
   - Role: Select **Spectator**
3. **Expected**: Navigate to Spectator view
4. Sign out and login again
5. **Expected**: Navigate to Spectator view

#### Test 1.4: Auto-Login
1. Login successfully
2. Close app completely (force quit)
3. Reopen app
4. **Expected**: Automatically logged in, no login screen shown

---

### Phase 2: Organizer Role Testing

#### Test 2.1: Create Tournament
1. Login as Organizer
2. Navigate to "Create Tournament" tab
3. Fill all fields:
   - Tournament Name: `[TEST] Summer Cup 2024`
   - Location: `Test Stadium`
   - Start Date: Select future date
   - End Date: Select date after start date
   - Max Teams (Open): `4`
   - Max Teams (35+): `2`
   - Players per Team: `7`
   - Match Duration: `40`
   - Substitution Rules: `Rolling Substitutions`
   - Organizer Name: `Test Organizer`
   - Contact Email: `test@test.com`
4. Tap "Validate & Create Tournament"
5. **Expected**: 
   - Tournament created
   - Form cleared
   - Tournament appears in list

#### Test 2.2: View & Edit Tournament
1. Tap on tournament card
2. **Expected**: Navigate to Tournament Details
3. Go to Summary tab
4. Tap "Edit" button
5. Change tournament name to `[TEST] Summer Cup 2024 - Updated`
6. Save changes
7. **Expected**: Changes saved and displayed

#### Test 2.3: Add Teams
1. Go to Teams tab
2. Add teams to Open Category:
   - `[TEST] Team Alpha`
   - `[TEST] Team Beta`
   - `[TEST] Team Gamma`
   - `[TEST] Team Delta`
3. Add teams to 35+ Category:
   - `[TEST] Team Senior A`
   - `[TEST] Team Senior B`
4. Navigate to Matches tab, then back to Teams tab
5. **Expected**: All teams still present

#### Test 2.4: Generate Match Schedule (≤6 teams)
1. Go to Matches tab
2. Verify total teams = 6 (4 Open + 2 35+)
3. Tap "Generate Matches"
4. Confirm generation
5. **Expected**: 
   - Matches created (round-robin)
   - All teams play each other
   - Matches show "Tap to set date & time"

#### Test 2.5: Set Match Date/Time
1. Tap on a match card
2. Navigate to Match Details screen
3. Tap "Set Date" → Select date
4. Tap "Set Time" → Select time
5. Tap "Save Match Updates"
6. Navigate back to Matches tab
7. **Expected**: Match shows scheduled date/time

#### Test 2.6: Update Match Score & Events
1. Tap on a match in Matches tab
2. Update score: Team 1 = 2, Team 2 = 1
3. Change status to "live"
4. Add Goal:
   - Player: Select player
   - Minute: `15`
   - Team: Team 1
5. Add Card:
   - Player: Select player
   - Minute: `30`
   - Team: Team 2
   - Type: Yellow
6. Change status to "completed"
7. Save updates
8. **Expected**: 
   - Score updated
   - Events saved
   - Status changed

#### Test 2.7: View League Tables
1. Go to Tables tab
2. **Expected**: 
   - Positions show 0 (no completed matches yet)
   - No position highlighting
3. Complete 2-3 matches (set status to completed with scores)
4. Return to Tables tab
5. **Expected**:
   - Positions update (1, 2, 3...)
   - Points calculated correctly
   - Stats (P, W, D, L, GF, GA, PTS) correct
   - 1st, 2nd, 3rd place highlighted

#### Test 2.8: Delete Tournament
1. Go to Summary tab
2. Scroll to bottom
3. Tap "Delete Tournament"
4. Confirm deletion
5. **Expected**: Tournament removed from list

---

### Phase 3: Team Role Testing

#### Test 3.1: Create Team
1. Login as Team role
2. **Expected**: Create Team screen shown
3. Fill form:
   - Team Name: `[TEST] Thunder FC`
   - Year Established: `2020`
   - Description: `Test team description`
   - Manager: `Test Manager`
4. Add players:
   - Player 1: Name `John Doe`, Jersey `10`, Position `Forward`
   - Player 2: Name `Jane Smith`, Jersey `5`, Position `Defender`
   - Player 3: Name `Bob Johnson`, Jersey `1`, Position `Goalkeeper`
   - Add more players to reach at least 7
5. Tap "Create Team"
6. **Expected**: 
   - Team created
   - Navigate to Team Home (Squad tab)

#### Test 3.2: View & Manage Squad
1. Verify Squad tab shows:
   - Team logo placeholder
   - Team info (Manager, Year, Squad Size)
   - Players grouped by position
2. Tap "Add Player"
3. Add new player
4. **Expected**: Player added to squad
5. Remove a player
6. **Expected**: Player removed

#### Test 3.3: View Matches
1. Go to Matches tab
2. **Expected**: 
   - Shows tournaments team is in
   - Shows team's matches
   - Team name highlighted in green

#### Test 3.4: View Tables
1. Go to Tables tab
2. **Expected**: 
   - Shows team's position summary
   - Shows full standings
   - Team row highlighted

#### Test 3.5: Formation Generator
1. Go to Formation tab
2. **Expected**: 
   - Squad analysis displayed
   - Formation recommendations shown
3. Select a formation (e.g., 2-2-2)
4. **Expected**: 
   - Formation diagram displayed
   - Players auto-assigned
   - Lineup list shown
5. Swap two players
6. **Expected**: Players swapped, diagram updated
7. Move player to substitutes
8. **Expected**: Player moved, diagram updated

---

### Phase 4: Spectator Role Testing

#### Test 4.1: View Tournaments
1. Login as Spectator
2. Go to Tournaments tab
3. **Expected**: 
   - All tournaments displayed
   - Categorized as Live/Upcoming
   - Tournament cards show all details

#### Test 4.2: View Schedules
1. Go to Schedules tab
2. **Expected**: 
   - All matches from all tournaments
   - Sorted by scheduled time
   - Match cards formatted like Tournament view

#### Test 4.3: View Tables
1. Go to Tables tab
2. **Expected**: 
   - Standings for all tournaments
   - Separate Open and 35+ categories
   - Positions update based on completed matches

#### Test 4.4: Browse Teams
1. Go to Teams tab
2. **Expected**: 
   - Only teams in tournaments shown
   - Team cards with logos/info
3. Tap on a team
4. **Expected**: 
   - Team details shown
   - Full squad list displayed
   - Player photos shown (if available)

---

### Phase 5: Data Integrity Testing

#### Test 5.1: Persistence
1. Create tournament
2. Add teams
3. Generate matches
4. Close app completely
5. Reopen app
6. **Expected**: All data still present

#### Test 5.2: Standings Calculation
1. Complete matches with known scores:
   - Match 1: Team A 2-1 Team B
   - Match 2: Team A 1-1 Team C
   - Match 3: Team B 3-0 Team C
2. Check standings:
   - Team A: 4 points (1 win, 1 draw), 3 GF, 2 GA
   - Team B: 3 points (1 win, 1 loss), 4 GF, 2 GA
   - Team C: 1 point (1 draw, 1 loss), 1 GF, 4 GA
3. **Expected**: Standings match calculations

---

## Cleanup After Testing

1. **Delete Test Tournaments**
   - Go to each tournament with `[TEST]` prefix
   - Delete them using Delete Tournament button

2. **Delete Test Teams**
   - Login as Team role users
   - Delete test teams (if delete functionality exists)
   - Or manually delete from Firebase Console

3. **Delete Test Users** (Optional)
   - Use Firebase Console to delete test user accounts
   - Or keep for future testing

4. **Verify Production Data**
   - Ensure no production data was affected
   - Verify all `[TEST]` prefixed data is removed

---

## Known Issues to Check

- [ ] Date picker works on both iOS and Android
- [ ] Image upload works (team logos, player photos)
- [ ] Navigation doesn't show warnings
- [ ] No Redux serialization errors
- [ ] All data persists correctly
- [ ] Standings calculate accurately
- [ ] Formation generator works with various squad sizes

---

## Test Results

**Date:** ___________
**Tester:** ___________
**Environment:** iOS / Android / Both

**Total Tests:** ___
**Passed:** ___
**Failed:** ___
**Blocked:** ___

**Critical Issues:**
1. 
2. 
3. 

**Minor Issues:**
1. 
2. 
3. 

**Ready for Release:** ☐ Yes  ☐ No

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________


