# Specification

## Summary
**Goal:** Add XP coin pickups to races and a neon-themed Store page where players can permanently unlock neon light items using earned XP.

**Planned changes:**
- Add a new Store page route (e.g., `/store`) and a visible “Store” button on the Main Menu “Menu” tab that navigates there, plus an obvious way to return to the Main Menu.
- Build the Store catalog UI with 7 neon light items and exact XP prices (red/blue/yellow/purple/orange=100, white=25, multicolor=1000), showing current XP balance and item states (“Buy” vs “Owned”), with an English “Not enough XP” style error when applicable.
- Implement backend persistence (single Motoko actor) for per-player XP balance and permanently owned neon lights, including methods to fetch balance+inventory, purchase items (deduct XP), and credit XP earned from races/coins.
- Add collectible XP coins to race gameplay (values 1, 5, 10, 20) where 1/5 spawn commonly on-track, and 10/20 are hidden/off-line and/or become obtainable after an “amazing stunt”; ensure coins can only be collected once per instance and collection updates XP immediately.
- Define and implement an “amazing stunt” detection heuristic using existing in-race telemetry with sensible gating/cooldown, and make it enable at least one 10 or 20 XP coin to become obtainable during that race.
- Apply a cohesive neon-racing visual theme to the Store and new coin/XP UI elements without editing immutable UI component sources.
- Wire Store data + purchasing with React Query so XP/inventory load correctly and update immediately after purchases and after XP is earned.

**User-visible outcome:** Players can collect XP coins during races (including higher-value coins unlocked via stunts), then open a neon-themed Store from the Main Menu to spend XP on permanently unlocked neon light colors, with their XP balance and ownership shown and updated live.
