import Node from './Node.js';
import Physics from './Physics.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;


export default class Block extends Node { 
    constructor(blockNum, tr, scene, startDirection, blockBefore) {
        super(tr);
        this.blockNum = blockNum;
        this.translation = tr;
        this.scene = scene;
        if (this.scene) {
            if (this.scene.blocks.length == 0) {
                this.mesh = this.scene.nodes[42].mesh; //8
            } 
            else
                this.mesh = this.scene.nodes[41].mesh;
        }
         
        
        this.r = [0,0,0]; // rotacija
        this.leftAndRight = true; // ali se vozi levo in desno
        this.dropNew = false; // kdaj lahko dodas novega
        this.dropped = false; // ko je postavljen na stolpu
        this.falling = false; // pada 
        this.fallingDown = false;
        this.tippingOver = false;
        this.rotationDirection = true;
        this.collapsing = false;
        this.gameOver = false;
        this.generateDust = false;
        this.borders = this.scene.borders;
        this.blockBefore = blockBefore; // njegov predhodnik
        if (startDirection === 'left')
            this.direction = true;
        else
            this.direction = false;
        
        this.updateMatrix;
    }

    start() {
        
    }

    update(speed) {
        // ce se premika levo desno, je treba samo x spremenit
        if (this.leftAndRight) {      
            if (this.direction) { // desno
                if (this.translation[0] <= this.borders[1][0]) { // ce zadane desni rob, mora nazaj
                    this.direction = false;
                }
                this.translation[0] -= speed;
            }
            if (!this.direction ) { // levo
                this.translation[0] += speed;
                if (this.translation[0] >= this.borders[0][0]) { // ce zadane levi rob, mora nazaj
                    this.direction = true;
                }
            }
        }
        // ce pada - gre po y navzdol, treba je gledat ce se ujema z y+2 prejsnjim in potem povrsino po x
        if (this.falling) {
            this.leftAndRight = false;
            // ce je prvi block:
            if (this.scene.blocks.length == 1){// ce je to prvi block
                if (this.translation[1] > 1.2) { // ce pada - da se ni na tleh
                    this.translation[1] -= 0.2;
                    this.translation[2] = this.borders[0][2];
                }
                else { // ce pristane na tleh
                    this.falling = false; // ne pada vec
                    this.dropped = true; // je dropped
                    this.dropNew = true; // dodaj novega
                    this.scene.score ++; // povecaj score - ker je bilo uredu
                    const audio = new Audio('../../common/sound/drop.mp3');
                    audio.play();
                }
            }
            // ce ni prvi block - ima blockBefore
            else { 
                // ce je vecji --> padaj
                if (this.translation[1] > this.blockBefore.translation[1] + 2) {
                    this.translation[1] -= 0.2;
                    this.translation[2] = this.blockBefore.translation[2];
                }
                // ce je manjsi --> pristani
                if (this.translation[1] < this.blockBefore.translation[1] + 2.2 ||this.translation[1] < this.blockBefore.translation[1] + 1.8) {
                    this.falling = false;
                    this.translation[1] = this.blockBefore.translation[1] + 2;
                    let diff = this.translation[0] - this.blockBefore.translation[0]
                    let c = Math.abs(diff);
                    this.scene.sumC += c;
                    // ce je cez vec kot polovico, se sestavi
                    if (c <= 1) {
                        console.log("pristane")
                        this.dropped = true;
                        this.dropNew = true; // dodaj novega
                        this.generateDust = true;
                        this.scene.score ++; // povecaj score - ker je bilo uredu
                        const audio = new Audio('../../common/sound/drop.mp3');
                        audio.play();
                    }
                    // ce popolnoma zgresi, zacne padati proti tlem
                    else if (c > 2) {
                       // console.log("pada proti tlem")
                        this.fallingDown = true;
                        
                    }
                    // ce je zadnji block zamaknjen za vec kot eno kocko od prvega
                    else if (Math.abs(this.translation[0] - this.scene.firstBlock.translation[0]) > 2) {
                        console.log("unstable");
                        this.tippingOver = true;
                        // ugotovi, v katero smer se more prevrnt
                        if (diff > 0) {
                            //console.log("vecji " + diff); // levo
                            this.rotationDirection = false;
                        }
                        else {
                            //console.log("manjsi " + diff); // desno
                            this.rotationDirection = true;
                        }
                        for (let i = 5; i < 0; i++) {
                            console.log("collapsing" + i);
                            this.scene.blocks[this.scene.blocks.length - i].collapsing = true;
                        }
                        
                    }
                    // ce zadane spodnjega, ampak premalo, se prevrne
                    else {
                        this.tippingOver = true;
                        this.generateDust = true;
                        // ugotovi, v katero smer se more prevrnt
                        if (diff > 0) {
                            //console.log("vecji " + diff); // levo
                            this.rotationDirection = false;
                        }
                        else {
                            //console.log("manjsi " + diff); // desno
                            this.rotationDirection = true;
                        }
                        const audio = new Audio('../../common/sound/drop.mp3');
                        audio.play();
                    }
                }
            }
        }
        if (this.fallingDown) {
            if (this.translation[1] <= 1 || this.scene.blocks.length > 6 && this.translation[1] <= this.scene.blocks[this.blockNum - 5].translation[1]) { // ce pada - da se ni na tleh
                this.fallingDown = false; // ne pada vec
                this.gameOver = true;
            }
            else { // ce pristane na tleh
              
                this.translation[1] -= 0.2;
                this.translation[2] = this.borders[0][2];
                //const audio = new Audio('../../common/sound/drop.mp3');
                 //   audio.play();
            }
        }
        if (this.tippingOver) {
            const pi = Math.PI;
            // ce gre v desno
            if (this.rotationDirection) {
                this.r[2] += 0.1;
                this.translation[1] -= 0.2; // pada
                this.translation[0] -= 0.15; // zamakne
                this.translation[2] = this.translation[2];
                if (this.translation[1] <= 1 || this.scene.blocks.length > 6 && this.translation[1] <= this.scene.blocks[this.blockNum - 5].translation[1]) {
                    this.tippingOver = false;
                    this.generateDust = true;
                    this.gameOver = true;
                }
            }
            // ce gre v levo
            else {
                this.r[2] -= 0.1;
                this.translation[1] -= 0.2; // pada
                this.translation[0] += 0.15; // zamakne
                this.translation[2] = this.translation[2];
                if (this.translation[1] <= 1 || this.scene.blocks.length > 6 && this.translation[1] <= this.scene.blocks[this.blockNum - 5].translation[1]) {
                    this.tippingOver = false;
                    this.generateDust = true;
                    this.gameOver = true;
                }
            }
            const degrees = this.r.map(x => x * 180 / pi);
            quat.fromEuler(this.rotation, ...degrees);
        }
        if (this.collapsing) {
            this.translation[1] -= 0.2;
        }
            this.updateMatrix();
    }

    
}
