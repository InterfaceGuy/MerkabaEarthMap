import * as THREE from 'three';

// Canonical vertices of a cube inscribed in a sphere of radius 1
// These will be scaled by earthRadius
export const CUBE_VERTICES_UNIT = [
  new THREE.Vector3(1, 1, 1).normalize(),    // 0
  new THREE.Vector3(1, 1, -1).normalize(),   // 1
  new THREE.Vector3(1, -1, 1).normalize(),   // 2
  new THREE.Vector3(1, -1, -1).normalize(),  // 3
  new THREE.Vector3(-1, 1, 1).normalize(),   // 4
  new THREE.Vector3(-1, 1, -1).normalize(),  // 5
  new THREE.Vector3(-1, -1, 1).normalize(),  // 6
  new THREE.Vector3(-1, -1, -1).normalize(), // 7
];

// Define which cube vertices form the two tetrahedra
export const TETRA1_INDICES = [0, 3, 5, 6]; // Example: V0, V3, V5, V6
export const TETRA2_INDICES = [1, 2, 4, 7]; // Example: V1, V2, V4, V7

export function calculateMerkabaVertices(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  earthRadius: number,
  rotationY: number, // radians
  rotationX: number  // radians
): THREE.Vector3[] {
  // 1. Define canonical P1 and P2 (e.g., two adjacent vertices of the canonical Merkaba)
  // We'll use the first two vertices of the first tetrahedron for canonical alignment.
  const canonicalP1 = CUBE_VERTICES_UNIT[TETRA1_INDICES[0]].clone();
  const canonicalP2 = CUBE_VERTICES_UNIT[TETRA1_INDICES[1]].clone();

  // 2. Calculate the rotation to map (canonicalP1, canonicalP2) to (userP1, userP2)
  const targetEdge = p2.clone().sub(p1).normalize();
  const canonicalEdge = canonicalP2.clone().sub(canonicalP1).normalize();

  // Primary rotation: align canonicalEdge with targetEdge
  const qAlignEdge = new THREE.Quaternion().setFromUnitVectors(canonicalEdge, targetEdge);

  // Apply this rotation to canonicalP1 to see where it lands relative to the origin
  const canonicalP1Aligned = canonicalP1.clone().applyQuaternion(qAlignEdge);

  // Secondary rotation (roll correction): align this rotated canonicalP1 (if it were at origin)
  // with the actual p1 around the targetEdge axis.
  // Vector from p1 to where canonicalP1 (at origin) would land after qAlignEdge, if p1 was the center of rotation.
  // This is equivalent to aligning the "up" vectors or perpendicular vectors.
  // Consider a vector perpendicular to canonicalEdge, e.g. canonicalP1 itself if origin is on the edge.
  // A robust way: define a "reference normal" for the canonical edge and for the target edge.
  
  // Simplified roll: Project p1 and canonicalP1Aligned onto the plane normal to targetEdge.
  // The origin for this projection should be a point on the respective edges, e.g., p1 and canonicalP1Aligned.
  // For simplicity, we assume the setFromUnitVectors handles most of this.
  // A more complex roll correction might be needed if visual artifacts appear.
  // For now, let's assume qAlignEdge is sufficient for basic alignment.
  // The previous roll correction was complex; let's test this simpler alignment first.
  // If p1 and p2 are correctly chosen from the Merkaba structure, qAlignEdge should be close.
  // The key is that p1 (the user's first point) should map to where canonicalP1 lands.
  // We need to rotate the whole system so that canonicalP1.applyQuaternion(qAlignEdge) * earthRadius = p1.
  // This is more like a translation then rotation.
  // The current approach: qAlignEdge orients the *shape*. Then we apply rotations.
  // The absolute positioning is handled by p1 and p2 defining an edge.

  // Let's refine the alignment quaternion:
  // After qAlignEdge, the canonical edge is parallel to targetEdge.
  // Now, rotate around targetEdge so that the transformed canonicalP1 points towards actual p1.
  const tempCanonicalP1 = canonicalP1.clone().applyQuaternion(qAlignEdge);
  const vecToP1 = p1.clone().normalize();
  const vecToTempCanonicalP1 = tempCanonicalP1.clone().normalize();

  // Project these onto the plane normal to targetEdge
  const projP1 = vecToP1.clone().projectOnPlane(targetEdge).normalize();
  const projTemp = vecToTempCanonicalP1.clone().projectOnPlane(targetEdge).normalize();
  
  let qRoll = new THREE.Quaternion();
  if (projP1.lengthSq() > 1e-8 && projTemp.lengthSq() > 1e-8) {
    const angle = projTemp.angleTo(projP1);
    const cross = projTemp.clone().cross(projP1);
    if (cross.dot(targetEdge) > 0) {
      qRoll.setFromAxisAngle(targetEdge, angle);
    } else {
      qRoll.setFromAxisAngle(targetEdge, -angle);
    }
  }
  
  const qInitialAlignment = qRoll.clone().multiply(qAlignEdge);

  // 3. Define local axes based on initial alignment for slider rotations
  // These axes are relative to the Merkaba's orientation after qInitialAlignment
  const localYAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(qInitialAlignment).normalize();
  const localXAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(qInitialAlignment).normalize();

  // 4. Create quaternions for slider rotations
  const qRotationY = new THREE.Quaternion().setFromAxisAngle(localYAxis, rotationY);
  const qRotationX = new THREE.Quaternion().setFromAxisAngle(localXAxis, rotationX);

  // 5. Combine all rotations: initial alignment, then Y rotation, then X rotation
  const finalQuaternion = qRotationX.clone().multiply(qRotationY).multiply(qInitialAlignment);
  
  // 6. Apply this final rotation to all canonical cube vertices and scale
  const merkabaVertices = CUBE_VERTICES_UNIT.map(v =>
    v.clone().applyQuaternion(finalQuaternion).multiplyScalar(earthRadius)
  );

  return merkabaVertices;
}

export function cartesianToGeographic(vertex: THREE.Vector3, earthRadius: number): { lat: number; lon: number } {
  const lat = Math.asin(vertex.y / earthRadius) * (180 / Math.PI);
  // atan2(x, z) means: lon=0 along +Z, lon=90E along +X
  // atan2(z, x) means: lon=0 along +X, lon=90E along +Z
  // Standard for maps often has lon=0 at prime meridian (e.g. Greenwich).
  // Let's use atan2(vertex.x, vertex.z) assuming Z is North, X is East on equatorial plane if Y is up.
  // If Y is up, X and Z are on the equatorial plane.
  // Longitude is angle in XZ plane. Typically, atan2(x,z) where z is 'forward' (e.g. prime meridian).
  // Or atan2(z,x) if x is prime meridian.
  // Let's use: lon = 0 along +X axis, lon = 90 along +Z axis.
  const lon = Math.atan2(vertex.z, vertex.x) * (180 / Math.PI); 
  return { lat, lon };
}
