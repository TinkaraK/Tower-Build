import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import GLTFLoader from './GLTFLoader.js';
import Renderer from './Renderer.js';
import Block from './Block.js';
import Border from './Borders.js';
import Light from './Light.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
let paused = true;
let gameLost = false;
let highScore = 0;

document.getElementById("startGame").style.visibility = "visible";
document.getElementById("lostGame").style.visibility = "hidden";
document.getElementById("endDiv").style.visibility = "hidden";
document.getElementById("scoreDiv").style.visibility = "hidden";
document.getElementById("overlay").style.visibility = "hidden";
document.getElementById("startDiv").style.visibility = "visible";

class App extends Application {

    async start() {
        this.speed = 0.1;

        this.loader = new GLTFLoader();
        await this.loader.load('../../common/models/scene4/scene4.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');
        this.emptyLeft = await this.loader.loadNode('Border0');
        this.emptyRight = await this.loader.loadNode('Border1');
        this.crane = await this.loader.loadNode('crane');
        
        this.light = new Light();

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }


        document.getElementById("pause").addEventListener('click', this.pauseGame);
        
        document.getElementById("startButton").addEventListener('click', this.startGame);
        document.addEventListener('keyup', e => {
            if (e.code == "Space") {
                this.dropBlock();
            }
        })

        
        this.scene.blocks = [];
        this.scene.score = 0;
        this.scene.borders = [this.emptyLeft.translation, this.emptyRight.translation];
        

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
        //this.paused = true;
        this.addBlock();
        this.startTime = Date.now();
        
    }


    startGame() {
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("startDiv").style.visibility = "hidden";
        document.getElementById("overlay").style.visibility = "visible";
        this.paused = false;
    }

    pauseGame() {
        this.paused = !this.paused;
    }

    endGame() {
        this.paused = true;
        console.log("konec")
        document.getElementById("endDiv").style.visibility = "visible";
        this.score = this.scene.score;
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("scoreDiv").style.visibility = "visible";
        document.getElementById("overlay").style.visibility = "hidden";
        document.getElementById("restartDiv").style.visibility = "visible";
    }

    addBlock() {
        console.log("dodan nov block");
        let t;
        let startDirection;
        if (Math.random() < 0.5) { // ce je true, se spawna levo --> gre proti desni
            t = vec3.clone(this.emptyLeft.translation);
            startDirection = "left";
        }
        else { // ce je false, se spawna desno --> gre proti levi
            t = vec3.clone(this.emptyRight.translation);
            startDirection = "right";
        }
        let blockBefore;
        if (this.scene.blocks.length >= 1) // ce ni prvi block, ima predhodnika - zadnjega v seznamu blockov
            blockBefore = this.scene.blocks[this.scene.blocks.length - 1];
        else { // ce je prvi block, nima predhodnika
            blockBefore = null;
        }
        let block = new Block(this.scene.blocks.length, t, this.scene, startDirection, blockBefore); // ta blok se premika
        this.scene.blocks.push(block);
        this.scene.addNode(block);
        
    }

   
    dropBlock() {
        this.scene.blocks[this.scene.blocks.length - 1].falling = true; 
        console.log("spusti block")
        this.updateCamera(); 
        this.updateLevel();
    }


    updateLevel() {
        if (this.scene.blocks.length < 6) {
            this.emptyLeft.translation[1] += 1;
            this.emptyRight.translation[1] += 1;
            this.crane.translation[1] += 1;
        }
        else {
            this.emptyLeft.translation[1] += 2;
            this.emptyRight.translation[1] += 2;
            this.crane.translation[1] += 2;
        }
       
        this.emptyLeft.updateMatrix();
        this.emptyRight.updateMatrix();
        this.crane.updateMatrix();
    }

    updateCamera() {
        if (this.scene.blocks.length < 6)
            this.camera.translation[2] -= 1;
        else
            this.camera.translation[2] -= 2;
        this.camera.updateMatrix();
        
    }

    update() {
        if (this.scene) {
            if (!this.paused) {
                for (const block of this.scene.blocks) {
                    if (block) {
                        block.update(this.speed);
                        block.updateMatrix();
                        if (block.gameOver) {
                            this.endGame();
                        }
                        if (block.dropNew) {
                            this.addBlock();
                            block.dropNew = false;
                        }  
                    }
                   
                }
            document.getElementById("score").innerHTML = this.scene.score;
            document.getElementById("scoreSpan").innerHTML = this.scene.score;  
            }
            if (this.paused) {
                console.log("paused");
            }
        }
    }   
        

    render() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera, this.light);
        }
    }

    

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }

 
    initHandlers() {
        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);
        //document.addEventListener('keydown', this.keydownHandler);
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.camera.enable();
        } else {
            this.camera.disable();
        }
    }

}



document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new dat.GUI();
    gui.add(app, 'speed', 0.05, 0.5);
    gui.add(app, 'enableCamera');
    highScore = Math.max(highScore, app.score);
    console.log(highScore);
});
