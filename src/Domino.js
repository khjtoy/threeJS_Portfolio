import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

export class Domino
{
    constructor(currentScene, floor, camera)
    {
        this.rigidBodies = []

        this.currentScene = currentScene
        this.floor = floor
        this.camera = camera
        this.setupAmmo()    
    }

    // Ammo 초기화
    setupAmmo()
    {
        Ammo().then((Ammo) => {
            this.Ammo = Ammo
            const overlappingPairCache = new Ammo.btDbvtBroadphase()
            const collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration()
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
            const solver = new Ammo.btSequentialImpulseConstraintSolver()

            const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
                dispatcher, overlappingPairCache, solver, collisionConfiguration)
            physicsWorld.setGravity(new Ammo.btVector3(0, -9.807, 0))

            this._physicsWorld = physicsWorld

            this.setFloorAmmo()
            this.setupSphere()
            this.setupFont()
            this.createDomino()
        })
    }

    // 바닥 Ammo 세팅
    setFloorAmmo()
    {     
        const transform = new Ammo.btTransform()
        const quaternion = { x: 0, y: 0, z: 0, w: 1 }
        transform.setIdentity()
        transform.setOrigin(new Ammo.btVector3(this.floor.position.x, this.floor.position.y, this.floor.position.z))
        transform.setRotation(
            new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
        const motionState = new Ammo.btDefaultMotionState(transform)
        
        const checkObj = new THREE.Box3().setFromObject(this.floor)
        const size = new THREE.Vector3()
        checkObj.getSize(size);
        const colShape = new Ammo.btBoxShape(
            new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5))

        const mass = 0
        colShape.calculateLocalInertia(mass)
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape);
        const body = new Ammo.btRigidBody(rbInfo)
        this._physicsWorld.addRigidBody(body) 
    }

    // 구 생성
    setupSphere()
    {
        this.spheremass = 1
        this.sphereScale = { x: 1, y: 1, z: 1 }
        this.spherePos = {x: 4, y: 1, z:-7}
        this.sphereQuaternion = { x: 0, y: 0, z: 0, w: 1 }
        const sphereGeometry = new THREE.SphereGeometry()
        const sphereMaterial = new THREE.MeshNormalMaterial() 
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)

        sphere.name = "sphere"

        sphere.position.copy(this.spherePos)
        sphere.scale.set(this.sphereScale.x, this.sphereScale.y, this.sphereScale.z)

        sphere.castShadow = true
        sphere.receiveShadow = true

        this.currentScene.add(sphere)

        this.sphere = sphere
    }

    // Click 폰트
    setupFont()
    {
        const loader = new FontLoader()

        loader.load("./data/NanumMyeongjo_Regular.json",
        (font) => {
            const geometry = new TextGeometry("Sphere Click",
                {
                    font: font,
                    size: 0.3,
                    height: 0.2,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.03,
                    bevelOffset: 0.005,
                    bevelSegments: 24   
                }
            )

            geometry.center()

            const material = new THREE.MeshStandardMaterial({
                color: "#FFFCFC",
                roughness: 0.3,
                metalness: 0.7,
            })

            const mesh = new THREE.Mesh(geometry, material)

            mesh.position.set(4, 2.5, -7)

            this.currentScene.add(mesh)
            }
        )
    }

    // 구 Ammo 세팅
    moveSphere()
    {
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        transform.setOrigin( new Ammo.btVector3(this.spherePos.x, this.spherePos.y, this.spherePos.z))
        transform.setRotation( new Ammo.btQuaternion(this.sphereQuaternion.x, this.sphereQuaternion.y, this.sphereQuaternion.z, this.sphereQuaternion.w))
        const motionState = new Ammo.btDefaultMotionState(transform)
        const colShape = new Ammo.btBoxShape(new Ammo.btVector3(this.sphereScale.x * 0.5, this.sphereScale.y * 0.5, this.sphereScale.z * 0.5))

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(this.spheremass, motionState, colShape)
        const body = new Ammo.btRigidBody( rbInfo )

        this._physicsWorld.addRigidBody(body)

        this.sphere.physicsBody = body

        this.sphere.physicsBody.setLinearVelocity(new Ammo.btVector3(0, 0, 20))
        this.rigidBodies.push(this.sphere)
    }

    // 도미노 생성
    createDomino()
    {
        const controlPoints = [
            [4., 2., -4.], 
            [4., 2., 4.],
            [-4., 2., 4.], 
            [-4., 2., -2.], 
            [2., 2., -2.],
            [2., 2., 2.],
            [-2., 2., 2.],
            [-2., 2., 0.],
            [0., 2., 0.],
        ]
        
        const p0 = new THREE.Vector3()
        const p1 = new THREE.Vector3()
        const curve = new THREE.CatmullRomCurve3(
            controlPoints.map((p, ndx) => {
                if(ndx === controlPoints.length-1) return p0.set(...p)
                p0.set(...p)
                p1.set(...controlPoints[(ndx + 1) % controlPoints.length])
                return [
                    (new THREE.Vector3()).copy(p0),
                    (new THREE.Vector3()).lerpVectors(p0, p1, 0.3),
                    (new THREE.Vector3()).lerpVectors(p0, p1, 0.7),
                ]
            }).flat(), false
        )

        // 도미노 라인
        // const points = curve.getPoints(1000);
        // const geometry = new THREE.BufferGeometry().setFromPoints(points);
        // const material = new THREE.LineBasicMaterial({color: 0xffff00});
        // const curveObject = new THREE.Line(geometry, material);
        // this.currentScene.add(curveObject);

        // 도미노 스케일
        const scale = { x: 0.75, y: 1., z: 0.1 }
        const dominoGeometry = new THREE.BoxGeometry()
        const dominoMaterial = new THREE.MeshNormalMaterial()

        // 간격
        const step = 0.0001
        const mass = 1
        let length = 0.0
        for(let t=0.; t<1.0; t+=step) {
            // curve에 대한 t에 위치
            const pt1 = curve.getPoint(t)
            // curve에 대한 pt1에 다음 위치
            const pt2 = curve.getPoint(t+step)

            length += pt1.distanceTo(pt2)

            // 실질적으로 여기서 도미노 생성
            if(length > 0.4) 
            {
                const domino = new THREE.Mesh(dominoGeometry, dominoMaterial)

                domino.name = "domino"
                domino.position.copy(pt1)
                domino.scale.set(scale.x, scale.y, scale.z)
                domino.lookAt(pt2)

                const quaternion = new THREE.Quaternion()
                quaternion.setFromEuler(domino.rotation)

                domino.castShadow = true
                domino.receiveShadow = true
                this.currentScene.add(domino)

                // 도미노 Ammo Setting
                const transform = new Ammo.btTransform()
                transform.setIdentity()
                transform.setOrigin( new Ammo.btVector3(pt1.x, pt1.y, pt1.z))
                transform.setRotation( new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
                const motionState = new Ammo.btDefaultMotionState(transform)
                const colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5))

                const localInertia = new Ammo.btVector3(0, 0, 0)
                colShape.calculateLocalInertia(mass, localInertia)
                
                const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia)
                const body = new Ammo.btRigidBody( rbInfo )

                this._physicsWorld.addRigidBody(body)
                
                domino.physicsBody = body
                this.rigidBodies.push(domino)

                // 누적 거리 0 초기화
                length = 0.0;
            }
       }
   }

   update(deltaTime)
   {
    // 물리 적용된 오브젝트들 계속 갱신
    if(this._physicsWorld) 
    {
        this._physicsWorld.stepSimulation(deltaTime)

        for (let i = 0; i < this.rigidBodies.length; i++) {
            let objThree = this.rigidBodies[i]
            let objAmmo = objThree.physicsBody
    
            let ms = objAmmo.getMotionState()
            if (ms) 
            {
                let tmpTrans = this._tmpTrans
                if(tmpTrans === undefined) tmpTrans = this._tmpTrans = new Ammo.btTransform()
                ms.getWorldTransform(tmpTrans)
            
                const pos = tmpTrans.getOrigin()
                const quat = tmpTrans.getRotation()

                objThree.position.set(pos.x(), pos.y(), pos.z())
                objThree.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w())
            }
        }         
     }
   }
}
