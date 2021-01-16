import Node from './Node.js';
import Physics from './Physics.js';

const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;


export default class Dust extends Node { 
    constructor(tr, scene) {
        super(tr);
        if (this.scene) {
            this.mesh = this.scene.nodes[33].mesh;
        }
        this.visible = true;
        this.scale = [0.05,0.05,0.05];
        this.translation[1] += 1;
        
    }

    start() {
        if (this.visible) {
            this.scale[0] += 0.05;
            this.scale[1] += 0.05;
            this.scale[2] += 0.05;
            if (this.scale[0] > 1) {
                this.visible = false;
            }
        }
        
    }

    update() {
        
        
    }

    
    
    
}
