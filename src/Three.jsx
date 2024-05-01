import React, { useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import CANNON from 'cannon';

const ThreeScene = ({onNavigate}) => {
    const mountRef = useRef(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0); // Score state
    const [page, setPage] = useState('game');

    const initializeGame = () => {
        setGameOver(false);
        setScore(0);
    }

    useEffect(() => {

        let camera, scene, renderer;
        const originalBoxSize = 2;
        let currentBlock = null;
        let round = 0;
        let droppedBlocks = [];
        let boxHeight = 2;
        let gameStarted = false;
        let world;
        let angle = 0;
        let step = 3;

        function init() {

            if (renderer) {
                renderer.setAnimationLoop(null);
                while(scene.children.length > 0){
                    scene.remove(scene.children[0]);
                }
                Array.from(world.bodies).forEach(body => {
                    world.remove(body);
                });
                if (document.body.contains(renderer.domElement)) {
                    document.body.removeChild(renderer.domElement);
                }
            }

            console.log('init');
            world = new CANNON.World();
            world.gravity.set(0, -10, 0);
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 40;

            scene = new THREE.Scene();

            addLayer(0, 0, 0, originalBoxSize, originalBoxSize);
            addLayer(-10,step, 0, originalBoxSize, originalBoxSize, 'x');

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(10, 20, 0);
            scene.add(directionalLight);

            const width = 10;
            const height = width / (window.innerWidth / window.innerHeight);
            camera = new THREE.OrthographicCamera(
                width / -2,
                width / 2,
                height / 2,
                height / -2,
                1,
                100
            );

            camera.position.set(0, 2,8);
            camera.lookAt(0, 0, 0);

            // renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);

            document.body.appendChild(renderer.domElement);
            renderer.setAnimationLoop(animation);
        }

        function addLayer(x, y ,z ,width, depth){
            currentBlock = generateBox(x, y, z, width, depth);
        }

        function generateBox(x, y, z, width, depth, falls){
            const geometry = new THREE.BoxGeometry(width, boxHeight, depth);

            const color = new THREE.Color(`hsl(${30 + round+1 * 4}, 100%, 50%)`);
            const material = new THREE.MeshLambertMaterial({ color});

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            scene.add(mesh);

            // Cannon
            const shape = new CANNON.Box(new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2));
            let mass = falls ? 5 : 0;
            const body = new CANNON.Body({ mass, shape });
            body.position.set(x, y, z);
            world.addBody(body);

            return {
                threejs: mesh,
                cannonjs: body,
                width,
                depth
            };
        }

        function generateDroppedBox(x, y, z, width, depth){
            const dblock = generateBox(x, y, z, width, depth, true);
            droppedBlocks.push(dblock);
        }

        const addEventListeners = () => {
            window.addEventListener('click', handleUserInteraction);
            //window.addEventListener('touchstart', handleUserInteraction);
        };

        const removeEventListeners = () => {
            window.removeEventListener('click', handleUserInteraction);
            //window.removeEventListener('touchstart', handleUserInteraction);
        };


        const handleUserInteraction = () => {
            if (!gameStarted){
                resetGame();
                gameStarted = true; 
            } else {
                const topLayer = currentBlock;

                const nextX = -10;
                const nextZ = 0;
                const nextY = (round + 1) * boxHeight + step;
                const newWidth = originalBoxSize;
                const newDepth = originalBoxSize;

                generateDroppedBox(topLayer.threejs.position.x, topLayer.threejs.position.y, topLayer.threejs.position.z, topLayer.width, topLayer.depth);

                scene.remove(topLayer.threejs);
                
                addLayer(nextX,nextY, nextZ, newWidth, newDepth);
                round++;
                setScore(round);
            }
        };

        function resetGame() {
            // Clear the scene and physics world
            droppedBlocks = [];
            round = 0;
            setScore(0);
            setGameOver(false);
            init(); // re-initialize the game setup
        }

        function checkGameOver() {
            // Assuming the game over condition is that the block falls below y = -10
            droppedBlocks.forEach(block => {
                if (block.threejs.position.y < -1) {
                    console.log(block.threejs.position.y);
                    setGameOver(true);
                    gameStarted = false;
                }
            });
        }

        function animation(){
            if (gameOver) {
                return; // Stop the animation loop if the game is over
            }
            const speed = 0.05;
            angle += speed;
            const amplitude = 3;
            const newPositionX = Math.sin(angle) * amplitude;
            
            let newPositionY = (Math.cos(angle) * amplitude / 2);
            if (newPositionY > 0){
                newPositionY = -newPositionY;
            } 

            const topLayer = currentBlock;
            const initYPos = topLayer.threejs.position.y;
            topLayer.threejs.position.x = newPositionX;
            //topLayer.threejs.position.y = newPositionY + initYPos;

            if (camera.position.y < boxHeight * round + 4){
                camera.position.y += speed;
            }

            updatePhysics();
            renderer.render(scene, camera);

        }

        function updatePhysics(){

            world.step(1/60);

            droppedBlocks.forEach((element) => {
                element.threejs.position.copy(element.cannonjs.position);
                element.threejs.quaternion.copy(element.cannonjs.quaternion);
            });

            checkGameOver();

        }

        addEventListeners();

        return () => {
            if (renderer) {
                removeEventListeners();
                renderer.setAnimationLoop(null); // Cleanup on component unmount
                document.body.removeChild(renderer.domElement);
            }
        };

    }, []);

    

    return (
        <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!gameOver && (
                <div style={{ position: 'absolute', top: '0px', width: '100%', color: 'white', fontSize: '24px', padding: '20px 0px 0px 20px' }}>
                    Score: {score}
                </div>
            )}
            {gameOver && (
                <div style={{ position: 'absolute', top: '0px', width: '100%', height:'100%', textAlign: 'center', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <div style={{fontSize: '36px', color: 'white'}}>Game Over! Your final score: {score}</div>
                    <button onClick={() => onNavigate('menu')}>Start Game</button>
                    <button onClick={() => { initializeGame(); onNavigate('game');}}>REStart Game</button>
                </div>
            )}
        </div>
    );
};

export default ThreeScene;
