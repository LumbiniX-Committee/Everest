import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Character3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#f0d8c0" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial color="#3E7CC4" />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.7, 0.4, 0]} rotation={[0, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 16]} />
        <meshStandardMaterial color="#3E7CC4" />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 16]} />
        <meshStandardMaterial color="#3E7CC4" />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.25, -1.1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1.2, 16]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.25, -1.1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1.2, 16]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
    </group>
  );
}
