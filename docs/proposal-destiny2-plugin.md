# Proposal: Destiny 2 Game-Driven Proactive Speech Plugin

This proposal outlines the design and integration of a Destiny 2 game-driven plugin for the AIRI client. By leveraging the Bungie API, AIRI can dynamically track live PvP/PvE status and inject real-time game events and post-match performance analyses directly into the character's proactive speech loop.

---

## 1. Architectural & Core Concepts

### Dual-Conditional Activation
To prevent unexpected resource overhead or unsolicited commentary, the Destiny 2 integration is structured as a dual-conditional mechanism:
1. **Global Plugin Activation:** Settings > Modules > Destiny2. Users must toggle the module on and authenticate their account.
2. **Character-Level Activation:** The active character must have proactive speech enabled. The Destiny 2 background polling loop piggybacks on top of the character's existing proactive heartbeat, dynamically adjusting the polling interval based on current game state.

```mermaid
graph TD
    A[Destiny 2 Global Module Enabled] -->|Yes| B[Character Proactive Enabled?]
    B -->|Yes| C[Destiny 2 Polling Heartbeat Starts]
    B -->|No| D[No Polling / Regular Proactivity Only]
    A -->|No| E[Default Proactive Heartbeat Only]
```

---

## 2. Setting up the Module Settings UI

The plugin adds a new settings view under `Settings > Modules > Destiny2`.

```
Settings > Modules > Destiny2
┌────────────────────────────────────────────────────────┐
│  [X] Enable Destiny 2 Integration                      │
│                                                        │
│  Bungie Name: [ Richy#3333               ]             │
│  Platform:    ( ) Steam  ( ) PSN  ( ) Xbox             │
│                                                        │
│  [ Test API Connection ]                               │
│  Status: Connected to Bungie API.                      │
│  Character Found: Warlock - 2010 Power                 │
│                                                        │
│  ─── Advanced Controls ─────────────────────────────── │
│  [X] Comment on Post-Game Carnage Reports (PGCR)       │
│  [X] Comment when entering match making / loading maps │
│  [ ] Show encouragement on death streaks               │
└────────────────────────────────────────────────────────┘
```

### The "Test API Connection" Flow
1. User enters their **Bungie Name** (e.g., `Richy#3333`).
2. AIRI calls `Destiny2.SearchDestinyPlayerByBungieName` to obtain the `membershipType` and `membershipId`.
3. If successful, it queries `Destiny2.GetProfile` to fetch basic character details (class, power level) and prints them in the status indicator to verify credentials.

---

## 3. The Polling Lifecycle (Dynamic Timers)

Instead of polling at a constant, static interval, the polling loop behaves like a state machine to reduce rate limits when idle but capture transitions instantly.

```mermaid
stateDiagram-v2
    [*] --> Orbit_Tower : Polling (Slow - 15s)
    Orbit_Tower --> Active_Match : currentActivityHash changes to Match

    state Active_Match {
        [*] --> InProgress : Polling (Slow - 30s)
        InProgress --> Match_Ended : currentActivityHash transitions to 0/Orbit
    }

    Match_Ended --> Fetch_PGCR : Trigger Immediate Poll
    Fetch_PGCR --> Orbit_Tower : Feed Stats to LLM & Reset
```

### State Triggers & API Details

#### 1. Checking Live State
* **API Component:** `GET /Destiny2/{membershipType}/Profile/{destinyMembershipId}/?components=204` (CharacterActivities)
* **Frequency:** 15s in Orbit/Tower, 30s once inside a match.
* **Transition:** When `currentActivityHash` changes from `0` (or orbit activity hash) to a PvP/PvE map hash, trigger the `MATCH_STARTED` event.

#### 2. Detecting Match End & Fetching PGCR
* **Trigger:** When `currentActivityHash` transitions back to Orbit/Tower (`0`), immediately trigger a one-shot fetch for the Post Game Carnage Report.
* **Endpoint 1:** `GET /Destiny2/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Stats/Activities/?count=1` to grab the latest completed match's `instanceId`.
* **Endpoint 2:** `GET /Destiny2/Stats/PostGameCarnageReport/{instanceId}/` to download performance details.

---

## 4. Context Payload Sent to AIRI's LLM

When a game-state transition is detected, the event-driven module intercepts the heartbeat, bypasses the standard idle prompt, and formats a rich, situational prompt for the active character.

### Example Event: `MATCH_STARTED`
* **Injected Context:**
  ```yaml
  Game: 'Destiny 2'
  Event: 'MATCH_STARTED'
  ActivityType: 'Trials of Osiris'
  Map: 'The Burnout'
  CurrentLoadout: "Ace of Spades, Matador 64, Tomorrow's Answer"
  ```
* **AIRI's Prompt Context Directive:**
  *"Your companion has just entered a competitive match. Acknowledge the map/mode or express anticipation based on their loadout."*

### Example Event: `MATCH_COMPLETED` (PGCR Analysis)
* **Injected Context:**
  ```yaml
  Game: 'Destiny 2'
  Event: 'MATCH_COMPLETED'
  ActivityType: 'Crucible Control'
  Map: 'Javelin-4'
  Outcome: 'Victory (150 - 142)'
  Performance:
    Kills: 25
    Deaths: 10
    Assists: 8
    KD: 2.5
    CombatRatingRank: 1 # Top of the leaderboard
    PrimaryWeaponKills: 15 # Ace of Spades
  ```
* **AIRI's Prompt Context Directive:**
  *"Your companion just finished their match. Comment on their performance, victory/defeat, K/D ratio, and any standout accomplishments like topping the leaderboard."*
