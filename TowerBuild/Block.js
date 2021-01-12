import Node from './Node.js';
import Physics from './Physics.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

export default class Block extends Node { 
    constructor(blockNum, tr, scene, startDirection) {
        super(tr);
        this.num = blockNum;
        this.translation = tr;
        this.scene = scene;
        if (this.scene) {
            if (this.scene.blocks.length == 0)
                this.mesh = this.scene.nodes[8].mesh;
            else
                this.mesh = this.scene.nodes[26].mesh;
        }
        this.leftAndRight = true;
        this.dropNew = false;
        this.dropped = false; // spuscena - na stolpu
        this.falling = false; // pada - 
        this.borders = this.scene.borders;
        this.lastBlock = this.scene.lastBlock;
        console.log("zadnji " + this.lastBlock);
        if (startDirection === 'left')
            this.direction = true;
        else
            this.direction = false;
        this.updateMatrix;
    }

    start() {

    }

    update(dt) {
        // ce se premika levo desno, je treba samo x spremenit
        if (this.leftAndRight) {      
            if (this.direction) {
                if (this.translation[0] <= this.borders[1][0]) {
                    this.direction = false;
                }
                this.translation[0] -= 0.06;
            }
            else {
                this.translation[0] += 0.1;
                if (this.translation[0] >= this.borders[0][0]) {
                    this.direction = true;
                }
            }
        }
        if (this.falling) {
            if (this.leftAndRight) {
                this.leftAndRight = false;
                this.dropNew = true;
            }
            if (this.scene.blocks.length == 1) { // ce je to prvi block
                if (this.translation[1] > 1) {
                    this.translation[1] -= 0.2;
                    this.translation[2] = this.borders[0][2];
                }
                else {
                    this.falling = false;
                    this.dropped = true;
                }
            }
            else { // ce ni prvi block - gledam pozicijo prejsnjega blocka da dobim x y
                console.log(this.scene.lastBlock);
                const previous = this.scene.lastBlock;
                //this.translation[2] = this.borders[0][2];
                if (this.translation[1] > previous.translation[1] + 2) {
                    this.translation[1] -= 0.2;
                    this.translation[2] = this.borders[0][2];
                }
                else {
                    this.falling = false;
                    this.dropped = true;
                }
                console.log("trenutni: " + this.translation);
                console.log("prejsnji: " + this.scene.lastBlock.translation);
            }
            
        }
    }

    drop(dt) {
        this.dropped = true;
        let move = vec3.create();
        vec3.sub(move, this.translation);
        vec3.normalize(move, move);
        move[2] = -move[2];


    }

    calculateOverlapWithPrevious() {
        const i = 1;
    }

    
}
