import * as THREE from 'three'

// 충돌 박스를 만들어 줌
export class CollisionBox
{
    constructor(obj, offset = 0)
    {
        this.obj = obj
        const checkObj = new THREE.Box3().setFromObject(this.obj)
        const size = new THREE.Vector3()
        checkObj.getSize(size)

        this.objSize = size
        this.offset = offset

        this.updateSides()
    }

    updateSides()
    {
      this.right = this.obj.position.x + this.objSize.x / 2
      this.left = this.obj.position.x - this.objSize.x / 2
  
      this.top = this.obj.position.y + this.objSize.y / 2
      this.bottom = (this.obj.position.y - this.objSize.y / 2) + this.offset
  
      this.front = this.obj.position.z + this.objSize.z / 2
      this.back = this.obj.position.z - this.objSize.z / 2
    }
}