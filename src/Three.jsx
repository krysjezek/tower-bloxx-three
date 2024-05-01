import React, { useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import CANNON from 'cannon';
import db from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import createCloud from './game/cloudGenerator';

const ThreeScene = ({onNavigate}) => {
    const mountRef = useRef(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0); // Score state
    const [name, setName] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(2, 2, 8)); // Initial camera position
    const [animationProgress, setAnimationProgress] = useState(0); // Progress from 0 to 1
    const targetPosition = new THREE.Vector3(1, 2, 7);

    const initializeGame = () => {
        setGameOver(false);
        setScore(0);
    }

    const handleSaveScore = async () => {
        if (name !== '') {

            try {
                await addDoc(collection(db, "scores"), {
                    name: name,
                    score: score,
                    date: new Date()
                });
                setIsSaved(true);
            } catch (error) {
                console.error("Firebase error code:", error.code);
                console.error("Firebase error message:", error.message);
                alert('Error saving score');
            }
        } else {
            alert('Please enter a name.');
        }
    };

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
        let lastCloudHeight = 0;
        let cloudHeightInterval = 4;

        function init() {
            setIsSaved(false);

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

            camera.position.set(2, 2,8);
            camera.lookAt(0, 0, 0);

            // renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);

            document.body.appendChild(renderer.domElement);
            renderer.setAnimationLoop(animation);

            scene.background = new THREE.Color(0xabcdef); 
        }

        function addLayer(x, y ,z ,width, depth){
            currentBlock = generateBox(x, y, z, width, depth);
        }

        function checkHeightAndGenerateClouds(currentHeight) {
            if (currentHeight > lastCloudHeight + cloudHeightInterval) {
                const newCloud = createCloud();
                newCloud.position.set(
                    Math.random() * 20 - 10, // Random X position within range
                    currentHeight + 10,      // Slightly above the current height
                    Math.random() * 10 - 5   // Random Z position within range
                );
                scene.add(newCloud);
                lastCloudHeight = currentHeight; // Update the height at which the last cloud was added
            }
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

            const currentHeight = camera.position.y; // Assuming the camera's Y position represents player height
            checkHeightAndGenerateClouds(currentHeight);

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
                <div className='score-tab'>
                    <div className='score-in'>SCORE</div>
                    <div className='score-in score'>{score}</div>
                </div>
            )}
            {gameOver && (
                <div style={{ position: 'absolute', top: '0px', width: '100%', height:'100%', textAlign: 'center', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <div className='menu-wrap'>
                        <div className='button-wrap'>
                            <h1>Game Over!</h1>
                        </div>
                        {!isSaved && (
                            <div
                            onClick={(e) => e.stopPropagation()}>
                                <div className='score-tab'>
                                    <div className='score-in'>SCORE</div>
                                    <div className='score-in score'>{score}</div>
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                                <button onClick={handleSaveScore}>Save Score</button>
                            </div>
                        )}
                        {isSaved && (
                            <div>
                                <div style={{ fontSize: '20px', color: 'white' }}>Score saved!</div>
                                <button onClick={() => onNavigate('leaderboard')}>View Leaderboard</button>
                            </div>


                        )}
                        <div className='button-wrap'>
                            <button className='button-start' onClick={() => { initializeGame(); }}>Try Again</button>
                            <button onClick={() => onNavigate('menu')}>Back to Menu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreeScene;
