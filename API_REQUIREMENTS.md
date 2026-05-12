# XO CLASH - Clash of Clans Style Game - Backend API Requirements

## Overview

This document outlines all the required backend API endpoints needed to support the new Clash of Clans-style multiplayer tic-tac-toe game features.

## API Endpoints

### 1. Player Stats & Profile

#### GET /api/v1/players/{username}/stats

**Purpose:** Get comprehensive player statistics and profile information

**Request:**

```
GET /api/v1/players/{username}/stats
Headers:
  Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
    "username": "player1",
    "totalWins": 45,
    "totalLosses": 12,
    "totalDraws": 3,
    "rank": "Gold",
    "rankPoints": 2450,
    "experience": 45000,
    "lastActive": "2026-04-30T10:30:00Z",
    "joinedDate": "2025-01-15T00:00:00Z"
}
```

---

### 2. Available Power-ups

#### GET /api/v1/powerups/available

**Purpose:** Get all power-ups available in the system

**Request:**

```
GET /api/v1/powerups/available
```

**Response (200 OK):**

```json
{
    "powerups": [
        {
            "id": "EXTRA_MOVE",
            "name": "Extra Move",
            "description": "Take another turn immediately!",
            "icon": "zap",
            "type": "ATTACK",
            "rarity": "legendary",
            "attackBoost": 100,
            "defenseBoost": 0,
            "duration": 1,
            "cooldown": 5,
            "potential": "Can turn the tide in one turn",
            "unlockRank": "Gold"
        },
        {
            "id": "BLOCK_CELL",
            "name": "Block Cell",
            "description": "Block opposite player from using cell",
            "icon": "shield",
            "type": "DEFENSE",
            "rarity": "rare",
            "attackBoost": 0,
            "defenseBoost": 80,
            "duration": 1,
            "cooldown": 3,
            "potential": "Prevents opponent's winning move",
            "unlockRank": "Silver"
        },
        {
            "id": "UNDO_MOVE",
            "name": "Undo Move",
            "description": "Undo your last move",
            "icon": "rotate-ccw",
            "type": "SUPPORT",
            "rarity": "epic",
            "attackBoost": 20,
            "defenseBoost": 40,
            "duration": 1,
            "cooldown": 4,
            "potential": "Fix a deadly mistake",
            "unlockRank": "Gold"
        },
        {
            "id": "SWAP_CELL",
            "name": "Swap Cell",
            "description": "Change cell mark from opposite player to yours",
            "icon": "arrow-left-right",
            "type": "ATTACK",
            "rarity": "epic",
            "attackBoost": 75,
            "defenseBoost": 25,
            "duration": 1,
            "cooldown": 6,
            "potential": "Sneaky way to win",
            "unlockRank": "Diamond"
        },
        {
            "id": "HINT",
            "name": "Hint",
            "description": "Get a nice hint for where to place your mark",
            "icon": "lightbulb",
            "type": "SUPPORT",
            "rarity": "common",
            "attackBoost": 10,
            "defenseBoost": 10,
            "duration": 1,
            "cooldown": 2,
            "potential": "Good for beginners",
            "unlockRank": "Bronze"
        },
        {
            "id": "GHOST_MOVE",
            "name": "Ghost Move",
            "description": "Place a mark that invisible to the opposite player",
            "icon": "ghost",
            "type": "ATTACK",
            "rarity": "legendary",
            "attackBoost": 90,
            "defenseBoost": 40,
            "duration": 2,
            "cooldown": 7,
            "potential": "Surprise attack",
            "unlockRank": "Diamond"
        }
    ]
}
```

---

### 3. Player's Unlocked Power-ups

#### GET /api/v1/players/{username}/powerups

**Purpose:** Get power-ups unlocked by a specific player

**Request:**

```
GET /api/v1/players/{username}/powerups
Headers:
  Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
    "username": "player1",
    "unlockedPowerups": [
        {
            "powerupId": "BLOCK_CELL",
            "powerupName": "Block Cell",
            "count": 5,
            "lastUsed": "2026-04-30T09:15:00Z",
            "totalUsed": 42
        },
        {
            "powerupId": "EXTRA_MOVE",
            "powerupName": "Extra Move",
            "count": 2,
            "lastUsed": "2026-04-29T15:45:00Z",
            "totalUsed": 8
        }
    ],
    "totalUnlocked": 2,
    "maxUnlockable": 6
}
```

---

### 4. Activate Power-up

#### POST /api/v1/powerups/activate

**Purpose:** Activate a power-up and trigger WebSocket notification

**Request:**

```
POST /api/v1/powerups/activate
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "powerUpType": "shield",
  "playerId": "player1",
  "sessionId": "session123",
  "targetRow": 0,
  "targetCol": 1
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "powerupId": "shield",
    "powerupName": "Shield Defense",
    "activatedAt": "2026-04-30T10:35:00Z",
    "expiresAt": "2026-04-30T10:37:00Z",
    "message": "Shield Defense activated for 2 turns"
}
```

**WebSocket Message:**
After receiving this request, the backend should send a WebSocket message to all connected players in the session:

```
Topic: /topic/powerups/{playerId}/activate
Message: "{activationMessage} {powerUpType}"
Example: "Player activated shield defense shield"
```

**Business Logic:**

-   Validate that player has the power-up unlocked
-   Check cooldown status
-   Record power-up usage for statistics
-   Send WebSocket message to `/topic/powerups/{playerId}/activate`
-   Apply power-up effects in game logic
-   Reduce available power-ups or apply cooldown

---

### 5. Player Rankings / Leaderboard

#### GET /api/v1/players/rankings

**Purpose:** Get global player rankings

**Request:**

```
GET /api/v1/players/rankings?limit=50&offset=0
```

**Response (200 OK):**

```json
{
    "rankings": [
        {
            "rank": 1,
            "username": "ProPlayer",
            "wins": 250,
            "losses": 15,
            "rankPoints": 5000,
            "winRate": 94.3,
            "badge": "Legend",
            "avatar": "https://...",
            "joinedDate": "2025-01-01T00:00:00Z"
        },
        {
            "rank": 2,
            "username": "SkillMaster",
            "wins": 220,
            "losses": 20,
            "rankPoints": 4800,
            "winRate": 91.7,
            "badge": "Elite",
            "avatar": "https://...",
            "joinedDate": "2025-01-10T00:00:00Z"
        },
        {
            "rank": 3,
            "username": "TacticalGenius",
            "wins": 198,
            "losses": 25,
            "rankPoints": 4600,
            "winRate": 88.8,
            "badge": "Elite",
            "avatar": "https://...",
            "joinedDate": "2025-02-05T00:00:00Z"
        }
    ],
    "totalPlayers": 1250,
    "generatedAt": "2026-04-30T10:35:00Z"
}
```

---

## WebSocket Events

### Power-up Activation Notification

**Topic:** `/topic/powerups/{playerId}/activate`

**Message Format:**

```
"{activationMessage} {powerUpType}"
```

**Example:**

```
"Player player1 activated shield"
```

**Trigger:** When user calls POST `/api/v1/powerups/activate`

---

### Game Outcome Notification (Frontend -> Backend)

**Message Destination:** `/app/game.end`

**Purpose:** The frontend determines the win condition (or draw) and sends the game outcome to the backend to update `rank_points`, `wins`, `losses`, etc.

**Message Format:**

```json
{
    "playerId": "player1",
    "sessionId": "session123",
    "againstPlayerId": "player2",
    "win": true,
    "draw": false
}
```

**Business Logic (Backend):**

-   Verify the session exists
-   If `draw` is false:
    -   If `win` is true: Add `rank_points` (e.g., +25) to `playerId`, subtract from `againstPlayerId`, increment wins/losses respectively.
    -   If `win` is false: Subtract `rank_points` from `playerId`, add to `againstPlayerId`, increment losses/wins respectively.
    -   Update `rank` (Bronze/Silver/Gold/Diamond) if points cross thresholds
-   If `draw` is true:
    -   Increment `total_draws` for both players
-   Save updated `player_stats` to the database
-   Emit game ended/stats updated events if necessary

---

## Database Schema Suggestions

### PowerUp Table

```sql
CREATE TABLE power_ups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  type VARCHAR(50),
  rarity VARCHAR(50),
  attack_boost INT DEFAULT 0,
  defense_boost INT DEFAULT 0,
  duration INT,
  cooldown INT,
  potential TEXT,
  unlock_rank VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PlayerPowerUp Table (Unlocked by players)

```sql
CREATE TABLE player_power_ups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  power_up_id VARCHAR(50) NOT NULL,
  count INT DEFAULT 0,
  last_used TIMESTAMP,
  total_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(username),
  FOREIGN KEY (power_up_id) REFERENCES power_ups(id),
  UNIQUE KEY unique_player_powerup (player_id, power_up_id)
);
```

### PlayerStats Table

```sql
CREATE TABLE player_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL UNIQUE,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  total_draws INT DEFAULT 0,
  rank VARCHAR(50) DEFAULT 'Bronze',
  rank_points INT DEFAULT 0,
  experience INT DEFAULT 0,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(username)
);
```

### PowerUpUsage Table (For tracking usage)

```sql
CREATE TABLE power_up_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  power_up_id VARCHAR(50) NOT NULL,
  session_id VARCHAR(255),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INT,
  target_row INT,
  target_col INT,
  FOREIGN KEY (player_id) REFERENCES users(username),
  FOREIGN KEY (power_up_id) REFERENCES power_ups(id)
);
```

---

## Implementation Checklist for Backend

-   [ ] Create PowerUp entity/model
-   [ ] Create PlayerPowerUp entity/model (linking players to unlocked powerups)
-   [ ] Create PlayerStats entity/model
-   [ ] Create PowerUpUsage entity/model
-   [ ] Implement `/api/v1/players/{username}/stats` GET endpoint
-   [ ] Implement `/api/v1/powerups/available` GET endpoint
-   [ ] Implement `/api/v1/players/{username}/powerups` GET endpoint
-   [ ] Implement `/api/v1/powerups/activate` POST endpoint
-   [ ] Implement `/api/v1/players/rankings` GET endpoint with pagination
-   [ ] Add WebSocket message publishing when power-up is activated
-   [ ] Create database migration scripts
-   [ ] Add transaction handling for power-up activation
-   [ ] Implement cooldown validation
-   [ ] Add caching for leaderboard data
-   [ ] Create Game Outcome WebSocket listener (e.g. `/app/game.end` to process who won, lost, or drew)
-   [ ] Implement Elo/rank point distribution logic upon game ending
-   [ ] Create admin endpoint to seed/manage power-ups
-   [ ] Add proper error handling and validation
-   [ ] Add rate limiting for power-up activation
-   [ ] Create background job to update player rankings

---

## Frontend Implementation Status

### Completed Components:

✅ PowerUpCard - Displays individual power-up information with rarity badges
✅ PowerUpActivationModal - Modal for viewing and activating power-ups
✅ PlayerStatsCard - Shows player stats with rank and win rate (Clash of Clans style)
✅ PowerUpActivationNotification - Shows notification when power-up is activated
✅ ActivePowerUpsPanel - Displays active power-ups during gameplay
✅ Leaderboard - Global rankings view
✅ Dashboard - Updated to show stats and power-ups
✅ Game.jsx - Updated to handle power-up activation notifications
✅ API Service - powerUpService with all required methods
✅ WebSocket - Listener for power-up activation events

### Frontend Integration Points:

1. Dashboard displays player stats and unlocked power-ups
2. Power-ups can be selected/activated from the power-up cards
3. Modal shows detailed power-up information before activation
4. Leaderboard shows top 50 players with global rankings
5. During gameplay, power-up activations trigger notifications
6. Active power-ups appear in a panel during matches

---

## Notes

-   All endpoints should require authentication via JWT token
-   Power-up activation should be session-specific
-   Cooldowns should be player-specific and time-based
-   Leaderboard should be cached and updated periodically (e.g., every 5 minutes)
-   Power-ups should have different effects based on game state
