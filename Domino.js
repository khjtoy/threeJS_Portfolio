import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class Domino
{
    constructor(currentScene, floor, player)
    {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        this.currentScene = currentScene
        this.floor = floor
        this.player = player
        this.setupAmmo()    
    }

    setupAmmo()
    {
        Ammo().then((Ammo) => {
            this.Ammo = Ammo
            const overlappingPairCache = new Ammo.btDbvtBroadphase();
            const collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            const solver = new Ammo.btSequentialImpulseConstraintSolver();

            const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
                dispatcher, overlappingPairCache, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, -9.807, 0));

            this._physicsWorld = physicsWorld;

            this.setFloorAmmo()
            this.setPlayerAmmo()
            this.createDomino()
        });
    }

    setFloorAmmo()
    {     
        const transform = new Ammo.btTransform();
        const quaternion = { x: 0, y: 0, z: 0, w: 1 };
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(this.floor.position.x, this.floor.position.y, this.floor.position.z))
        transform.setRotation(
            new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
        const motionState = new Ammo.btDefaultMotionState(transform);
        
        const checkObj = new THREE.Box3().setFromObject(this.floor);
        const size = new THREE.Vector3();
        checkObj.getSize(size); 
        const colShape = new Ammo.btBoxShape(
            new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5))

        const mass = 0;
        colShape.calculateLocalInertia(mass);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape);
        const body = new Ammo.btRigidBody(rbInfo);
        this._physicsWorld.addRigidBody(body);    
    }

    setPlayerAmmo()
    {
        const mass = 1;

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( this.player.position.x, this.player.position.y, this.player.position.z ) );
        transform.setRotation( new Ammo.btQuaternion( this.player.quaternion.x, this.player.quaternion.y, this.player.quaternion.z, this.player.quaternion.w ) );
        const motionState = new Ammo.btDefaultMotionState( transform );

        const checkObj = new THREE.Box3().setFromObject(this.player);
        const size = new THREE.Vector3();
        checkObj.getSize(size); 
        const colShape = new Ammo.btBoxShape(
            new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5))

        const localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        const body = new Ammo.btRigidBody( rbInfo );
        this._physicsWorld.addRigidBody(body);
        
        this.player.physicsBody = body;
    }

    createDomino()
    {
        const controlPoints = [
            [-10., 2., -10.],
            [ 10., 2., -10.],
            [ 10., 2.,  10.],
            [-10., 2., 10.],
            [-10., 2., -8.],
            [8., 2., -8.],
            [8., 2., 8.],
            [-8., 2., 8.], 
            [-8., 2., -6.],
            [6., 2., -6.],
            [6., 2., 6.],
            [-6., 2., 6.],
            [-6., 2., -4.],
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
                if(ndx === controlPoints.length-1) return p0.set(...p);
                p0.set(...p);
                p1.set(...controlPoints[(ndx + 1) % controlPoints.length]);
                return [
                    (new THREE.Vector3()).copy(p0),
                    (new THREE.Vector3()).lerpVectors(p0, p1, 0.3),
                    (new THREE.Vector3()).lerpVectors(p0, p1, 0.7),
                ];
            }).flat(), false
        )

        // 도미노 라인
        // const points = curve.getPoints(1000);
        // const geometry = new THREE.BufferGeometry().setFromPoints(points);
        // const material = new THREE.LineBasicMaterial({color: 0xffff00});
        // const curveObject = new THREE.Line(geometry, material);
        // this.currentScene.add(curveObject);

        // 도미노 스케일
        const scale = { x: 0.75, y: 1., z: 0.1 };
        const dominoGeometry = new THREE.BoxGeometry();
        const dominoMaterial = new THREE.MeshNormalMaterial(); 

        // 간격
        const step = 0.0001;
        const mass = 1;
        let length = 0.0;
        for(let t=0.; t<1.0; t+=step) {
            // 커브에 대한 t의 위치
            const pt1 = curve.getPoint(t);
            // 커브에 대한 pt1 다음 위치
            const pt2 = curve.getPoint(t+step);

            length += pt1.distanceTo(pt2);

            //거리가 0.4보다 클 때 도미노 생성
            if(length > 0.4) 
            {
                const domino = new THREE.Mesh(dominoGeometry, dominoMaterial);
                domino.position.copy(pt1);
                domino.scale.set(scale.x, scale.y, scale.z);
                domino.lookAt(pt2);

                const quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(domino.rotation);

                domino.castShadow = true;
                domino.receiveShadow = true;
                this.currentScene.add(domino);

                const transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3(pt1.x, pt1.y, pt1.z));
                transform.setRotation( new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
                const motionState = new Ammo.btDefaultMotionState(transform);
                const colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));

                const localInertia = new Ammo.btVector3(0, 0, 0);
                colShape.calculateLocalInertia(mass, localInertia);
                
                const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
                const body = new Ammo.btRigidBody( rbInfo );
                this._physicsWorld.addRigidBody(body);
                
                domino.physicsBody = body;

                // 누적 거리 0 초기화
                length = 0.0;
            }
       }
   }

   update(deltaTime)
   {
    if(this._physicsWorld) 
    {
        this._physicsWorld.stepSimulation(deltaTime);
        this.currentScene.traverse(obj3d => {
            if(obj3d instanceof THREE.Mesh) 
            {
                const objThree = obj3d;
                const objAmmo = objThree.physicsBody;
                if(objAmmo) 
                {
                    const motionState = objAmmo.getMotionState();
                            
                    if(motionState) 
                    {
                        let tmpTrans = this._tmpTrans;
                        if(tmpTrans === undefined) tmpTrans = this._tmpTrans = new Ammo.btTransform();
                        motionState.getWorldTransform(tmpTrans);
                        
                        const pos = tmpTrans.getOrigin();
                        const quat = tmpTrans.getRotation();
                        
                        objThree.position.set(pos.x(), pos.y(), pos.z());
                        objThree.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
                    }       
                }
            }
        });            
    }
   }
}
