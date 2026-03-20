"use client";
import React, { useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, MeshDistortMaterial, Sphere } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Scene = () => {
    const meshRef = useRef();
    const groupRef = useRef();

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Animation synced with scroll
            gsap.to(groupRef.current.rotation, {
                y: Math.PI * 2,
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1,
                },
            });

            gsap.to(groupRef.current.position, {
                x: 2,
                z: -2,
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top',
                    end: '30% top',
                    scrub: 1,
                },
            });
        });
        return () => ctx.revert();
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <Sphere args={[1, 64, 64]} ref={meshRef}>
                    <MeshDistortMaterial
                        color="#2563eb"
                        speed={3}
                        distort={0.4}
                        radius={1}
                    />
                </Sphere>
            </Float>

            {/* Decorative abstract elements */}
            <mesh position={[2, -1, -2]} rotation={[0.5, 0.5, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#f97316" />
            </mesh>

            <mesh position={[-2, 1, -3]} rotation={[1, 0.2, 0.5]}>
                <torusGeometry args={[0.3, 0.1, 16, 32]} />
                <meshStandardMaterial color="#3b82f6" opacity={0.5} transparent />
            </mesh>
        </group>
    );
};

export const Hero3D = () => {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <ambientLight intensity={1.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#2563eb" />
                <Scene />
            </Canvas>
        </div>
    );
};
