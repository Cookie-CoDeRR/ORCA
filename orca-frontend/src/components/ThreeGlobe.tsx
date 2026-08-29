"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeGlobeProps {
  className?: string;
}

export default function ThreeGlobe({ className = "" }: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;

    // 2. WebGL Renderer with Alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 3. Globe Core Wireframe Sphere
    const globeRadius = 68;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Sphere inner dark glow
    const innerGeo = new THREE.SphereGeometry(globeRadius - 0.5, 48, 48);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x07111e,
      transparent: true,
      opacity: 0.85,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    globeGroup.add(innerSphere);

    // Wireframe Mesh Rings
    const wireGeo = new THREE.SphereGeometry(globeRadius, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 4. Dot Cloud Matrix representing Indian Ocean & Global Coastlines
    const pointCount = 1200;
    const pointPositions = new Float32Array(pointCount * 3);
    const pointColors = new Float32Array(pointCount * 3);

    const cCyan = new THREE.Color(0x38bdf8);
    const cEmerald = new THREE.Color(0x34d399);
    const cDarkBlue = new THREE.Color(0x0369a1);

    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount);
      const theta = Math.sqrt(pointCount * Math.PI) * phi;

      const r = globeRadius + (Math.random() - 0.5) * 1.5;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      pointPositions[i * 3] = x;
      pointPositions[i * 3 + 1] = y;
      pointPositions[i * 3 + 2] = z;

      const randColor = Math.random() > 0.4 ? (Math.random() > 0.5 ? cCyan : cEmerald) : cDarkBlue;
      pointColors[i * 3] = randColor.r;
      pointColors[i * 3 + 1] = randColor.g;
      pointColors[i * 3 + 2] = randColor.b;
    }

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
    pointGeo.setAttribute("color", new THREE.BufferAttribute(pointColors, 3));

    const pointMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const pointCloud = new THREE.Points(pointGeo, pointMat);
    globeGroup.add(pointCloud);

    // 5. Strategic Indian Ocean Tactical Port Markers
    const indianNodes = [
      { name: "Mumbai", lat: 18.91, lon: 72.82 },
      { name: "Veraval PFZ", lat: 20.90, lon: 70.37 },
      { name: "Kochi", lat: 9.93, lon: 76.26 },
      { name: "Chennai", lat: 13.08, lon: 80.27 },
      { name: "Port Blair", lat: 11.62, lon: 92.72 },
      { name: "Vizag", lat: 17.68, lon: 83.21 },
    ];

    const convertLatLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const nodeGroup = new THREE.Group();
    globeGroup.add(nodeGroup);

    indianNodes.forEach((node) => {
      const pos = convertLatLonToVector3(node.lat, node.lon, globeRadius + 1.2);
      
      // Node Beacon
      const dotGeo = new THREE.SphereGeometry(1.6, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      nodeGroup.add(dotMesh);

      // Node Halo Ring
      const ringGeo = new THREE.RingGeometry(2.4, 3.4, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      nodeGroup.add(ringMesh);
    });

    // 6. Equatorial Orbital Rings & Radar Halo
    const orbitRingGeo = new THREE.RingGeometry(globeRadius + 16, globeRadius + 17.5, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    globeGroup.add(orbitRing);

    const orbitRingGeo2 = new THREE.RingGeometry(globeRadius + 24, globeRadius + 25, 64);
    const orbitRingMat2 = new THREE.MeshBasicMaterial({
      color: 0x059669,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const orbitRing2 = new THREE.Mesh(orbitRingGeo2, orbitRingMat2);
    orbitRing2.rotation.x = -Math.PI / 3.2;
    globeGroup.add(orbitRing2);

    // Initial tilt to face the Indian Subcontinent
    globeGroup.rotation.x = 0.28;
    globeGroup.rotation.y = -1.6;

    // 7. Interactive Mouse Controls
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.28;
    let targetRotationY = -1.6;

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.4;
      mouseY = y * 0.4;
    };

    mount.addEventListener("mousemove", onMouseMove);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous Slow Rotation
      targetRotationY += 0.0035;

      globeGroup.rotation.y += (targetRotationY + mouseX - globeGroup.rotation.y) * 0.05;
      globeGroup.rotation.x += (targetRotationX - mouseY - globeGroup.rotation.x) * 0.05;

      // Pulse orbits
      orbitRing.rotation.z = elapsedTime * 0.15;
      orbitRing2.rotation.z = -elapsedTime * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      mount.removeEventListener("mousemove", onMouseMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative flex items-center justify-center w-full h-full min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] ${className}`}
    />
  );
}
