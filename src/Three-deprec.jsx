import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import CANNON from 'cannon';

const ThreeScene = () => {
    const mountRef = useRef(null);

    useEffect(() => {

        let camera, scene, renderer;
        const originalBoxSize = 1;
        let stack = [];
        let overhangs = [];
        let boxHeight = 1;
        let gameStarted = false;
        let world;

        function init() {

            world = new CANNON.World();
            world.gravity.set(0, -10, 0);
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 40;

            scene = new THREE.Scene();

            addLayer(0, 0, originalBoxSize, originalBoxSize);
            addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');

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

        }

        function addLayer(x ,z ,width, depth, direction){
            const y = boxHeight * stack.length;
            const layer = generateBox(x, y, z, width, depth, false);
            layer.direction = direction;

            stack.push(layer);
        }

        function addOverhang(x, z, width, depth){
            const y = boxHeight * (stack.length - 1);
            const overhang = generateBox(x, y, z, width, depth, true);
            overhangs.push(overhang);
        }

        function generateBox(x, y, z, width, depth, falls){
            const geometry = new THREE.BoxGeometry(width, boxHeight, depth);

            const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
            const material = new THREE.MeshLambertMaterial({ color});

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            scene.add(mesh);

            // CANNON JS
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

        window.addEventListener('click', () => {
            if (!gameStarted){
                renderer.setAnimationLoop(animation);
                gameStarted = true;
            } else {
                const topLayer = stack[stack.length - 1];
                const previousLayer = stack[stack.length - 2];

                const directon = topLayer.direction;

                const delta = topLayer.threejs.position[directon] - previousLayer.threejs.position[directon];

                const overhangSize = Math.abs(delta);

                const size = directon === 'x' ? topLayer.width : topLayer.depth;
                const overlap = size - overhangSize;

                if(overlap > 0){

                    const newWidth = directon === 'x' ? overlap : topLayer.width;
                    const newDepth = directon === 'z' ? overlap : topLayer.depth;

                    topLayer.width = newWidth;
                    topLayer.depth = newDepth;

                    topLayer.threejs.scale[directon] = overlap / size;
                    topLayer.threejs.position[directon] -= delta / 2;

                    topLayer.cannonjs.position[directon] -= delta / 2;

                    const shape = new CANNON.Box(new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2));
                    topLayer.cannonjs.shapes = [];
                    

                    // Overhang
                    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
                    const overhangX = directon === 'x' ? topLayer.threejs.position.x + overhangShift : topLayer.threejs.position.x;
                    const overhangZ = directon === 'z' ? topLayer.threejs.position.z + overhangShift : topLayer.threejs.position.z;
                    const overhangWidth = directon === 'x' ? overhangSize : newWidth;
                    const overhangDepth = directon === 'z' ? overhangSize : newDepth;

                    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

                    const nextX = directon === 'x' ? topLayer.threejs.position.x : -10;
                    const nextZ = directon === 'z' ? topLayer.threejs.position.z : -10;
                    const nextDirection = directon === 'x' ? 'z' : 'x';

                    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);

                }
                
            }
        });

        function animation(){
            const speed = 0.15;

            const topLayer = stack[stack.length - 1];
            topLayer.threejs.position[topLayer.direction] += speed;
            topLayer.cannonjs.position[topLayer.direction] += speed;

            if (camera.position.y < boxHeight * (stack.length - 2) + 4){
                camera.position.y += speed;
            }

            updatePhysics();
            renderer.render(scene, camera);
        }

        function updatePhysics(){
            world.step(1/60);

            overhangs.forEach((element) => {
                element.threejs.position.copy(element.cannonjs.position);
                element.threejs.quaternion.copy(element.cannonjs.quaternion);
            });
        }

        init();
    }, []);

    return <div ref={mountRef}></div>;
};

export default ThreeScene;
