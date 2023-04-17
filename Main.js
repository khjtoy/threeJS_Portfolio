import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CharacterControls } from './CharacterControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KeyDisplay } from './Utils.js';
import { Domino } from './Domino.js';
import { Glass } from './GlassObj.js'

// Scene Setting
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// Camera Setting
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// Renderer Setting
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
//renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8

// Controls Setting
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// Lighting Setting
light()

// Floor Setting
let floor
generateFloor()

// Player Setting
var characterControls
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);

    const gltfAnimations= gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map()
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
        animationsMap.set(a.name, mixer.clipAction(a))
    })

    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, floor,  'Idle')
});

// Domino Setting
var domino = new Domino(scene, floor, camera)

// glass Setting
var glass = new Glass(scene, renderer)

// Key Setting
const keysPressed = { }
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)

    if(event.code === "Space")
    {
        characterControls.Jump()
    }
    else if (event.code === "ShiftLeft") 
    {
        characterControls.setRunToggle(true)
    }
    else
        (keysPressed)[event.key.toLowerCase()] = true
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    if (event.code === "ShiftLeft") 
    {
        characterControls.setRunToggle(false)
    }

    (keysPressed)[event.key.toLowerCase()] = false
}, false);


const clock = new THREE.Clock();
// Update
function animate() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    if(domino)
    {
        domino.update(mixerUpdateDelta)
    }
    if(glass)
    {
        glass.update()
    }
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// ResizeHandler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition()
}
window.addEventListener('resize', onWindowResize);

function generateFloor() {
    // Texture
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load("./textures/grounded/GroundForest003_COL_VAR1_1K.jpg");
    const sandNormalMap = textureLoader.load("./textures/grounded/GroundForest003_NRM_1K.jpg");
    const sandHeightMap = textureLoader.load("./textures/grounded/GroundForest003_DISP_1K.jpg");
    const sandAmbientOcclusion = textureLoader.load("./textures/grounded/GroundForest003_AO_1K.jpg");

    const WIDTH = 80
    const LENGTH = 80

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial(
        {
            map: sandBaseColor, normalMap: sandNormalMap,
            displacementMap: sandHeightMap, displacementScale: 0.1,
            aoMap: sandAmbientOcclusion
        })
    wrapAndRepeatTexture(material.map)
    wrapAndRepeatTexture(material.normalMap)
    wrapAndRepeatTexture(material.displacementMap)
    wrapAndRepeatTexture(material.aoMap)

    floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    scene.add(floor)

    const bbox = new THREE.Box3().setFromObject(floor);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    console.log(size.x, size.y, size.z);
}

function wrapAndRepeatTexture (map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10
}

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true; 
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;

    const dirLight2 = new THREE.SpotLight(0xFF0000, 2) 
    dirLight.position.set(- 60, 100, - 10);

    scene.add(dirLight);
    scene.add(dirLight2)
}