import Node from './Node.js';
import Physics from './Physics.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;


export default class Hook extends Node { 
    constructor(hookNum, tr, scene, direction) {
        super(tr);
        this.hookNum = hookNum;
        this.translation = tr;
        this.scene = scene;
        if (this.scene) {
             this.mesh = this.scene.nodes[6].mesh;
            this.hooks = this.scene.emptyHooks;
        }
        if (direction === 'left')
            this.direction = true;
        else
            this.direction = false;
        this.visible = true;
        this.scale = [0.4,0.4,0.6];
        this.updateMatrix;
    }

    start() {
        
    }

    update(speed) {
        // ce se premika levo desno, je treba samo x spremenit
        if (this.visible) {  
            //const audio = new Audio('../../common/sound/hook.mp3');
            //audio.play();
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
        if (!this.visible) {
            this.translation = [-10,-10,-10]
            this.updateMatrix();
        }
       
            //this.updateMatrix();
    }

    
    
    
}
