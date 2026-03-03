import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ChaseCameraOptions {
  followDistance?: number;
  followHeight?: number;
  smoothing?: number;
  lookAhead?: number;
}

export function useChaseCamera(
  targetPosition: THREE.Vector3,
  targetRotation: number,
  velocity: number,
  options: ChaseCameraOptions = {}
) {
  const {
    followDistance = 12,
    followHeight = 5,
    smoothing = 0.1,
    lookAhead = 2,
  } = options;

  const { camera } = useThree();
  const cameraVelocity = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const speed = Math.abs(velocity);
    const dynamicDistance = followDistance + (speed / 80) * 3;
    const dynamicHeight = followHeight + (speed / 80) * 1.5;

    const targetCameraPos = new THREE.Vector3(
      targetPosition.x - Math.sin(targetRotation) * dynamicDistance,
      targetPosition.y + dynamicHeight,
      targetPosition.z - Math.cos(targetRotation) * dynamicDistance
    );

    cameraVelocity.current.lerp(
      targetCameraPos.clone().sub(camera.position),
      smoothing
    );
    camera.position.add(cameraVelocity.current.multiplyScalar(delta * 8));

    const lookAtTarget = new THREE.Vector3(
      targetPosition.x + Math.sin(targetRotation) * lookAhead,
      targetPosition.y + 1,
      targetPosition.z + Math.cos(targetRotation) * lookAhead
    );

    currentLookAt.current.lerp(lookAtTarget, smoothing * 1.5);
    camera.lookAt(currentLookAt.current);
  });
}
