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

document.getElementById("startGame").style.visibility = "visible";
document.getElementById("lostGame").style.visibility = "hidden";
document.getElementById("endDiv").style.visibility = "hidden";
document.getElementById("scoreDiv").style.visibility = "hidden";
document.getElementById("overlay").style.visibility = "hidden";
document.getElementById("startDiv").style.visibility = "visible";

class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('../../common/models/scene4/scene4.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');
        this.emptyLeft = await this.loader.loadNode('Border0');
        this.emptyRight = await this.loader.loadNode('Border1');
        this.crane = await this.loader.loadNode('crane');
        this.skybox = await this.loader.loadNode('Skybox');
        
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
                //this.dropBlock();
                this.endGame();
            }
           /* if (e.code == "Enter") {
                this.addBlock();
                this.scene.paused = false;
            }*/
        })

        
        this.scene.blocks = [];
        this.scene.score = 0;
        this.scene.borders = [this.emptyLeft.translation, this.emptyRight.translation];
        this.scene.lastBlock;
        this.scene.currentBlock;

        

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
        //this.paused = true;
        this.addBlock();
        
    }


    startGame() {
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("startDiv").style.visibility = "hidden";
        document.getElementById("overlay").style.visibility = "visible";
        this.paused = false;
    }

    pauseGame() {
        if (this.paused)
            this.paused = false;
        else
            this.paused = true; 
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
        // block se bo generiral na random mestih, 1x levo, 1x desno
        let whichEmpty = (Math.random() < 0.5);
        let t;
        let startDirection;
        if (whichEmpty) { // ce je true, se spawna levo --> gre proti desni
            t = vec3.clone(this.emptyLeft.translation);
            startDirection = "left";
        }
        else { // ce je false, se spawna desno --> gre proti levi
            t = vec3.clone(this.emptyRight.translation);
            startDirection = "right";
        }
        
        let block = new Block(this.scene.blocks.length, t, this.scene, startDirection); // ta blok se premika
        //this.scene.score ++;
        if (this.scene.blocks.length > 0)
            this.scene.lastBlock = this.scene.currentBlock;
        this.scene.blocks.push(block);
        this.scene.currentBlock = block;
        this.scene.addNode(block);
        
    }

   
    dropBlock() {
        console.log("spusti block")
        //console.log(this.scene.lastBlock.falling);
        this.scene.currentBlock.falling = true;
        console.log(this.scene.currentBlock.falling);
        this.updateCamera(); 
        this.updateLevel();
        this.addBlock();
        
        if (this.scene.currentBlock.dropped) 
            this.scene.currentBlock = this.scene.blocks[this.scene.blocks.length - 1];
    }


    updateLevel() {
        this.emptyLeft.translation[1] += 2;
        this.emptyRight.translation[1] += 2;
        this.crane.translation[1] += 2;
        this.emptyLeft.updateMatrix();
        this.emptyRight.updateMatrix();
        this.crane.updateMatrix();
    }

    updateCamera() {
        console.log("Lift camera")
        this.camera.translation[2] -= 2;
        this.skybox.translation[2] -= 2;
        this.camera.updateMatrix();
        this.skybox.updateMatrix();
        
    }

    update() {
        if (this.scene) {
            if (!this.paused) {
                const t = this.time = Date.now();
                const dt = (this.time - this.startTime) * 0.001;
                this.startTime = this.time;
                let lastBlock = null;
                if (this.scene.blocks.length > 0) {
                    lastBlock = this.scene.blocks.length - 1;
                    for (const block of this.scene.blocks) {
                        if (block) {
                            block.update(dt);
                            block.updateMatrix();
                        }
                        if (block === this.scene.lastBlock && block.dropped) {
                        }
                    }
                }
            }
            //else if (this.scene.paused)// this.scene && this.scene.gameLost) {
                //console.log("pavza")    
            //this.endGame();
        
            document.getElementById("score").innerHTML = this.scene.score;
            document.getElementById("scoreSpan").innerHTML = this.scene.score;
              
    
        }
    }   
        

    render() {
        if (this.renderer) {
            /*const transform = this.camera.getGlobalTransform();
            const translation = vec3.create();
            mat4.getTranslation(translation, transform);
            this.skybox.translation = this.camera.translation;
            this.skybox.updateMatrix();*/
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
});
