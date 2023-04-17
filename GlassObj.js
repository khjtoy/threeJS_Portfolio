import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

export class Glass
{
    constructor(scene, renderer)
    {
        this.currentScene = scene
        this.renderer = renderer
        this.setupModel()
        this.setupFont()
    }

    setupModel()
    {
        const geometry = new THREE.IcosahedronGeometry(1, 0);
        const material = new THREE.MeshPhysicalMaterial({
            roughness: 0,
            transmission: 1,  
            thickness: 0.5,
          });
        const mesh = new THREE.Mesh(geometry, material)
        this.mesh = mesh
        this.mesh.position.y = 1
        this.mesh.position.z = -20
        this.currentScene.add(mesh)

        
    }

    setupFont()
    {
        const loader = new FontLoader();

        loader.load("./data/NanumMyeongjo_Regular.json",
        (font) => {
            const geometry = new TextGeometry("Glass Material",
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
            );

            geometry.center();

            const material = new THREE.MeshStandardMaterial({
                color: "#ffcc00",
                roughness: 0.3,
                metalness: 0.7,
            });

            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(0, 2.5, -20)

            this.currentScene.add(mesh);
            }
        );
    }

    update()
    {
        this.mesh.rotation.x += 0.01
        this.mesh.rotation.y += 0.01
    }
}