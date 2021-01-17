import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import GLTFLoader from './GLTFLoader.js';
import Renderer from './Renderer.js';
import Block from './Block.js';
import Border from './Borders.js';
import Light from './Light.js';
import Hook from './Hook.js';
import Dust from './Dust.js';

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
        await this.loader.load('../../common/models/scene3/scene3.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');
        this.emptyLeft = await this.loader.loadNode('Border0');
        this.emptyRight = await this.loader.loadNode('Border1');
        this.crane = await this.loader.loadNode('crane2');
        this.emptyHookLeft = await this.loader.loadNode('leftHook');
        this.emptyHookRight = await this.loader.loadNode('rightHook');
        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        document.getElementById("startButton").addEventListener('click', this.startGame);
        document.addEventListener('keyup', e => {
            if (e.code == "Space") {
                this.dropBlock();
            }
        })

        this.scene.blocks = [];
        this.scene.hooks = [];
        this.scene.dust  = [];
        this.scene.score = 0;
        this.beatScore = false;
        this.scene.borders = [this.emptyLeft.translation, this.emptyRight.translation];
        this.scene.emptyHooks = [this.emptyHookLeft.translation, this.emptyHookRight.translation];
        this.highScore = localStorage.getItem("highScore");
        //localStorage.setItem("highScore",0);
        if (this.highScore == null) {
            this.highScore = 0;
        }

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
        this.addBlock();
    }


    startGame() {
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("startDiv").style.visibility = "hidden";
        document.getElementById("overlay").style.visibility = "visible";
        //this.paused = false;
    }

  

    resetGame() {
        this.scene = this.loader.loadScene(this.loader.defaultScene);
        this.camera = this.loader.loadNode('Camera');
        this.emptyLeft = this.loader.loadNode('Border0');
        this.emptyRight = this.loader.loadNode('Border1');
        this.crane = this.loader.loadNode('crane');   
    }

    endGame() {
        this.paused = true;
        const audio = new Audio('../../common/sound/game_over.mp3');
        audio.play();
        this.score = this.scene.score;
        document.getElementById("endDiv").style.visibility = "visible";
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("scoreDiv").style.visibility = "visible";
        document.getElementById("overlay").style.visibility = "hidden";
        document.getElementById("restartDiv").style.visibility = "visible";
        if (this.scene.score > this.highScore)
            localStorage.setItem("highScore", this.scene.score);
    }

    addBlock() {
        console.log("dodan nov block");
        let t;
        let tHook;
        let startDirection;
        if (Math.random() < 0.5) { // ce je true, se spawna levo --> gre proti desni
            t = vec3.clone(this.emptyLeft.translation);
            tHook = vec3.clone(this.emptyHookLeft.translation);
            startDirection = "left";
        }
        else { // ce je false, se spawna desno --> gre proti levi
            t = vec3.clone(this.emptyRight.translation);
            tHook = vec3.clone(this.emptyHookRight.translation);
            startDirection = "right";
        }
        let blockBefore;
        if (this.scene.blocks.length >= 1) // ce ni prvi block, ima predhodnika - zadnjega v seznamu blockov
            blockBefore = this.scene.blocks[this.scene.blocks.length - 1];
        else { // ce je prvi block, nima predhodnika
            blockBefore = null;
        }
        let block = new Block(this.scene.blocks.length, t, this.scene, startDirection, blockBefore); // ta blok se premika
        let hook = new Hook(this.scene.hooks.length, tHook, this.scene, startDirection);
        this.scene.blocks.push(block);
        this.scene.addNode(block);
        this.scene.hooks.push(hook);
        this.scene.addNode(hook);
        if (this.scene.blocks.length == 1) {
            this.scene.firstBlock = block;
        }
        
    }

   
    dropBlock() {
        let num = this.scene.blocks.length;
        this.scene.blocks[this.scene.blocks.length - 1].falling = true; 
        let hook = this.scene.hooks[this.scene.hooks.length - 2];
        this.scene.hooks[this.scene.hooks.length - 1].translation = [-10, -10, -10];
        console.log("spusti block")
        this.updateCamera(); 
        this.updateLevel();
    }


    updateLevel() {
        if (this.scene.blocks.length < 6) {
            this.emptyLeft.translation[1] += 1;
            this.emptyRight.translation[1] += 1;
            this.emptyHookLeft.translation[1] += 1;
            this.emptyHookRight.translation[1] += 1;
            this.crane.translation[1] += 1;
        }
        else {
            this.emptyLeft.translation[1] += 2;
            this.emptyRight.translation[1] += 2;  
            this.emptyHookLeft.translation[1] += 2;
            this.emptyHookRight.translation[1] += 2;
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
    
/*
        translation[0] = levo desno = x
        translation[1] = dol gor = y
        translation[2] = naprej nazaj = z
    
    */ 

    activateDust(block) {
        let tr = vec3.clone(block.translation);
        tr = vec3.add(tr, tr, [0, -1, -1]);
        let dust = new Dust(this.scene.dust.length, tr, this.scene);
        this.scene.addNode(dust);
        this.scene.dust.push(dust);             
        
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
                            this.activateDust(block);
                            block.dropNew = false;
                            if (this.scene.score > this.highScore && this.highScore > 0 && !this.beatScore) {
                                this.beatScore = true;
                                let audio = new Audio("../../common/sound/win.mp3");
                                audio.play();
                            }
                        }  
                    }
                }
                for (const hook of this.scene.hooks) {
                    if (hook) {
                        if (hook.visible) {
                            hook.update(this.speed);
                            hook.updateMatrix();
                        } 
                    }
                }
                for (const dust of this.scene.dust) {
                    if (dust) {
                        dust.update();
                        dust.updateMatrix();
                    }
                }

            document.getElementById("score").innerHTML = this.scene.score;
            document.getElementById("scoreSpan").innerHTML = this.scene.score;  
            if (this.scene.score > this.highScore && this.highScore > 0)
                document.getElementById("beatenRecord").innerHTML = "\nYou beat the record!";  
            document.getElementById("highScore").innerHTML = this.highScore;

            }
            if (this.paused) {
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
    gui.add(app, 'speed', 0.03, 0.5);
});
