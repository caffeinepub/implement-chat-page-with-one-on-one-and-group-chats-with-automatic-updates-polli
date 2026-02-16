# Specification

## Summary
**Goal:** Update the 3D race scene to match the uploaded reference screenshot with a realistic drivable sports coupe, a more realistic road course environment, and a minimal HUD (lap + speed).

**Planned changes:**
- Replace the current placeholder player car with a more realistic wide-body sports coupe look (rear view), primarily yellow with a rear rainbow/gradient accent and a prominent rear spoiler, using improved materials (paint/glass/rubber).
- Update the track environment to a more realistic outdoor road course look (asphalt, grass verges, red/white curbs, guardrails/barriers) with lighting/fog tuned for realism.
- Ensure player-controlled driving in the scene (acceleration/brake + steering) with a stable third-person chase camera behind the car.
- Add a simple HUD overlay showing current lap/total laps and a speed readout, positioned away from the center of the screen.
- Add any needed static textures/decals under `frontend/public/assets/generated` and load them from the frontend rendering.

**User-visible outcome:** When entering the race scene, the player drives a realistic yellow sports coupe from a behind-the-car camera on a realistic outdoor track, with an on-screen lap indicator and speed display.
