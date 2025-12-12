# Footy Fest App - End-to-End Test Checklist

## Test Environment Setup
- [ ] Firebase is properly configured
- [ ] App builds and runs without errors
- [ ] All dependencies are installed

---

## 1. Authentication Tests

### 1.1 Signup Flow
- [ ] **Organizer Signup**
  - [ ] Navigate to Signup screen
  - [ ] Select "Organizer" role
  - [ ] Fill in all required fields (Name, Phone, Email, Password)
  - [ ] Submit signup
  - [ ] Verify user is created in Firebase Auth
  - [ ] Verify user document is created in Firestore with correct role
  - [ ] Verify navigation to Organizer view (Tournaments tab)

- [ ] **Team Signup**
  - [ ] Sign out
  - [ ] Navigate to Signup screen
  - [ ] Select "Teams" role
  - [ ] Fill in all required fields
  - [ ] Submit signup
  - [ ] Verify navigation to Team view (Create Team screen if no team exists)

- [ ] **Spectator Signup**
  - [ ] Sign out
  - [ ] Navigate to Signup screen
  - [ ] Select "Spectator" role
  - [ ] Fill in all required fields
  - [ ] Submit signup
  - [ ] Verify navigation to Spectator view

### 1.2 Login Flow
- [ ] **Email/Password Login**
  - [ ] Sign out
  - [ ] Navigate to Login screen
  - [ ] Enter email and password
  - [ ] Submit login
  - [ ] Verify successful login
  - [ ] Verify navigation to correct role view

- [ ] **Email Remembering**
  - [ ] Sign out
  - [ ] Navigate to Login screen
  - [ ] Verify email is auto-filled (if previously logged in)
  - [ ] Enter password only
  - [ ] Verify login works

- [ ] **Auto-login**
  - [ ] Login successfully
  - [ ] Close app completely
  - [ ] Reopen app
  - [ ] Verify user is automatically logged in
  - [ ] Verify navigation to correct role view without showing login screen

### 1.3 Sign Out
- [ ] Click sign out button
- [ ] Verify confirmation dialog appears
- [ ] Confirm sign out
- [ ] Verify navigation to login screen
- [ ] Verify user is signed out from Firebase

---

## 2. Organizer Role Tests

### 2.1 Tournament Management
- [ ] **Create Tournament**
  - [ ] Navigate to "Create Tournament" tab
  - [ ] Fill in all required fields:
    - Tournament Name
    - Location/Venue
    - Start Date
    - End Date
    - Max Teams (Open)
    - Max Teams (35+)
    - Players per Team
    - Match Duration
    - Substitution Rules
    - Organizer Name
    - Contact Email
  - [ ] Submit tournament creation
  - [ ] Verify tournament appears in "Tournaments" list
  - [ ] Verify form is cleared after submission

- [ ] **View Tournament List**
  - [ ] Verify all created tournaments are displayed
  - [ ] Verify tournament cards show:
    - Tournament name
    - Start date
    - End date
    - Total teams in Open
    - Total teams in 35+
    - Venue
    - Duration
  - [ ] Verify card styling (dark background, purple border)

- [ ] **View Tournament Details**
  - [ ] Tap on a tournament card
  - [ ] Verify navigation to Tournament Details screen
  - [ ] Verify all tabs are visible (Summary, Teams, Matches, Tables)

### 2.2 Tournament Details - Summary Tab
- [ ] **View Summary**
  - [ ] Verify all tournament fields are displayed correctly
  - [ ] Verify data matches what was entered during creation

- [ ] **Edit Tournament**
  - [ ] Click "Edit" button
  - [ ] Modify tournament fields
  - [ ] Save changes
  - [ ] Verify changes are persisted
  - [ ] Verify updated data is displayed

- [ ] **Delete Tournament**
  - [ ] Scroll to bottom of Summary tab
  - [ ] Click "Delete Tournament" button
  - [ ] Verify confirmation dialog appears
  - [ ] Confirm deletion
  - [ ] Verify tournament is removed from list
  - [ ] Verify navigation back to tournament list

### 2.3 Tournament Details - Teams Tab
- [ ] **Add Teams to Open Category**
  - [ ] Navigate to Teams tab
  - [ ] Enter team name in "Open Category" section
  - [ ] Click "Add" button
  - [ ] Verify team appears in the list
  - [ ] Add multiple teams
  - [ ] Verify all teams are displayed

- [ ] **Add Teams to 35+ Category**
  - [ ] Enter team name in "35+ Category" section
  - [ ] Click "Add" button
  - [ ] Verify team appears in the list

- [ ] **Remove Teams**
  - [ ] Click remove button (X) on a team
  - [ ] Verify team is removed from list

- [ ] **Team Persistence**
  - [ ] Add teams
  - [ ] Navigate to another tab (Matches)
  - [ ] Navigate back to Teams tab
  - [ ] Verify teams are still present (not removed)

- [ ] **Shareable Link**
  - [ ] Verify shareable link is displayed
  - [ ] Verify link can be copied
  - [ ] Verify link can be shared

### 2.4 Tournament Details - Matches Tab
- [ ] **Generate Schedule (≤6 teams)**
  - [ ] Ensure tournament has ≤6 teams total
  - [ ] Click "Generate Matches" button
  - [ ] Verify confirmation dialog appears
  - [ ] Confirm generation
  - [ ] Verify matches are created (round-robin)
  - [ ] Verify all teams play each other

- [ ] **Generate Schedule (>6 teams with Groups)**
  - [ ] Create tournament with >6 teams
  - [ ] Navigate to Matches tab
  - [ ] Create groups
  - [ ] Assign teams to groups
  - [ ] Save groups
  - [ ] Click "Generate Matches" button
  - [ ] Verify matches are created between teams from different groups

- [ ] **Set Match Date/Time**
  - [ ] Tap on a match card
  - [ ] Navigate to Match Details screen
  - [ ] Click "Set Date" button
  - [ ] Select date
  - [ ] Click "Set Time" button
  - [ ] Select time
  - [ ] Save match updates
  - [ ] Navigate back to Matches tab
  - [ ] Verify match shows scheduled date/time

- [ ] **View Match List**
  - [ ] Verify all matches are displayed
  - [ ] Verify match cards show:
    - Team names
    - Score (if completed) or "vs" (if scheduled)
    - Scheduled time or "Tap to set date & time"
    - Status badge
    - Events count
  - [ ] Verify matches are clickable

### 2.5 Match Details Screen
- [ ] **Update Match Score**
  - [ ] Navigate to Match Details screen
  - [ ] Update score for team1 and team2
  - [ ] Verify scores are displayed correctly

- [ ] **Change Match Status**
  - [ ] Select match status (scheduled, live, completed)
  - [ ] Verify status is saved

- [ ] **Add Goal Event**
  - [ ] Click "Add Goal" button
  - [ ] Select player, minute, team
  - [ ] Add goal
  - [ ] Verify goal is added to events list
  - [ ] Verify score is automatically updated

- [ ] **Add Card Event**
  - [ ] Click "Add Card" button
  - [ ] Select player, minute, team, card type (Yellow/Red)
  - [ ] Add card
  - [ ] Verify card is added to events list

- [ ] **Add Injury Event**
  - [ ] Click "Add Injury" button
  - [ ] Select player, minute, team, add notes
  - [ ] Add injury
  - [ ] Verify injury is added to events list

- [ ] **Remove Events**
  - [ ] Click remove button on an event
  - [ ] Verify event is removed
  - [ ] Verify score updates if goal was removed

- [ ] **Save Match Updates**
  - [ ] Make various updates (score, status, events)
  - [ ] Click "Save Match Updates" button
  - [ ] Verify changes are saved
  - [ ] Navigate back to Matches tab
  - [ ] Verify updates are reflected in match list

### 2.6 Tournament Details - Tables Tab
- [ ] **View Standings (No Completed Matches)**
  - [ ] Navigate to Tables tab
  - [ ] Verify all teams show position 0
  - [ ] Verify no position highlighting (1st, 2nd, 3rd)

- [ ] **View Standings (With Completed Matches)**
  - [ ] Complete some matches (set status to "completed" with scores)
  - [ ] Navigate to Tables tab
  - [ ] Verify positions are calculated (1, 2, 3...)
  - [ ] Verify points are calculated correctly:
    - Win = 3 points
    - Draw = 1 point
    - Loss = 0 points
  - [ ] Verify stats are correct:
    - P (Played)
    - W (Wins)
    - D (Draws)
    - L (Losses)
    - GF (Goals For)
    - GA (Goals Against)
    - PTS (Points)
  - [ ] Verify 1st, 2nd, 3rd place highlighting
  - [ ] Verify sorting by points, then goal difference, then goals scored

- [ ] **Separate Categories**
  - [ ] Verify Open Category standings are separate
  - [ ] Verify 35+ Category standings are separate

---

## 3. Team Role Tests

### 3.1 Team Creation
- [ ] **Create Team**
  - [ ] Sign in as Team role
  - [ ] Verify "Create Team" screen is shown (if no team exists)
  - [ ] Fill in team information:
    - Team Name (verify uniqueness check)
    - Year Established
    - Short Description
    - Manager Name
  - [ ] Add team logo (optional)
  - [ ] Add players:
    - Player Name
    - Jersey Number (verify uniqueness per team)
    - Position
    - Player Photo (optional)
  - [ ] Add multiple players
  - [ ] Submit team creation
  - [ ] Verify team is created
  - [ ] Verify navigation to Team Home screen

### 3.2 Squad Management
- [ ] **View Squad**
  - [ ] Navigate to Squad tab
  - [ ] Verify team logo is displayed (if uploaded)
  - [ ] Verify team info is displayed:
    - Manager name
    - Year established
    - Squad size
    - Description
  - [ ] Verify players are grouped by position
  - [ ] Verify player photos are displayed (if uploaded)
  - [ ] Verify jersey badges are shown for players without photos

- [ ] **Add Players**
  - [ ] Click "Add Player" button
  - [ ] Fill in player details
  - [ ] Add player
  - [ ] Verify player appears in squad list
  - [ ] Verify player is saved to Firestore

- [ ] **Remove Players**
  - [ ] Click remove button on a player
  - [ ] Confirm removal
  - [ ] Verify player is removed from squad

### 3.3 Matches Tab (Team View)
- [ ] **View Team Matches**
  - [ ] Navigate to Matches tab
  - [ ] Verify tournaments the team is participating in are listed
  - [ ] Verify matches are listed
  - [ ] Verify team name is highlighted in green
  - [ ] Verify match scores are displayed (if completed)
  - [ ] Verify match status badges
  - [ ] Verify match events are displayed

### 3.4 Tables Tab (Team View)
- [ ] **View Team Standings**
  - [ ] Navigate to Tables tab
  - [ ] Verify "My Position Summary" card is displayed
  - [ ] Verify position, points, played, wins are shown
  - [ ] Verify full standings table is displayed
  - [ ] Verify team row is highlighted in green
  - [ ] Verify positions show 0 if no matches completed
  - [ ] Verify positions update after matches are completed

### 3.5 Formation Generator
- [ ] **View Formation Recommendations**
  - [ ] Navigate to Formation tab
  - [ ] Verify squad analysis is displayed
  - [ ] Verify formation recommendations are shown
  - [ ] Verify formations are categorized (Defensive, Balanced, Offensive)
  - [ ] Verify suitability scores are displayed

- [ ] **Select Formation**
  - [ ] Tap on a recommended formation
  - [ ] Verify formation is selected
  - [ ] Verify formation diagram is displayed
  - [ ] Verify players are auto-assigned to positions
  - [ ] Verify player initials and jersey numbers are shown in diagram

- [ ] **View Lineup**
  - [ ] Verify lineup list is displayed
  - [ ] Verify goalkeeper is assigned
  - [ ] Verify defenders, midfielders, forwards are assigned
  - [ ] Verify substitutes are listed

- [ ] **Swap Players**
  - [ ] Tap on a player in lineup
  - [ ] Verify player is selected (highlighted)
  - [ ] Tap on another player
  - [ ] Verify players are swapped
  - [ ] Verify formation diagram updates

- [ ] **Move to Substitutes**
  - [ ] Click "SUB" button on a player
  - [ ] Verify player moves to substitutes
  - [ ] Verify formation diagram updates

- [ ] **Move from Substitutes**
  - [ ] Click on a substitute player
  - [ ] Verify player is added to lineup
  - [ ] Verify formation diagram updates

---

## 4. Spectator Role Tests

### 4.1 Tournaments Tab
- [ ] **View All Tournaments**
  - [ ] Sign in as Spectator
  - [ ] Navigate to Tournaments tab
  - [ ] Verify all tournaments are displayed
  - [ ] Verify tournaments are categorized:
    - Live Tournaments (with red indicator)
    - Upcoming Tournaments (with calendar icon)
  - [ ] Verify tournament cards show:
    - Tournament name
    - Status badge
    - Location
    - Dates
    - Team counts

### 4.2 Schedules Tab
- [ ] **View Match Schedules**
  - [ ] Navigate to Schedules tab
  - [ ] Verify all matches from all tournaments are displayed
  - [ ] Verify matches are sorted by scheduled time
  - [ ] Verify match cards show:
    - Tournament name
    - Team names
    - Score (if completed) or "vs"
    - Scheduled time
    - Group name (if applicable)
    - Status badge
    - Events count
  - [ ] Verify formatting matches Tournament view

### 4.3 Tables Tab
- [ ] **View League Standings**
  - [ ] Navigate to Tables tab
  - [ ] Verify standings for all tournaments are displayed
  - [ ] Verify separate tables for Open and 35+ categories
  - [ ] Verify positions show 0 if no matches completed
  - [ ] Verify positions update after matches are completed
  - [ ] Verify 1st, 2nd, 3rd place highlighting

### 4.4 Teams Tab
- [ ] **Browse Teams**
  - [ ] Navigate to Teams tab
  - [ ] Verify only teams participating in tournaments are shown
  - [ ] Verify team cards show:
    - Team logo (or placeholder)
    - Team name
    - Number of players
    - Year established

- [ ] **View Team Details**
  - [ ] Tap on a team card
  - [ ] Verify team details are displayed:
    - Team logo
    - Team name
    - Year established
    - Squad size
    - Description
  - [ ] Verify full squad list is displayed
  - [ ] Verify player photos are shown (if available)
  - [ ] Verify player positions are displayed
  - [ ] Verify "Back to Teams" button works

---

## 5. Data Integrity Tests

### 5.1 Persistence Tests
- [ ] **Tournament Data**
  - [ ] Create tournament
  - [ ] Close app
  - [ ] Reopen app
  - [ ] Verify tournament still exists
  - [ ] Verify all tournament data is intact

- [ ] **Team Data**
  - [ ] Create team with players
  - [ ] Close app
  - [ ] Reopen app
  - [ ] Verify team still exists
  - [ ] Verify all players are still present

- [ ] **Match Data**
  - [ ] Create matches
  - [ ] Update match scores and events
  - [ ] Close app
  - [ ] Reopen app
  - [ ] Verify matches still exist
  - [ ] Verify all match data is intact

### 5.2 Standings Calculation
- [ ] **Points Calculation**
  - [ ] Complete matches with known scores
  - [ ] Verify points are calculated correctly:
    - Win = 3 points ✓
    - Draw = 1 point each ✓
    - Loss = 0 points ✓

- [ ] **Sorting Logic**
  - [ ] Create multiple teams with different records
  - [ ] Verify sorting by:
    1. Points (descending)
    2. Goal difference (descending)
    3. Goals scored (descending)

- [ ] **Position Updates**
  - [ ] Verify positions start at 0
  - [ ] Complete first match
  - [ ] Verify positions update to 1, 2, 3...
  - [ ] Verify position highlighting appears

---

## 6. UI/UX Tests

### 6.1 Navigation
- [ ] **Role-based Navigation**
  - [ ] Verify Organizer navigates to OrganizerTabs
  - [ ] Verify Team navigates to TeamHomeScreen
  - [ ] Verify Spectator navigates to SpectatorHomeScreen

- [ ] **Screen Transitions**
  - [ ] Verify smooth navigation between screens
  - [ ] Verify back buttons work correctly
  - [ ] Verify tab switching works

### 6.2 Visual Consistency
- [ ] **Color Scheme**
  - [ ] Verify dark background (#0f0f1e, #1a1a2e) throughout
  - [ ] Verify accent colors (purple #6C63FF, green #4CAF50) are consistent
  - [ ] Verify text is readable (white/light colors on dark background)

- [ ] **Logo Display**
  - [ ] Verify logo appears on Login screen
  - [ ] Verify logo appears on Signup screen
  - [ ] Verify logo loads quickly (using expo-image)

### 6.3 Form Validation
- [ ] **Required Fields**
  - [ ] Verify required fields show errors if empty
  - [ ] Verify forms cannot be submitted without required fields

- [ ] **Data Validation**
  - [ ] Verify team name uniqueness check
  - [ ] Verify jersey number uniqueness per team
  - [ ] Verify email format validation
  - [ ] Verify date validation (end date after start date)

### 6.4 Error Handling
- [ ] **Network Errors**
  - [ ] Test with poor/no internet connection
  - [ ] Verify error messages are displayed
  - [ ] Verify app doesn't crash

- [ ] **Firebase Errors**
  - [ ] Verify Firebase errors are handled gracefully
  - [ ] Verify user-friendly error messages

---

## 7. Performance Tests

- [ ] **App Startup**
  - [ ] Verify app loads within reasonable time
  - [ ] Verify loading screens are shown appropriately

- [ ] **Data Loading**
  - [ ] Verify tournaments load quickly
  - [ ] Verify matches load quickly
  - [ ] Verify standings calculate quickly

- [ ] **Image Loading**
  - [ ] Verify team logos load efficiently
  - [ ] Verify player photos load efficiently

---

## 8. Cleanup

After testing is complete:
- [ ] Delete all test tournaments
- [ ] Delete all test teams
- [ ] Delete all test matches
- [ ] Delete test user accounts (optional)
- [ ] Verify production data is not affected

---

## Test Results Summary

**Total Tests:** ___
**Passed:** ___
**Failed:** ___
**Issues Found:**
1. 
2. 
3. 

**Ready for Release:** ☐ Yes  ☐ No

---

## Notes
- Test on both iOS and Android if possible
- Test with different screen sizes
- Test with various data scenarios (empty, single item, many items)
- Verify all edge cases are handled


