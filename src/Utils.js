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

// 설명 글
export class Explanation {
 constructor() 
    {
        const infoDiv = document.createElement('div')
        infoDiv.style.position = 'absolute'
        infoDiv.style.top = '5%'
        infoDiv.style.left = '50%'
        infoDiv.style.transform = 'translate(-50%, -50%)'
        infoDiv.style.color = 'white'
        infoDiv.style.fontSize = '24px'
        infoDiv.innerText = 'Move: WASD / Run: Shift / Fly: Space'
        document.body.appendChild(infoDiv)
    }
}