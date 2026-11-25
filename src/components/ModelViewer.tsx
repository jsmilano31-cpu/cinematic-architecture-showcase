"use client";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  OrbitControls,
  useBounds,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import type { Media } from "@/content/types";
import { Vector3 } from "three";
function Geometry({ url, reset }: { url: string; reset: number }) {
  const { scene } = useGLTF(url);
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh(scene).clip().fit();
  }, [bounds, scene, reset]);
  return <primitive object={scene} />;
}
export default function ModelViewer({
  media,
  fallback,
}: {
  media: Media;
  fallback: ReactNode;
}) {
  const controls = useRef<OrbitImpl>(null);
  const [reset, setReset] = useState(0),
    [failed, setFailed] = useState(false);
  const { active, progress } = useProgress();
  const az = ((media.azimuth ?? 35) * Math.PI) / 180;
  function rotate(dir: number) {
    const c = controls.current;
    if (!c) return;
    const axis = new Vector3(0, 1, 0);
    c.object.position
      .sub(c.target)
      .applyAxisAngle(axis, (dir * Math.PI) / 8)
      .add(c.target);
    c.update();
  }
  function zoom(factor: number) {
    const c = controls.current;
    if (!c) return;
    const offset = c.object.position.clone().sub(c.target);
    offset.setLength(
      Math.min(
        c.maxDistance,
        Math.max(c.minDistance, offset.length() * factor),
      ),
    );
    c.object.position.copy(c.target).add(offset);
    c.update();
  }
  if (failed) return fallback;
  return (
    <div className="model-frame">
      <div
        className="model-stage"
        role="img"
        aria-label={media.poster?.alt || media.title}
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{
            position: [32 * Math.sin(az), 19, 32 * Math.cos(az)],
            fov: 44,
          }}
          fallback={fallback}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setFailed(true),
              { once: true },
            );
          }}
        >
          <color attach="background" args={["#e6e3d9"]} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[12, 22, 16]} intensity={2.8} />
          <OrbitControls
            ref={controls}
            makeDefault
            minDistance={2}
            maxDistance={90}
            maxPolarAngle={Math.PI * 0.48}
            enablePan={false}
          />
          <Suspense fallback={null}>
            <Bounds
              fit
              clip
              observe
              margin={1.18}
              maxDuration={
                typeof window !== "undefined" &&
                matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? 0.001
                  : 0.65
              }
            >
              <Geometry url={media.url} reset={reset} />
            </Bounds>
          </Suspense>
        </Canvas>
        {active && <p role="status">Loading model · {Math.round(progress)}%</p>}
      </div>
      <div className="model-actions">
        <button onClick={() => zoom(0.8)}>Zoom in</button>
        <button onClick={() => zoom(1.25)}>Zoom out</button>
        <button onClick={() => rotate(-1)}>Rotate left</button>
        <button onClick={() => rotate(1)}>Rotate right</button>
        <button
          onClick={() => {
            const c = controls.current;
            if (c) {
              c.object.position.set(32 * Math.sin(az), 19, 32 * Math.cos(az));
              c.update();
            }
            setReset((v) => v + 1);
          }}
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
