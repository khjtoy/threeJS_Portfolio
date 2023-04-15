export const W = 'w'
export const A = 'a'
export const S = 's'
export const D = 'd'
export const SHIFT = 'shift'
export const DIRECTIONS = [W, A, S, D]

export function boxCollision({box1, box2, velocityY})
{
    // Detect for collision on the box2
    const xCollision = box1.right >= box2.left && box1.left <= box2.right
    const yCollision = box1.top >= box2.bottom && box1.bottom + velocityY <= box2.top 
    const zCollision = box1.front >= box2.back && box1.back + velocityY <= box2.front 

    return xCollision && yCollision && zCollision
}

export class KeyDisplay {

    map = new Map()

    constructor() {
        const w = document.createElement("div")
        const a = document.createElement("div")
        const s = document.createElement("div")
        const d = document.createElement("div")
        const shift = document.createElement("div")

        this.map.set(W, w)
        this.map.set(A, a)
        this.map.set(S, s)
        this.map.set(D, d)
        this.map.set(SHIFT, shift)

        this.map.forEach( (v, k) => {
            v.style.color = 'blue'
            v.style.fontSize = '50px'
            v.style.fontWeight = '800'
            v.style.position = 'absolute'
            v.textContent = k
        })

        this.updatePosition()

        this.map.forEach( (v, _) => {
            document.body.append(v)
        })
    }

     updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 150}px`
        this.map.get(A).style.top = `${window.innerHeight - 100}px`
        this.map.get(S).style.top = `${window.innerHeight - 100}px`
        this.map.get(D).style.top = `${window.innerHeight - 100}px`
        this.map.get(SHIFT).style.top = `${window.innerHeight - 100}px`

        this.map.get(W).style.left = `${300}px`
        this.map.get(A).style.left = `${200}px`
        this.map.get(S).style.left = `${300}px`
        this.map.get(D).style.left = `${400}px`
        this.map.get(SHIFT).style.left = `${50}px`
    }

     down (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red'
        }
    }

     up (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue'
        }
    }

}