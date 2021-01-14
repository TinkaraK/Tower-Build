import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import GLTFLoader from './GLTFLoader.js';
import Renderer from './Renderer.js';
import Block from './Block.js';
import Border from './Borders.js';
import Light from './Light.js';
import Hook from './Hook.js';

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
        await this.loader.load('../../common/models/scene/scene.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');
        this.emptyLeft = await this.loader.loadNode('Border0');
        this.emptyRight = await this.loader.loadNode('Border1');
        this.crane = await this.loader.loadNode('crane2');
        this.emptyHookLeft = await this.loader.loadNode('leftHook');
        this.emptyHookRight = await this.loader.loadNode('rightHook');
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
        this.scene.hooks = [];//[new Hook(false, "left", this.scene), new Hook(true, "right", this.scene)];
        this.scene.score = 0;
        this.scene.borders = [this.emptyLeft.translation, this.emptyRight.translation];
        this.scene.emptyHooks = [this.emptyHookLeft.translation, this.emptyHookRight.translation];
        this.scene.sumC = 0;

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
        this.addBlock();
        //this.scene.addNode(new Hook(-1, [0,1,0], this.scene, "left"));
   
        
    }


    startGame() {
        document.getElementById("startGame").style.visibility = "hidden";
        document.getElementById("startDiv").style.visibility = "hidden";
        document.getElementById("overlay").style.visibility = "visible";
        //this.paused = false;
    }

    pauseGame() {
        this.paused = !this.paused;
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
        //console.log(this.scene.hooks);
        
    }

   
    dropBlock() {
        this.scene.blocks[this.scene.blocks.length - 1].falling = true; 
        this.scene.hooks[this.scene.hooks.length - 1].visible = false;
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
                for (const hook of this.scene.hooks) {
                    if (hook) {
                        hook.update(this.speed);
                        hook.updateMatrix();
                    }
                }
            document.getElementById("score").innerHTML = this.scene.score;
            document.getElementById("scoreSpan").innerHTML = this.scene.score;  
            document.getElementById("highScore").innerHTML = this.scene.score;
            //document.getElementById("highScoreSpan").innerHTML = this.scene.score;  

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
