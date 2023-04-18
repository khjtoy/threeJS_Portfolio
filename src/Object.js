import * as THREE from 'three'

export class Object extends THREE.Object3D {
  constructor(velocity = { x: 0, y: 0, z: 0 }, position = { x: 0, y: 0, z: 0 }) {
    super()
    this.velocity = velocity
    this.position = position
  }

  update() {}
}