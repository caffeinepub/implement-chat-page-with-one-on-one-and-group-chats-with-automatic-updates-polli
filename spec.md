# Specification

## Summary
**Goal:** Fix the race timer so it counts down at the correct real-time rate (1 second per second) instead of running too fast and ending the race prematurely.

**Planned changes:**
- Fix the timer tick interval so it decrements at exactly 1 second per real elapsed second
- Ensure the fix applies to both single-player and time challenge modes

**User-visible outcome:** When a race starts, the timer counts down at normal speed and the race lasts its full intended duration without ending immediately after starting.
