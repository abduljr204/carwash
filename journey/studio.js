import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewport = document.getElementById('studio-viewport');
const status = document.getElementById('studio-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  viewport.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x121418, 0.04);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(6, 3.7, 6);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.7, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.autoRotateSpeed = 0.6;
  scene.add(new THREE.HemisphereLight(0xe8efff, 0x3a4425, 3));
  const key = new THREE.DirectionalLight(0xffffff, 5);
  key.position.set(3, 7, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xccff00, 35, 15);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const fill = new THREE.PointLight(0x8eaaff, 20, 12);
  fill.position.set(2, 3, -4);
  scene.add(fill);
  const car = new THREE.Group();
  scene.add(car);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x7c8995,
    metalness: 0.8,
    roughness: 0.26,
    clearcoat: 1,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x111e28,
    metalness: 0.5,
    roughness: 0.12,
    clearcoat: 1,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x090a0c, roughness: 0.85 });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xaab4c1,
    metalness: 0.8,
    roughness: 0.3,
  });
  const lime = new THREE.MeshStandardMaterial({
    color: 0xccff00,
    emissive: 0xccff00,
    emissiveIntensity: 2,
  });
  const lamps = new THREE.MeshStandardMaterial({
    color: 0xe4f7ff,
    emissive: 0xccefff,
    emissiveIntensity: 4,
  });
  function box(w, h, d, x, y, z, material, parent = car) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  // Smooth longitudinal body profile: a sculpted hood, wide shoulders and tapered tail.
  const outline = new THREE.Shape();
  outline.moveTo(-0.85, -2.1);
  outline.quadraticCurveTo(-1.02, -1.9, -1.02, -1.3);
  outline.lineTo(-1.02, 1.45);
  outline.quadraticCurveTo(-0.96, 2.15, -0.65, 2.2);
  outline.lineTo(0.65, 2.2);
  outline.quadraticCurveTo(0.96, 2.15, 1.02, 1.45);
  outline.lineTo(1.02, -1.3);
  outline.quadraticCurveTo(1.02, -1.9, 0.85, -2.1);
  outline.closePath();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outline, {
      depth: 0.42,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.15,
      curveSegments: 20,
    }),
    metal,
  );
  body.rotation.x = -Math.PI / 2;
  body.position.y = 0.5;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), glass);
  cabin.scale.set(0.84, 0.69, 1.35);
  cabin.position.set(0, 0.93, -0.15);
  car.add(cabin);
  box(1.35, 0.09, 1.05, 0, 1.52, -0.32, metal);
  box(1.6, 0.16, 0.07, 0, 0.54, 2.23, rubber);
  box(1.5, 0.08, 0.06, 0, 0.46, 2.25, chrome);
  box(
    1.55,
    0.08,
    0.08,
    0,
    0.87,
    -2.17,
    new THREE.MeshStandardMaterial({ color: 0xff3232, emissive: 0xff2020, emissiveIntensity: 2 }),
  );
  for (const side of [-1, 1]) {
    box(0.5, 0.07, 0.09, side * 0.62, 0.89, 2.15, lamps);
    box(0.07, 0.04, 3.1, side * 1.08, 0.45, 0, lime);
    box(0.22, 0.12, 0.3, side * 1.06, 1.13, 0.4, metal);
    for (const z of [-1.37, 1.42]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.28, 40), rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.02, 0.46, z);
      car.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12), chrome);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      car.add(hub);
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 16), rubber);
      center.rotation.z = Math.PI / 2;
      center.position.copy(wheel.position);
      car.add(center);
    }
  }
  const headlights = [];
  for (const x of [-0.62, 0.62]) {
    const light = new THREE.SpotLight(0xd8f3ff, 12, 10, 0.4, 0.7);
    light.position.set(x, 0.9, 2.2);
    light.target.position.set(x, 0, 6);
    scene.add(light, light.target);
    headlights.push(light);
  }
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.1, 0.08, 96),
    new THREE.MeshStandardMaterial({ color: 0x181c20, metalness: 0.45, roughness: 0.4 }),
  );
  scene.add(platform);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.012, 8, 100), lime);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  scene.add(ring);
  const positions = new Float32Array(450 * 3);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 5;
    positions[i + 1] = Math.random() * 3;
    positions[i + 2] = (Math.random() - 0.5) * 5;
  }
  const particles = new THREE.BufferGeometry();
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mist = new THREE.Points(
    particles,
    new THREE.PointsMaterial({
      color: 0xd9ffad,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  mist.visible = false;
  scene.add(mist);
  const toggle = (id, callback) => {
    const button = document.getElementById(id);
    button.disabled = false;
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(on));
      callback(on);
    });
  };
  toggle('studio-rotate', (on) => {
    controls.autoRotate = on;
  });
  toggle('studio-lights', (on) => {
    lamps.emissiveIntensity = on ? 4 : 0;
    headlights.forEach((light) => {
      light.visible = on;
    });
  });
  toggle('studio-mist', (on) => {
    mist.visible = on;
  });
  viewport.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), event.key === 'ArrowLeft' ? 0.15 : -0.15);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  });
  const resize = new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  });
  resize.observe(viewport);
  let visible = true;
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  observer.observe(viewport);
  let previous = performance.now();
  renderer.setAnimationLoop((now) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!visible || document.hidden) return;
    if (!reducedMotion.matches) {
      rim.intensity = 30 + Math.sin(now * 0.0007) * 5;
      if (mist.visible) {
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 0.7;
          if (positions[i] < 0.1) positions[i] = 3;
        }
        particles.attributes.position.needsUpdate = true;
      }
    }
    controls.update(delta);
    renderer.render(scene, camera);
  });
  document.getElementById('hero-car').hidden = true;
  document.querySelector('.hero-canvas').classList.add('studio-ready');
  status.textContent = '360° STUDIO / DRAG TO EXPLORE';
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    viewport.hidden = true;
    document.getElementById('hero-car').hidden = false;
    status.textContent = '3D paused. Reload to restart the studio.';
    document.querySelectorAll('.studio-controls button').forEach((button) => {
      button.disabled = true;
    });
  });
  window.addEventListener(
    'pagehide',
    () => {
      renderer.setAnimationLoop(null);
      controls.dispose();
      resize.disconnect();
      observer.disconnect();
      scene.traverse((item) => {
        item.geometry?.dispose();
        if (item.material) item.material.dispose();
      });
      renderer.dispose();
    },
    { once: true },
  );
} catch (error) {
  viewport.hidden = true;
  status.textContent = 'Vehicle preview / 3D unavailable on this device';
  console.warn('Studio fallback:', error.message);
}
