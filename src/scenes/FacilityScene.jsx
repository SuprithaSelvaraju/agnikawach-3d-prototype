import { useEffect, useRef } from "react";
import * as THREE from "three";
import { COLORS, ZONE_META } from "../styles/tokens";
import { degToRad } from "../utils/geo";
import {
  makeEquipmentMesh,
  makePipeRackRun,
  makeGroundAndBoundary,
  makeZoneMesh,
  makeReleaseMarker,
  makeWindArrow,
} from "./sceneBuilders";

/* =========================================================================
   FACILITY SCENE — imperative Three.js, mounted once.
   OrbitControls is unavailable in this runtime, so camera orbit / pan /
   zoom is implemented directly with pointer + wheel listeners below.
   Moved as-is from the original single-file implementation — no
   behavior changes.
   ========================================================================= */

export default function FacilityScene({
  data,
  selectedEquipmentId,
  selectedZoneId,
  visibleZones,
  onSelectEquipment,
  onSelectZone,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef(null); // holds all mutable three.js refs across renders

  // ---- one-time scene construction ----
  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.viewportBg);
    scene.fog = new THREE.Fog(COLORS.viewportBg, 220, 480);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd5d9dd, 1.4); 
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-120, 160, -60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    sun.shadow.camera.far = 500;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    // Ground + boundary
    scene.add(makeGroundAndBoundary(data.facility));

    // Equipment (pickable)
    const equipmentMeshes = {};
    data.facility.equipment.forEach((eq) => {
      const mesh = makeEquipmentMesh(eq);
      scene.add(mesh);
      equipmentMeshes[eq.id] = mesh;
    });

    // Selection ring helper, one reusable ring per equipment id
    const selectionRings = {};
    data.facility.equipment.forEach((eq) => {
      const ringRadius = (eq.dimensions.radius || eq.dimensions.width || 3) + 1.6;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ringRadius, ringRadius + 0.35, 40),
        new THREE.MeshBasicMaterial({ color: 0xc24a1d, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(eq.position.x, 0.06, eq.position.z);
      ring.visible = false;
      scene.add(ring);
      selectionRings[eq.id] = ring;
    });

    // Persistent receptor status tint (always-on, independent of selection)
    data.affectedReceptors.forEach((r) => {
      const eq = data.facility.equipment.find((e) => e.id === r.facilityEquipmentId);
      if (!eq) return;
      const zoneMeta = r.zoneId
        ? ZONE_META[data.hazardZones.find((z) => z.id === r.zoneId).styleKey]
        : null;
      const color = zoneMeta ? zoneMeta.threeColor : 0x6b7a70;
      const radius = (eq.dimensions.radius || eq.dimensions.width || 3) + 0.9;
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(eq.position.x, 0.03, eq.position.z);
      scene.add(disc);
    });

    // Pipe racks (dressing, not pickable)
    const T104 = data.facility.equipment.find((e) => e.id === "eq-vessel-01").position;
    const P204 = data.facility.equipment.find((e) => e.id === "eq-line-01").position;
    const V301 = data.facility.equipment.find((e) => e.id === "eq-separator-01").position;
    scene.add(makePipeRackRun({ x: T104.x, y: 1.6, z: T104.z + 3 }, { x: P204.x, y: P204.y, z: P204.z + 3 }));
    scene.add(makePipeRackRun({ x: P204.x, y: P204.y, z: P204.z - 3 }, { x: V301.x, y: 2.6, z: V301.z - 4 }));

    // Hazard zones (pickable), ordered largest-first for correct blending
    const zoneMeshes = {};
    [...data.hazardZones]
      .sort((a, b) => b.areaM2 - a.areaM2)
      .forEach((zone, i) => {
        const { group, mesh } = makeZoneMesh(zone, i);
        scene.add(group);
        zoneMeshes[zone.id] = { group, mesh };
      });

    // Release marker + wind arrow
    scene.add(makeReleaseMarker(data.visualization.releaseMarker.position));
    scene.add(
      makeWindArrow(
        data.visualization.windVector.originOffset,
        data.environment.windDirectionDeg,
        data.visualization.windVector.arrowLengthM
      )
    );

    // ---- camera framing: upwind three-quarter aerial view ----
    const target = new THREE.Vector3(70, 2, 50);
    const camState = { theta: degToRad(data.environment.windDirectionDeg), elevation: degToRad(30), radius: 210 };

    const applyCamera = () => {
      const horiz = camState.radius * Math.cos(camState.elevation);
      const h = camState.radius * Math.sin(camState.elevation);
      camera.position.set(
        target.x + horiz * Math.sin(camState.theta),
        target.y + h,
        target.z + horiz * Math.cos(camState.theta)
      );
      camera.lookAt(target);
    };
    applyCamera();

    // ---- pointer / wheel controls (orbit, pan, zoom) ----
    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    let dragging = false;
    let dragButton = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;

    const onPointerDown = (e) => {
      dragging = true;
      dragButton = e.button;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = 0;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);

      if (dragButton === 2 || e.shiftKey) {
        const panSpeed = camState.radius * 0.0016;
        const right = new THREE.Vector3(Math.cos(camState.theta), 0, -Math.sin(camState.theta));
        target.addScaledVector(right, -dx * panSpeed);
        target.y += dy * panSpeed;
      } else {
        camState.theta -= dx * 0.006;
        camState.elevation = Math.min(1.45, Math.max(0.08, camState.elevation + dy * 0.006));
      }
      applyCamera();
    };
    const onPointerUp = (e) => {
      dragging = false;
      dom.releasePointerCapture(e.pointerId);
      if (moved < 5) handleClick(e);
    };
    const onWheel = (e) => {
      e.preventDefault();
      camState.radius = Math.min(420, Math.max(50, camState.radius * (1 + e.deltaY * 0.001)));
      applyCamera();
    };
    const onContextMenu = (e) => e.preventDefault();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const findPickable = (obj) => {
      let cur = obj;
      while (cur) {
        if (cur.userData && cur.userData.kind) return cur.userData;
        cur = cur.parent;
      }
      return null;
    };
    const handleClick = (e) => {
      const rect = dom.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const pickables = [...Object.values(equipmentMeshes), ...Object.values(zoneMeshes).map((z) => z.group)];
      const hits = raycaster.intersectObjects(pickables, true);
      if (hits.length === 0) {
        onSelectEquipment(null);
        onSelectZone(null);
        return;
      }
      const hitData = findPickable(hits[0].object);
      if (!hitData) return;
      if (hitData.kind === "equipment") onSelectEquipment(hitData.id);
      if (hitData.kind === "zone") onSelectZone(hitData.id);
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("contextmenu", onContextMenu);

    // ---- resize ----
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ---- render loop ----
    let raf;
    const tick = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    stateRef.current = { equipmentMeshes, selectionRings, zoneMeshes };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("contextmenu", onContextMenu);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- reactive highlight / visibility updates (no scene rebuild) ----
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    Object.entries(s.selectionRings).forEach(([id, ring]) => {
      ring.visible = id === selectedEquipmentId;
    });

    Object.values(s.zoneMeshes).forEach(({ mesh }) => {
      mesh.visible = visibleZones[mesh.userData.styleKey] !== false;
    });
  }, [selectedEquipmentId, visibleZones]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const anySelected = !!selectedZoneId;
    Object.entries(s.zoneMeshes).forEach(([id, { mesh }]) => {
      const base = mesh.userData.baseOpacity;
      if (!anySelected) mesh.material.opacity = base;
      else mesh.material.opacity = id === selectedZoneId ? Math.min(0.85, base + 0.25) : base * 0.35;
    });
  }, [selectedZoneId]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
