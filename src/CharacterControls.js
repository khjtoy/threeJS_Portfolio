import * as THREE from 'three'
import { A, D, DIRECTIONS, S, W, boxCollision } from './Utils.js'
import { CollisionBox } from './CollisionBox.js'

export class CharacterControls 
{

    // 상태
    toggleRun = false
    currentAction = ''
    
    // 임시 데이터
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    
    // walk & run
    fadeDuration = 0.2
    runVelocity = 5
    walkVelocity = 2

    // jump
    jumpPower = 1.5
    jumpVelocity = 0
    gravity = -0.002

    constructor(model,
        mixer, animationsMap,
        orbitControl, camera, floor,
        currentAction) {
        this.model = model
        this.floor = floor
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = currentAction
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play()
            }
        })
        this.orbitControl = orbitControl
        this.camera = camera
        this.updateCameraTarget(0,0)

        this.playerCollison = new CollisionBox(this.model, 0.9)
        this.floorCollision = new CollisionBox(this.floor)

        model.position.y = 3
        model.position.z = 10
    }

    setRunToggle(value) {
        this.toggleRun = value
    }

    update(delta, keysPressed) {

        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)

        var play = '';
        if (directionPressed && this.toggleRun) {
            play = 'Run'
        } else if (directionPressed) {
            play = 'Walk'
        } else {
            play = 'Idle'
        }

        // 중력
        this.applyGravity()

        if (this.currentAction != play) {
            const toPlay = this.animationsMap.get(play)
            const current = this.animationsMap.get(this.currentAction)

            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play
        }

        this.mixer.update(delta)

        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
            // 카메라 방향으로 계삳
            var angleYCameraDirection = Math.atan2(
                    (this.camera.position.x - this.model.position.x), 
                    (this.camera.position.z - this.model.position.z))
            // 대각선 이동 각도 오프셋
            var directionOffset = this.directionOffset(keysPressed)

            // 모델 회전
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // 방향 계산
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity

            // 모델 움직임 & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
            this.model.position.x += moveX
            this.model.position.z += moveZ
            this.updateCameraTarget(moveX, moveZ)
        }
    }

    // 카메라 움직임
     updateCameraTarget(moveX, moveZ) {
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        // 카메라 업데이트
        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 1
        this.cameraTarget.z = this.model.position.z
        this.orbitControl.target = this.cameraTarget
    }

    // 키 누른거에 따라 방향 설정
    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }

    // 중력 테스트 용
    Jump()
    {
        if(!this.grounded) return

        this.grounded = false
        this.model.position.y = this.jumpPower 
    }

    // 중력 적용
    applyGravity()
    {
        // acceleration
        this.jumpVelocity += this.gravity

        this.playerCollison.updateSides()
        this.floorCollision.updateSides()

        if(boxCollision({box1: this.playerCollison, box2: this.floorCollision, velocityY: this.jumpVelocity}))
        {
            // 마찰
            this.jumpVelocity *= 0.01
            this.jumpVelocity = -this.jumpVelocity
            this.grounded = true          
        }
        else this.model.position.y += this.jumpVelocity 
    }
}