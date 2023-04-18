import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CharacterControls } from './CharacterControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Domino } from './Domino.js';
import { Glass } from './GlassObj.js'
import { Explanation } from './Utils.js';

// Scene 세팅
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa8def0)

// Camera 세팅
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.y = 5
camera.position.z = 40
camera.position.x = 0

// Renderer 세팅
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
//renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.8

// Controls 세팅
const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.update()

// Lighting 세팅
light()

// Floor 세팅
let floor
generateFloor()

// Domino 세팅
var domino = new Domino(scene, floor, camera)

// Player 세팅
var characterControls
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
    const model = gltf.scene
    model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true
    });
    scene.add(model)

    const gltfAnimations= gltf.animations
    const mixer = new THREE.AnimationMixer(model)
    const animationsMap = new Map()
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
        animationsMap.set(a.name, mixer.clipAction(a))
    })

    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, floor,  'Idle')
})

// glass 세팅
var glass = new Glass(scene, renderer)

// 설명 세팅
var explation = new Explanation()

// Key 세팅
const keysPressed = { }
document.addEventListener('keydown', (event) => {
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
    if (event.code === "ShiftLeft") 
    {
        characterControls.setRunToggle(false)
    }

    (keysPressed)[event.key.toLowerCase()] = false
}, false)

const raycaster = new THREE.Raycaster()
const clickMouse = new THREE.Vector2()
document.addEventListener('click', event => {
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    raycaster.setFromCamera(clickMouse, camera)
    const found = raycaster.intersectObjects(scene.children)
    if(found.length > 0 && found[0].object.name == "sphere")
    {
        domino.moveSphere()
    }
})


const clock = new THREE.Clock()
// Update
function animate() {
    let mixerUpdateDelta = clock.getDelta()
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed)
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
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}
document.body.appendChild(renderer.domElement)
animate()

// 화면 사이즈 바뀌면 다시 설정
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize)

// 바닥 생성
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

    const bbox = new THREE.Box3().setFromObject(floor)
    const size = new THREE.Vector3()
    bbox.getSize(size)
    
    console.log(size.x, size.y, size.z)
}

// 텍스쳐 매핑 반복
function wrapAndRepeatTexture (map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10
}

// Game Lighting 처리
function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, - 10)
    dirLight.castShadow = true
    dirLight.shadow.camera.top = 50
    dirLight.shadow.camera.bottom = - 50
    dirLight.shadow.camera.left = - 50
    dirLight.shadow.camera.right = 50
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 200
    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096

    const spotLight1 = new THREE.SpotLight(0xFF0000, 2) 
    spotLight1.castShadow = true

    const spotLight2 = new THREE.SpotLight(0x0000FF, 2)
    spotLight2.castShadow = true
    spotLight2.position.set(0, 1, 10)

    console.log(spotLight2.position)

    scene.add(dirLight)
    scene.add(spotLight1)
    scene.add(spotLight2)
}