import Node from './Node.js';
import Physics from './Physics.js';

const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;


export default class Dust extends Node { 
    constructor(dustNum, tr, scene) {
        super(tr);
        this.translation = tr;
        this.dustNum = dustNum;
        this.scene = scene;
        if (this.scene) {
            //34 - 39
            //let randomMesh = Math.floor(Math.random() * (39 - 34) + 34);
            this.mesh = this.scene.nodes[40].mesh;
        }
        this.visible = true;
        this.scale = [0.01, 0.01, 0.01];
        this.translation[0] -= 0;
        this.updateMatrix();
    }

    start() {
    }
    /*
        translation[0] = levo desno = x
        translation[1] = dol gor = y
        translation[2] = naprej nazaj = z
    
    */ 
    
    update() {
        if (this.visible) {
            if (this.scale[0] < 0.2) {
                this.scale = vec3.add(this.scale, this.scale, [0.015, 0.015, 0.015]);
            }
            else {
                this.visible = false;
                this.translation = [-10,-10,-10];
            }
        }        
    }   
    
}
