import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import CANNON from 'cannon';
import db from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Base class for all game objects with a visual representation in the scene
class GameObject {
    constructor(scene, model, x, y, z, width=0, depth=0) {
        this.width = width;
        this.depth = depth;

        // Setup 3D model for the game object
        this.model = model;
        if (width > 0 && depth > 0) {
            this.model.scale.set(width / 2, 1, depth / 2); // Assuming height is always 2 for simplicity
        }
        this.model.position.set(x, y, z);
        this.model.castShadow = true;
        scene.add(this.model); // Add model to the scene
    }

    // Set horizontal position of the object (used for moving objects like blocks)
    setPositionX(x) {
        this.model.position.x = x;
    }

    // Getter to access the underlying Three.js model
    get threejs() {
        return this.model;
    }
}

// Block class for game blocks, inherits from GameObject
class Block extends GameObject {
    constructor(scene, world, baseModel, x, y, z, width, depth, falls, defaultMaterial, velocity) {
        if (!baseModel) {
            console.error("Base model has not been loaded yet.");
            return;
        }

        super(scene, baseModel.clone(), x, y, z, width, depth);

        // Initialize physics body for the block
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 1, depth / 2));
        this.body = new CANNON.Body({
            mass: falls ? 2 : 0,  // Mass determines if the block can fall
            shape: shape,
            material: defaultMaterial
        });
        this.body.position.set(x, y, z);
        world.addBody(this.body);  // Add the physics body to the physics world

        // Set initial velocity if the block is meant to fall
        if (falls) {
            this.body.velocity.set(velocity * 30, 0, 0);
        }
    }

    // Update function to synchronize physics and visual representation
    update() {
        this.model.position.copy(this.body.position);
        this.model.quaternion.copy(this.body.quaternion);
    }

    // Accessor for the physics body
    get cannonjs() {
        return this.body;
    }

    // Width and depth accessors
    get blockWidth() {
        return this.width;
    }

    get blockDepth() {
        return this.depth;
    }
}

// Cloud class for generating clouds in the game, inherits from GameObject
class Cloud extends GameObject {
    constructor(scene, x, y, z) {
        const cloudTextures = [
            { path: './clouds/cloud1.png', width: 10, height: 5 },
            { path: './clouds/cloud2.png', width: 12, height: 6 },
            { path: './clouds/cloud3.png', width: 15, height: 7.5 },
            { path: './clouds/cloud4.png', width: 8, height: 4 }
        ];

        // Randomly select a cloud texture
        const cloudData = cloudTextures[Math.floor(Math.random() * cloudTextures.length)];
        const textureLoader = new THREE.TextureLoader();
        const cloudTexture = textureLoader.load(cloudData.path);

        const material = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(cloudData.width, cloudData.height);
        const cloudModel = new THREE.Mesh(geometry, material);

        // Create the cloud object
        super(scene, cloudModel, x, y, z);
    }
}

// React component to encapsulate the entire game scene
const ThreeScene = ({ onNavigate }) => {
    const mountRef = useRef(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Initialize the game and set up initial state
    const initializeGame = () => {
        setGameOver(false);
        setScore(0);
    };

    // Save the player name to local storage
    const saveNameToLocalStorage = (name) => {
        localStorage.setItem('userName', name);
    };

    // Function to handle saving the score to Firebase
    const handleSaveScore = async (e) => {
        e.preventDefault();
        if (name.trim() === '') {
            alert('Please enter a name.');
            return;
        }

        try {
            await addDoc(collection(db, "scores"), {
                name: name,
                score: score,
                date: new Date()
            });
            saveNameToLocalStorage(name);
            setIsSaved(true);
            alert('Score saved successfully!');
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert('Error saving score: ' + error.message);
        }
    };

    let baseModel = null;

    // Load the base model for the blocks
    const loadBaseModel = () => {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                './block.glb',
                function (gltf) {
                    baseModel = gltf.scene;
                    console.log('Base model loaded successfully!');
                    resolve(baseModel);
                },
                undefined,
                function (error) {
                    console.error('Error loading the base model:', error);
                    reject(error);
                }
            );
        });
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
        let cloudHeightInterval = 5;
        let lastPosX = 0;
        let velocity = 0;
        let defaultContactMaterial, defaultMaterial;

        // Initial setup for the game
        const init = async () => {
            try {
                await loadBaseModel();
            } catch (error) {}

            if (renderer) {
                renderer.setAnimationLoop(null);
                while (scene.children.length > 0) {
                    scene.remove(scene.children[0]);
                }
                Array.from(world.bodies).forEach(body => {
                    world.remove(body);
                });
                if (document.body.contains(renderer.domElement)) {
                    document.body.removeChild(renderer.domElement);
                }
            }

            console.log('Game initialized');
            world = new CANNON.World();
            world.gravity.set(0, -10, 0);
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 40;

            defaultMaterial = new CANNON.Material('defaultMaterial');

            defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
                friction: 0.4,
                restitution: 0,
            });
            world.addContactMaterial(defaultContactMaterial);

            scene = new THREE.Scene();

            addLayer(0, 0, 0, originalBoxSize, originalBoxSize);
            addLayer(-10, step, 0, originalBoxSize, originalBoxSize, 'x');

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
            directionalLight.position.set(10, 20, 0);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            const ground = createGround();

            const width = window.innerWidth / 100;
            const height = width / (window.innerWidth / window.innerHeight);
            camera = new THREE.OrthographicCamera(
                width / -2,
                width / 2,
                height / 2,
                height / -2,
                .1,
                100
            );

            camera.position.set(2, 2, 8);
            camera.lookAt(0, 0, 0);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.render(scene, camera);

            document.body.appendChild(renderer.domElement);
            renderer.setAnimationLoop(animation);

            scene.background = new THREE.Color(0x121212);
        };

        // Add a new layer/block to the game
        const addLayer = (x, y, z, width, depth) => {
            currentBlock = new Block(scene, world, baseModel, x, y, z, width, depth, false, defaultMaterial, 0);
        };
        
         // Check if it's time to generate a new cloud based on the current height
        function checkHeightAndGenerateClouds(currentHeight) {
            if (currentHeight > lastCloudHeight + cloudHeightInterval) {
                const newCloud = new Cloud(scene, Math.random() * 20 - 10, currentHeight + 10, Math.random() * 10 - 10);
                lastCloudHeight = currentHeight; // Update the height at which the last cloud was added
            }
        }
        // Function to create the ground
        function createGround() {

            const textureLoader = new THREE.TextureLoader();

            // Load the texture image
            const cloudTexture = textureLoader.load('./grid.png', () => {
                console.log('Cloud texture loaded successfully');
            }, undefined, (error) => {
                console.error('Error loading cloud texture. Event:', error);
                console.error('Failed path:', './grid.png');
            });

            cloudTexture.wrapS = THREE.RepeatWrapping;
            cloudTexture.wrapT = THREE.RepeatWrapping;
            cloudTexture.repeat.set(3, 3);

            const material = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: .3, 
                side: THREE.DoubleSide
            });
            const geometry = new THREE.PlaneGeometry(100, 100); 
        
            const ground = new THREE.Mesh(geometry, material);
            
            // Rotate the plane to lie horizontally
            ground.rotation.x = -Math.PI / 2;
        
            ground.position.y = -10; 
        
            ground.receiveShadow = true;
        
            scene.add(ground);
        
            return ground;
        }

        // Function to generate a block and drop it from above
        function generateDroppedBox(x, y, z, width, depth, velocity){
            const dblock = new Block(scene, world, baseModel, x, y, z, width, depth, true, defaultMaterial, velocity);
            droppedBlocks.push(dblock); // Add to the list of dropped blocks for tracking
        }

        // Event listeners for user interaction
        const addEventListeners = () => {
            window.addEventListener('click', handleUserInteraction);
            //window.addEventListener('touchstart', handleUserInteraction);
        };

        const removeEventListeners = () => {
            window.removeEventListener('click', handleUserInteraction);
            //window.removeEventListener('touchstart', handleUserInteraction);
        };

        // Handles user clicks to trigger block movement or game functions
        const handleUserInteraction = () => {
            if (!gameStarted){
                resetGame();
                gameStarted = true; 
            } else {
                const topLayer = currentBlock;

                const nextX = -10;
                const nextZ = 0;
                const nextY = (round + 1) * boxHeight + step; // Calculate new Y based on rounds and step 
                const newWidth = originalBoxSize;
                const newDepth = originalBoxSize;

                generateDroppedBox(topLayer.threejs.position.x, topLayer.threejs.position.y, topLayer.threejs.position.z, topLayer.blockWidth, topLayer.blockDepth, velocity);

                scene.remove(topLayer.threejs);
                
                addLayer(nextX,nextY, nextZ, newWidth, newDepth);
                round++;
                setScore(round);
            }
        };

        // Reset game to initial state
        function resetGame() {
            // Clear the scene and physics world
            droppedBlocks = [];
            round = 0;
            setScore(0);
            setGameOver(false);
            init(); // re-initialize the game setup
        }

        // Check if any blocks have fallen off to end the game
        function checkGameOver() {
            droppedBlocks.forEach(block => {
                if (block.threejs.position.y < -1) {
                    setGameOver(true);
                    gameStarted = false;
                }
            });
        }

        // Animation loop to handle the game logic
        function animation(){
            if (gameOver) {
                return; // Stop the animation loop if the game is over
            }
            const speed = 0.035 + round * 0.0015; // Increase speed based on round
            angle += speed;
            const amplitude = 1.5;
            const newPositionX = Math.sin(angle) * amplitude;
            
            let newPositionY = (Math.cos(angle) * amplitude / 2);
            if (newPositionY > 0){
                newPositionY = -newPositionY;
            } 

            const topLayer = currentBlock;
            const initYPos = topLayer.threejs.position.y;
            velocity = newPositionX - lastPosX;
            topLayer.setPositionX(newPositionX); // Update position based on new X
            lastPosX = newPositionX;
            //topLayer.threejs.position.y = newPositionY + initYPos;

            if (camera.position.y < boxHeight * round + 4){
                camera.position.y += speed; // Adjust camera position as game progresses
            }

            const currentHeight = camera.position.y; // Assuming the camera's Y position represents player height
            checkHeightAndGenerateClouds(currentHeight);

            updatePhysics(); // Update physics world
            renderer.render(scene, camera);


        }

        // Update physics world and synchronize visual and physics entities
        function updatePhysics(){

            world.step(1/60);

            droppedBlocks.forEach((element) => {
                element.update(); // Update each block's position based on physics simulation
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

    
// Return the component display, handling both the game view and the UI for game over
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
                            <form onSubmit={handleSaveScore} onClick={(e) => e.stopPropagation()}>
                                    <div className='score-tab'>
                                        <div>SCORE</div>
                                        <div className='score'>{score}</div>
                                    </div>
                                    <div className='save-score'>
                                        <label htmlFor="name">Enter your name:</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            autoFocus
                                            required
                                        />
                                        <label htmlFor="email">Email (optional):</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                        />
                                        <button className='button-yellow' type="submit">Save Score</button>
                                    </div>
                            </form>
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