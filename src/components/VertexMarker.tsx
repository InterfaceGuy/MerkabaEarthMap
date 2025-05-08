import React from 'react'
import * as THREE from 'three'

interface VertexMarkerProps {
  position: THREE.Vector3 | [number, number, number];
  color?: string;
  size?: number;
}

const VertexMarker: React.FC<VertexMarkerProps> = ({ position, color = '#FFFFFF', size = 0.05 }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export default VertexMarker
