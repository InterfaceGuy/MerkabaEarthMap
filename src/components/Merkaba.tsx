import React from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import VertexMarker from './VertexMarker';
import { TETRA1_INDICES, TETRA2_INDICES } from '../utils/merkabaUtils'; // Import indices

interface MerkabaProps {
  finalVertices: THREE.Vector3[];
  earthRadius: number;
}

// Edges for a tetrahedron, given 4 vertex indices relative to its own vertex list
const TETRA_EDGES_LOCAL = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
];

const Merkaba: React.FC<MerkabaProps> = ({ finalVertices, earthRadius }) => {
  if (!finalVertices || finalVertices.length !== 8) return null;

  const tetra1ActualVertices = TETRA1_INDICES.map(i => finalVertices[i]);
  const tetra2ActualVertices = TETRA2_INDICES.map(i => finalVertices[i]);

  return (
    <group>
      {/* All 8 Vertices */}
      {finalVertices.map((vertex, index) => (
        <VertexMarker
          key={`vertex-${index}`}
          position={vertex}
          color="#FFFFFF"
          size={0.03 * earthRadius}
        />
      ))}

      {/* Tetrahedron 1 Edges (RED) */}
      {TETRA_EDGES_LOCAL.map((edge, index) => (
        <Line
          key={`tetra1-edge-${index}`}
          points={[tetra1ActualVertices[edge[0]], tetra1ActualVertices[edge[1]]]}
          color="#FF644E"
          lineWidth={2}
        />
      ))}

      {/* Tetrahedron 2 Edges (BLUE) */}
      {TETRA_EDGES_LOCAL.map((edge, index) => (
        <Line
          key={`tetra2-edge-${index}`}
          points={[tetra2ActualVertices[edge[0]], tetra2ActualVertices[edge[1]]]}
          color="#00A2FF"
          lineWidth={2}
        />
      ))}
    </group>
  );
};

export default Merkaba;
