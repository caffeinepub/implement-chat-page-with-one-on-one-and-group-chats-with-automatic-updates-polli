# Grand Prix Champions

## Current State
A full-stack F1 racing game with:
- Practice (single-player) mode with W/S controls, lap timer, time challenge
- Multiplayer race, tournament, and boss level modes
- Track selection with multiple F1 layouts
- Pit stop lane (dedicated, off main track)
- Nitro boost, cockpit view (F5/C toggle), mini-map, speedometer, live leaderboard
- Store with neon lights purchasable via XP
- Team, Groups, Records, Levels, Plans pages
- Arena unlock system (sequential SR requirements)
- Car customization (colors, sponsor decals)
- No track builder feature yet
- No spectator mode
- No jumbotrons/big screens

## Requested Changes (Diff)

### Add
- **Track Builder page**: Canvas-based editor accessible from both main menu and track selection screen via a "Build Track" button
  - Place start/finish line on canvas
  - Draw track path freehand
  - Road surface styling: asphalt, concrete, kerbs
  - Side decorations: grass patches, tree placement, barriers
  - Place pit stops and boost areas on the track
  - Save track to backend; appear as playable in track selection
- **Jumbotrons**: Large screens (3D billboards) placed around the track that display close-up camera feeds of nearby car action
- **Spectator Mode**: Watch a race in progress without participating; free-roam or follow-cam options

### Modify
- MainMenu: Add "Build Track" button
- Track selection screen: Add "Build Track" button
- App.tsx: Add route for `/track-builder` and `/spectator`

### Remove
- Nothing

## Implementation Plan
1. Create `TrackBuilder.tsx` page with a 2D canvas editor (draw path, place decorations, pit stops, boost pads, start/finish line)
2. Add road surface and decoration tools (asphalt/concrete/kerbs selector, grass/tree/barrier placement)
3. Save built tracks to backend and list them in track selection
4. Add jumbotron 3D meshes (large flat screen billboards) in the race scene that show a close-up camera feed texture
5. Create `SpectatorMode.tsx` — joins a race as observer with free-roam or follow-cam; no car controls
6. Add "Build Track" button to MainMenu and track selection
7. Add `/track-builder` and `/spectator` routes to App.tsx
