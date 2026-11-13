import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 16.8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const helix = new THREE.Group();
scene.add(helix);

// Thousands of independent particles travel through two broad, intertwined
// currents. Their positions are calculated in the vertex shader each frame.
const positions = [];
const sizes = [];
const opacities = [];
const seeds = [];
const speeds = [];
const lateral = [];
const depth = [];
const height = 7.7;
const radius = 0.88;
let randomState = 7919;
function random() {
  randomState = (1664525 * randomState + 1013904223) >>> 0;
  return randomState / 4294967296;
}

function particle(strand, bridge = false) {
  const u = random();
  const angle = random() * Math.PI * 2;
  const width = bridge ? 0.10 : Math.pow(random(), 0.75) * 0.33;
  positions.push(u, strand, bridge ? random() * 1.8 - 0.9 : 0);
  lateral.push(Math.cos(angle) * width);
  depth.push(Math.sin(angle) * width);
  sizes.push((bridge ? 1.45 : 1.65) + random() * (bridge ? 0.9 : 1.7));
  opacities.push((bridge ? 0.14 : 0.33) + random() * (bridge ? 0.25 : 0.58));
  seeds.push(random() * 1000);
  speeds.push(0.32 + random() * 0.6);
}

for (let i = 0; i < 2700; i++) {
  particle(0);
  particle(1);
}
// A little moving dust between the currents hints at the DNA's cross-links
// without turning the swarm into a rigid ladder.
for (let i = 0; i < 540; i++) particle(2, true);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
geometry.setAttribute('aOpacity', new THREE.Float32BufferAttribute(opacities, 1));
geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
geometry.setAttribute('aLateral', new THREE.Float32BufferAttribute(lateral, 1));
geometry.setAttribute('aDepth', new THREE.Float32BufferAttribute(depth, 1));
geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);

const material = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
  vertexShader: `
    attribute float aSize;
    attribute float aOpacity;
    attribute float aSeed;
    attribute float aSpeed;
    attribute float aLateral;
    attribute float aDepth;
    uniform float uTime;
    uniform float uPixelRatio;
    varying float vOpacity;
    void main() {
      const float HEIGHT = 7.7;
      const float TWIST = 18.8495559;
      float progress = mod(position.x * HEIGHT + uTime * aSpeed, HEIGHT);
      float y = progress - HEIGHT * 0.5;
      float theta = progress / HEIGHT * TWIST
        + (position.y < 1.5 ? position.y * 3.14159265 : 0.0);
      float flow = uTime * (0.78 + aSpeed * 0.6) + aSeed;
      float radial = aLateral + sin(flow) * 0.055;
      float tangent = aDepth + cos(flow * 0.82) * 0.055;
      float r = position.y > 1.5 ? position.z * 0.88 : 0.88;
      vec3 p = vec3(
        cos(theta) * (r + radial) - sin(theta) * tangent,
        y + sin(flow * 1.25) * 0.045,
        sin(theta) * (r + radial) + cos(theta) * tangent
      );
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float depth = clamp(15.0 / -mv.z, 0.65, 1.5);
      gl_PointSize = aSize * uPixelRatio * depth;
      gl_Position = projectionMatrix * mv;
      float edgeFade = smoothstep(0.0, 0.5, progress)
        * (1.0 - smoothstep(HEIGHT - 0.5, HEIGHT, progress));
      vOpacity = aOpacity * edgeFade * (0.85 + 0.15 * sin(flow * 1.5));
    }
  `,
  fragmentShader: `
    precision mediump float;
    varying float vOpacity;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
      float core = 1.0 - smoothstep(0.10, 0.46, d);
      float halo = (1.0 - smoothstep(0.10, 1.0, d)) * 0.23;
      float alpha = (core + halo) * vOpacity;
      if (alpha < 0.012) discard;
      gl_FragColor = vec4(vec3(1.0), alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

helix.add(new THREE.Points(geometry, material));

const pointer = { x: 0, y: 0 };
let currentX = 0;
let currentY = 0;
let last = performance.now();
let rotation = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  const vertical = height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const horizontal = (radius * 2.6) / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  camera.position.z = Math.max(vertical * 1.24, horizontal * 1.22, 12.5);
  camera.updateProjectionMatrix();
  material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('pointermove', event => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });
window.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
resize();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!reducedMotion.matches) rotation += dt * 0.19;
  currentX += (pointer.x - currentX) * Math.min(dt * 2.2, 1);
  currentY += (pointer.y - currentY) * Math.min(dt * 2.2, 1);
  helix.rotation.y = rotation + currentX * 0.22;
  helix.rotation.x = -currentY * 0.09;
  helix.position.x = currentX * 0.13;
  helix.position.y = -currentY * 0.10;
  material.uniforms.uTime.value = reducedMotion.matches ? 0 : now * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
