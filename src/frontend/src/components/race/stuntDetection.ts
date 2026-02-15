interface StuntTelemetry {
  positionY: number;
  velocity: number;
  isGrounded: boolean;
  speed: number;
}

interface StuntState {
  isAirborne: boolean;
  airborneStartTime: number;
  airborneStartY: number;
  lastStuntTime: number;
  stuntCooldown: number;
}

const STUNT_CONFIG = {
  MIN_AIRTIME: 800, // milliseconds
  MIN_HEIGHT: 2, // units above ground
  MIN_SPEED: 30, // minimum speed for stunt
  COOLDOWN: 5000, // 5 seconds between stunts
};

export function createStuntDetector(): StuntState {
  return {
    isAirborne: false,
    airborneStartTime: 0,
    airborneStartY: 0,
    lastStuntTime: 0,
    stuntCooldown: STUNT_CONFIG.COOLDOWN,
  };
}

export function detectStunt(
  state: StuntState,
  telemetry: StuntTelemetry,
  currentTime: number
): boolean {
  const { positionY, isGrounded, speed } = telemetry;

  // Check if we're in cooldown
  if (currentTime - state.lastStuntTime < state.stuntCooldown) {
    return false;
  }

  // Detect takeoff
  if (!state.isAirborne && !isGrounded && speed > STUNT_CONFIG.MIN_SPEED) {
    state.isAirborne = true;
    state.airborneStartTime = currentTime;
    state.airborneStartY = positionY;
    return false;
  }

  // Detect landing and check if it qualifies as a stunt
  if (state.isAirborne && isGrounded) {
    const airtime = currentTime - state.airborneStartTime;
    const height = positionY - state.airborneStartY;

    state.isAirborne = false;

    // Check if airtime and height meet stunt requirements
    if (airtime >= STUNT_CONFIG.MIN_AIRTIME && height >= STUNT_CONFIG.MIN_HEIGHT) {
      state.lastStuntTime = currentTime;
      return true;
    }
  }

  return false;
}

export function isStuntCooldownActive(state: StuntState, currentTime: number): boolean {
  return currentTime - state.lastStuntTime < state.stuntCooldown;
}

export function getStuntCooldownRemaining(state: StuntState, currentTime: number): number {
  const remaining = state.stuntCooldown - (currentTime - state.lastStuntTime);
  return Math.max(0, remaining);
}
