import React from 'react';
import * as THREE from 'three';
import { cartesianToGeographic } from '../utils/merkabaUtils';

interface CoordinatesDisplayProps {
  vertices: THREE.Vector3[] | null;
  earthRadius: number;
}

const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({ vertices, earthRadius }) => {
  if (!vertices || vertices.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: 'calc(100vh - 20px)',
        overflowY: 'auto',
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: '5px', borderBottom: '1px solid white', paddingBottom: '5px' }}>
        Merkaba Vertices (Lat, Lon)
      </h4>
      <ul>
        {vertices.map((vertex, index) => {
          const { lat, lon } = cartesianToGeographic(vertex, earthRadius);
          // Corrected Google Maps URL format
          const mapsLink = `https://www.google.com/maps/place/${lat.toFixed(6)},${lon.toFixed(6)}`;
          return (
            <li key={index} style={{ marginBottom: '3px' }}>
              V{index + 1}: {lat.toFixed(2)}&deg;, {lon.toFixed(2)}&deg;{' '}
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00A2FF', textDecoration: 'none' }}
              >
                [Map]
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CoordinatesDisplay;
