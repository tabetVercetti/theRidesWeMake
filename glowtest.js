import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { TWEEN } from 'three/addons/libs/tween.module.min.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';


// Set up scene
const scene = new THREE.Scene();

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Create glow material for sphere2
const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      viewVector: { type: 'v3', value: camera.position }
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.3 - dot(vNormal, vNormel), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float intensity;
      void main() {
        vec3 glow = vec3(0, 1, 0); // Glow color (adjust as needed)
        vec3 finalColor = mix(glow, vec3(1, 1, 1), intensity);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

// Create spheres
const sphere1 = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
sphere1.position.x = -10;

const sphere2 = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),glowMaterial
);
sphere2.position.x = 10;
//sphere2.material = glowMaterial;

// Add spheres to the scene
scene.add(sphere1, sphere2);



// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Animation loop
const animate = function () {
  requestAnimationFrame(animate);

  // Rotate spheres or perform other animations here if desired

  renderer.render(scene, camera);
};

// Start animation loop
animate();
