import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

interface ConstraintCircleProps {
  p1: THREE.Vector3;
  earthRadius: number;
  color?: string;
  lineWidth?: number;
}

const ConstraintCircle: React.FC<ConstraintCircleProps> = ({
  p1,
  earthRadius,
  color = '#FFFFFF',
  lineWidth = 1,
}) => {
  const points = useMemo(() => {
    const generatedPoints: THREE.Vector3[] = [];
    const numSegments = 64;
    
    // The angle subtended at the center of the sphere by the Merkaba edge length L
    // theta = 2 * asin(L / (2 * R_earth)) = 2 * asin(sqrt(2/3)) which is acos(-1/3)
    const angularRadius = Math.acos(-1/3); 

    const p1Normalized = p1.clone().normalize();
    const northPole = new THREE.Vector3(0, 1, 0); // Canonical "up" direction

    // Rotation to align the canonical circle (around North Pole) with p1
    const rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromUnitVectors(northPole, p1Normalized);

    for (let i = 0; i <= numSegments; i++) {
      const theta = (i / numSegments) * 2 * Math.PI;

      // Point on a unit sphere, around the North Pole, at the given angularRadius
      const pointOnUnitSphere = new THREE.Vector3(
        Math.sin(angularRadius) * Math.cos(theta), // x
        Math.cos(angularRadius),                   // y (height along pole axis)
        Math.sin(angularRadius) * Math.sin(theta)  // z
      );
      
      // Scale to Earth's radius and apply rotation
      const finalPoint = pointOnUnitSphere
        .multiplyScalar(earthRadius)
        .applyQuaternion(rotationQuaternion);
        
      generatedPoints.push(finalPoint);
    }
    return generatedPoints;
  }, [p1, earthRadius]);

  return <Line points={points} color={color} lineWidth={lineWidth} />;
};

export default ConstraintCircle;
