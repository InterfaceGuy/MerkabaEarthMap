import React, { useState, useRef, useMemo } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import VertexMarker from './components/VertexMarker'
import ConstraintCircle from './components/ConstraintCircle'
import Merkaba from './components/Merkaba'
import CoordinatesDisplay from './components/CoordinatesDisplay'
import { calculateMerkabaVertices } from './utils/merkabaUtils'

export const EARTH_RADIUS = 2
export const MERKABA_EDGE_LENGTH = 2 * EARTH_RADIUS * Math.sqrt(2/3)

interface EarthProps {
  onPointSelect: (point: THREE.Vector3) => void;
}

function Earth({ onPointSelect }: EarthProps) {
  const texture = useTexture('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/planets/earth_atmos_2048.jpg')
  
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.intersections.length > 0) {
      const intersection = event.intersections[0];
      // The clicked point in 3D space might not be exactly on the sphere surface
      // if the mesh itself was rotated. We need to transform it back to the
      // non-rotated sphere's coordinate system to get the correct normalized vector,
      // then apply the radius.
      // However, since the click event gives intersection.point in world coordinates,
      // and our sphere is centered at origin, normalizing and scaling should still be correct
      // regardless of the mesh's own rotation property.
      const pointOnSurface = intersection.point.clone().normalize().multiplyScalar(EARTH_RADIUS);
      onPointSelect(pointOnSurface);
    }
  }

  return (
    // Rotate the Earth mesh by 180 degrees (Math.PI radians) around the Y-axis.
    // This is to align the texture's Prime Meridian (typically the center of the image, U=0.5)
    // with the 3D world's +X axis, which our cartesianToGeographic function assumes
    // corresponds to 0° longitude.
    <mesh rotation={[0, Math.PI, 0]} onClick={handleClick}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        opacity={0.8}
        side={THREE.FrontSide} // Render only the front side for translucency
      />
    </mesh>
  )
}

function App() {
  const [p1, setP1] = useState<THREE.Vector3 | null>(null)
  const [p2, setP2] = useState<THREE.Vector3 | null>(null)
  const [rotationY, setRotationY] = useState<number>(0); // In radians
  const [rotationX, setRotationX] = useState<number>(0); // In radians

  const handleEarthClick = (clickedPointOnSurface: THREE.Vector3) => {
    if (!p1 || (p1 && p2)) { 
      setP1(clickedPointOnSurface);
      setP2(null);
      setRotationX(0); // Reset rotations
      setRotationY(0);
    } else if (p1 && !p2) { 
      const p1Norm = p1.clone().normalize();
      const angularRadius = Math.acos(-1/3); 
      const cosAngularRadius = Math.cos(angularRadius); 
      const sinAngularRadius = Math.sin(angularRadius);

      const circleCenter3D = p1Norm.clone().multiplyScalar(EARTH_RADIUS * cosAngularRadius);
      const radius3D = EARTH_RADIUS * sinAngularRadius;

      const vecToClicked = clickedPointOnSurface.clone().sub(circleCenter3D);
      let directionOnPlane = vecToClicked.clone().projectOnPlane(p1Norm);

      if (directionOnPlane.lengthSq() < 1e-8) { 
        let tempAxis = new THREE.Vector3();
        if (Math.abs(p1Norm.x) <= Math.abs(p1Norm.y) && Math.abs(p1Norm.x) <= Math.abs(p1Norm.z)) {
          tempAxis.set(1,0,0);
        } else if (Math.abs(p1Norm.y) <= Math.abs(p1Norm.x) && Math.abs(p1Norm.y) <= Math.abs(p1Norm.z)) {
          tempAxis.set(0,1,0);
        } else {
          tempAxis.set(0,0,1);
        }
        directionOnPlane = tempAxis.clone().cross(p1Norm).normalize();
      } else {
        directionOnPlane.normalize();
      }
      
      const snappedP2Location = circleCenter3D.clone().add(
        directionOnPlane.multiplyScalar(radius3D)
      );
      
      snappedP2Location.normalize().multiplyScalar(EARTH_RADIUS);
      setP2(snappedP2Location);
    }
  };

  const merkabaFinalVertices = useMemo(() => {
    if (p1 && p2) {
      return calculateMerkabaVertices(p1, p2, EARTH_RADIUS, rotationY, rotationX);
    }
    return null;
  }, [p1, p2, rotationY, rotationX]);

  const showFullMerkaba = !!merkabaFinalVertices;

  return (
    <div className="h-full w-full relative"> {/* Added relative for positioning UI elements */}
      <Canvas camera={{ position: [0, 0, EARTH_RADIUS * 2.5], fov: 75 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[EARTH_RADIUS * 5, EARTH_RADIUS * 5, EARTH_RADIUS * 5]} intensity={1.5} />
        
        <Earth onPointSelect={handleEarthClick} />
        
        {!showFullMerkaba && p1 && <VertexMarker position={p1} color="#FFFFFF" size={0.05 * EARTH_RADIUS} />}
        
        {!showFullMerkaba && p1 && !p2 && (
          <ConstraintCircle 
            p1={p1} 
            earthRadius={EARTH_RADIUS} 
            color="#FFFFFF" 
            lineWidth={1} 
          />
        )}

        {!showFullMerkaba && p2 && <VertexMarker position={p2} color="#FFFFFF" size={0.05 * EARTH_RADIUS} />}

        {showFullMerkaba && merkabaFinalVertices && (
          <Merkaba finalVertices={merkabaFinalVertices} earthRadius={EARTH_RADIUS} />
        )}

        <OrbitControls 
          enableZoom={true} 
          minDistance={EARTH_RADIUS * 1.1} 
          maxDistance={EARTH_RADIUS * 5}
        />
      </Canvas>

      {showFullMerkaba && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px 20px',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          color: 'white',
          width: '300px'
        }}>
          <div>
            <label htmlFor="rotationY" style={{ marginRight: '10px', display: 'block', marginBottom: '5px' }}>
              Y-Axis Rotation: {Math.round(rotationY * 180 / Math.PI)}&deg;
            </label>
            <input
              type="range"
              id="rotationY"
              min="-3.14159" // -PI
              max="3.14159"  // +PI
              step="0.01"
              value={rotationY}
              onChange={(e) => setRotationY(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label htmlFor="rotationX" style={{ marginRight: '10px', display: 'block', marginBottom: '5px' }}>
              X-Axis Rotation: {Math.round(rotationX * 180 / Math.PI)}&deg;
            </label>
            <input
              type="range"
              id="rotationX"
              min="-3.14159" // -PI
              max="3.14159"  // +PI
              step="0.01"
              value={rotationX}
              onChange={(e) => setRotationX(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
      <CoordinatesDisplay vertices={merkabaFinalVertices} earthRadius={EARTH_RADIUS} />
    </div>
  )
}

export default App
