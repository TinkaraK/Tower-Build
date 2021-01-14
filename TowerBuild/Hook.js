import Node from './Node.js';
import Physics from './Physics.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;


export default class Hook extends Node { 
    constructor(direction, tr, scene) {
        super(tr);
        this.translation = tr;
        this.scene = scene;
        if (this.scene) {
            this.mesh = this.scene.nodes[8].mesh;
            this.hooks = this.scene.emptyHooks;
        }
        if (direction === 'left')
            this.direction = true;
        else
            this.direction = false;
        this.visible = true;
        this.updateMatrix;
    }

    start() {
        
    }

    update(speed) {
        // ce se premika levo desno, je treba samo x spremenit
        if (this.visible) {      
            if (this.direction) { // desno
                if (this.translation[0] <= this.hooks[1][0]) { // ce zadane desni rob, mora nazaj
                    this.direction = false;
                }
                this.translation[0] -= speed;
            }
            if (!this.direction ) { // levo
                this.translation[0] += speed;
                if (this.translation[0] >= this.hooks[0][0]) { // ce zadane levi rob, mora nazaj
                    this.direction = true;
                }
            }
        }
       
            //this.updateMatrix();
    }

    
    
    
}