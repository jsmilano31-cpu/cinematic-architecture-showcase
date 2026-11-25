"use client";
import {
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import {
  Box3,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Vector3,
  type Object3D,
} from "three";
import { Minus, Plus, RotateCcw, RotateCw, Scan } from "lucide-react";

type Props = {
  url: string;
  floor: string;
  room: string;
  azimuth: number;
  fallback: ReactNode;
  onNodes: (names: string[]) => void;
  onPick: (room: string) => void;
};
type GeometryProps = Omit<Props, "fallback"> & {
  reset: number;
  controls: RefObject<OrbitImpl | null>;
};
// Camera and controls are imperative Three.js objects owned by the canvas.
function frameCamera(
  camera: PerspectiveCamera,
  orbit: OrbitImpl,
  center: Vector3,
  ray: Vector3,
  fit: number,
  zoom: number,
) {
  orbit.minDistance = fit * 0.22;
  orbit.maxDistance = fit * 3;
  orbit.target.copy(center);
  camera.position
    .copy(center)
    .addScaledVector(
      ray,
      MathUtils.clamp(fit * zoom, orbit.minDistance, orbit.maxDistance),
    );
  camera.near = Math.max(0.01, fit / 500);
  camera.far = fit * 14;
  camera.updateProjectionMatrix();
  orbit.update();
}
function Geometry({
  url,
  floor,
  room,
  azimuth,
  reset,
  controls,
  onNodes,
  onPick,
}: GeometryProps) {
  const { scene } = useGLTF(url);
  const house = useMemo(() => scene.clone(true), [scene]);
  const { camera, size, invalidate } = useThree();
  const last = useRef<{
    floor: string;
    room: string;
    reset: number;
    distance: number;
  } | null>(null);
  useLayoutEffect(() => {
    const names: string[] = [];
    house.traverse((o) => {
      if (o.name) names.push(o.name);
      if (o instanceof Mesh) {
        o.castShadow = !o.material.transparent;
        o.receiveShadow = true;
      }
    });
    onNodes(names);
  }, [house, onNodes]);
  useLayoutEffect(() => {
    const orbit = controls.current;
    if (
      !orbit ||
      !(camera instanceof PerspectiveCamera) ||
      size.width < 1 ||
      size.height < 1
    )
      return;
    const levels = new Map<string, Object3D>();
    house.traverse((o) => {
      const name = o.userData.name;
      if (typeof name === "string" && name.startsWith("floor_"))
        levels.set(name.slice(6), o);
    });
    const selectedLevel = levels.get(floor);
    const roof = house.getObjectByName("roof");
    if (roof) roof.visible = !selectedLevel;
    // Preserve lower storeys beneath the cut. GLB floors use increasing elevation.
    const cutHeight = selectedLevel
      ? new Box3().setFromObject(selectedLevel).min.y
      : Infinity;
    levels.forEach((o) => {
      o.visible = new Box3().setFromObject(o).min.y <= cutHeight + 0.015;
    });
    const selectedRoom = room && house.getObjectByName("room_" + room);
    const box = new Box3().setFromObject(
      selectedRoom || selectedLevel || house,
    );
    if (box.isEmpty()) return;
    const center = box.getCenter(new Vector3());
    const prev = last.current;
    const preserve =
      prev &&
      prev.floor === floor &&
      prev.room === room &&
      prev.reset === reset;
    const az = MathUtils.degToRad(azimuth);
    const tilt = MathUtils.degToRad(
      selectedRoom ? 59 : selectedLevel ? 56 : 21,
    );
    const ray = preserve
      ? camera.position.clone().sub(orbit.target).normalize()
      : new Vector3(
          Math.sin(az) * Math.cos(tilt),
          Math.sin(tilt),
          Math.cos(az) * Math.cos(tilt),
        );
    const right = new Vector3().crossVectors(camera.up, ray).normalize();
    const up = new Vector3().crossVectors(ray, right).normalize();
    const tan = Math.tan(MathUtils.degToRad(camera.fov / 2));
    let fit = 0;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          const point = new Vector3(x, y, z).sub(center);
          fit = Math.max(
            fit,
            point.dot(ray) +
              Math.max(
                Math.abs(point.dot(right)) / ((tan * size.width) / size.height),
                Math.abs(point.dot(up)) / tan,
              ),
          );
        }
    fit = Math.max(0.2, fit * 1.14);
    const zoom = preserve
      ? camera.position.distanceTo(orbit.target) / prev.distance
      : 1;
    frameCamera(camera, orbit, center, ray, fit, zoom);
    invalidate();
    last.current = { floor, room, reset, distance: fit };
  }, [
    house,
    floor,
    room,
    azimuth,
    reset,
    controls,
    size.width,
    size.height,
    camera,
    invalidate,
  ]);
  function pick(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 4 || floor === "exterior") return;
    for (const hit of e.intersections) {
      let o: Object3D | null = hit.object;
      let picked = "",
        level = "";
      while (o && o.visible) {
        const name = o.userData.name;
        if (typeof name === "string") {
          if (name.startsWith("room_")) picked = name.slice(5);
          if (name.startsWith("floor_")) level = name.slice(6);
        }
        o = o.parent;
      }
      if (!o && picked && level === floor) {
        onPick(picked);
        e.stopPropagation();
        return;
      }
    }
  }
  return <primitive object={house} dispose={null} onClick={pick} />;
}
export default function ModelViewer({ fallback, ...props }: Props) {
  const controls = useRef<OrbitImpl>(null);
  const [failed, setFailed] = useState(false);
  const [reset, setReset] = useState(0);
  const { active, progress } = useProgress();
  function move(angle: number, factor: number) {
    const c = controls.current;
    if (!c) return;
    const offset = c.object.position
      .clone()
      .sub(c.target)
      .applyAxisAngle(new Vector3(0, 1, 0), angle);
    offset.setLength(
      MathUtils.clamp(offset.length() * factor, c.minDistance, c.maxDistance),
    );
    c.object.position.copy(c.target).add(offset);
    c.update();
  }
  if (failed) return fallback;
  return (
    <div className="house-viewport">
      <div
        className="model-stage"
        role="img"
        aria-label="Interactive architectural model"
      >
        <Canvas
          shadows="percentage"
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [10, 14, 32], fov: 39 }}
          fallback={fallback}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setFailed(true),
              { once: true },
            );
          }}
        >
          <hemisphereLight args={["#fff4de", "#b6a88f", 1.55]} />
          <directionalLight
            position={[-14, 22, 13]}
            intensity={2.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-18}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
            shadow-normalBias={0.035}
          />
          <directionalLight position={[8, 8, -12]} intensity={0.7} />
          <OrbitControls
            makeDefault
            ref={controls}
            enablePan={false}
            maxPolarAngle={Math.PI * 0.48}
          />
          <Suspense fallback={null}>
            <Geometry {...props} reset={reset} controls={controls} />
          </Suspense>
        </Canvas>
      </div>
      {active && (
        <p className="house-loading" role="status">
          Loading model · {Math.round(progress)}%
        </p>
      )}
      <div className="house-tools" role="group" aria-label="Camera controls">
        <button
          aria-label="Rotate left"
          title="Rotate left"
          onClick={() => move(-Math.PI / 8, 1)}
        >
          <RotateCcw />
        </button>
        <button
          aria-label="Rotate right"
          title="Rotate right"
          onClick={() => move(Math.PI / 8, 1)}
        >
          <RotateCw />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => move(0, 1.25)}
        >
          <Minus />
        </button>
        <button
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => move(0, 0.8)}
        >
          <Plus />
        </button>
        <button
          aria-label="Reset view"
          title="Reset view"
          onClick={() => setReset((v) => v + 1)}
        >
          <Scan />
        </button>
      </div>
    </div>
  );
}
