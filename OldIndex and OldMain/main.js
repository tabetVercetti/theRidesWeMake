import * as THREE from 'three';
            import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
            import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
            import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
            import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
            import { FlyControls } from 'three/addons/controls/FlyControls.js';
            import { TWEEN } from 'three/addons/libs/tween.module.min.js';
            
            
            let scene, camera, renderer, hlight, car, controls, orbitalControls, pointerLockControls, flyControls, objectCenter;
            
            let isPaused = false;
            let isAutorotating = true;
            let rotationSpeed = 0; // Initial rotation speed
            let rotationDirection = 1; // Initial rotation direction (1 for clockwise, -1 for counterclockwise)
			
            let moveForward = false;
			let moveBackward = false;
			let moveLeft = false;
			let moveRight = false;
            let moveUp = false;
            let moveDown = false;
            let yawRight = false;
            let yawLeft = false;
            let pitchDown = false;
            let pitchUp = false; 
            let rollLeft = false;
            let rollRight = false;
            let sprint = false;
            let slowwalk = false;

            let lockTarget = false;
            
			let prevTime = performance.now();
			const velocity = new THREE.Vector3();
			const direction = new THREE.Vector3();
            let currentCamDirection = new THREE.Vector3();

            // Define the minimum and maximum Camera Height values in FPS
            const minCamHeight=0.01; 
            const maxCamHeight=25;

            // Define the minimum and maximum Camera FOV values
            const MIN_FOV = 5;
            const MAX_FOV = 110;

            // Define variable for switching Controls
            let controlKeyPressed = false;

            // Add event listener for keydown events on the document object
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    // Toggle pause state
                    isPaused = !isPaused;
                    
                    // // If paused, stop animation loop and display pause menu
                    // if (isPaused) {
                    //     cancelAnimationFrame(animate);
                    //     showPauseMenu();
                    // } else {
                    //     // If unpaused, resume animation loop and hide pause menu
                    //     animate();
                    //     hidePauseMenu();
                    // }
                }
            });


            // Initialize the scene
            init();

            // Start the animation loop
            animate();

            function render() {

            renderer.render( scene, camera );

            }

            function init() {

                // Create the scene

                scene = new THREE.Scene();
                //scene.background = new THREE.Color(0xdddddd);
                scene.fog = new THREE.FogExp2( 0xcccccc, 0.02 );

                new RGBELoader()
					.setPath( 'Environment/' )
					.load( 'kiara_1_dawn_4k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;

						scene.background = texture;
						scene.environment = texture;

						render();


                        // Load the GLTF file
                        let loader = new GLTFLoader().setPath( 'Car/Datsun/' );;
                        loader.load('scene.gltf',function(gltf){                    
                            car = gltf.scene.children[0];
                            car.scale.set(0.002,0.002,0.002);
                              // Move the object up by 10 units in the y direction
                            car.position.y += 11.04;
                            scene.add(gltf.scene);
                            render();
                        });

                        // Load the GLTF file
                        let loader2 = new GLTFLoader().setPath( 'Car/Bidaya/' );;
                        loader2.load('bidaya_mat.gltf',function(gltf){                    
                            // car = gltf.scene.children[0];
                            // car.scale.set(1,1,1);
                            scene.add(gltf.scene);
                            let bbox = new THREE.Box3().setFromObject( gltf.scene ); // Gets Bounding Box of GLTF
                            objectCenter = bbox.getCenter( new THREE.Vector3() ); // Gets center of Bounding Box
                            console.log('Object Height:',objectCenter.y)
                            render();
                        });

                        // Load the GLTF file - Floor
                        let loaderFloor = new GLTFLoader();
                        loaderFloor.load('floor.gltf',function(gltf){                    
                            scene.add(gltf.scene);
                            render();
                        });

                        // Load the GLTF file - human
                        let loaderHuman = new GLTFLoader();
                        loaderHuman.load('human.gltf',function(gltf){                    
                            scene.add(gltf.scene);
                            render();
                        });

					} );

                // Create the renderer
                renderer = new THREE.WebGLRenderer({antialias:true});
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize(window.innerWidth,window.innerHeight);
                renderer.toneMapping = THREE.ACESFilmicToneMapping;// check the diff options
				renderer.toneMappingExposure = 1;
				renderer.outputEncoding = THREE.sRGBEncoding;
                document.body.appendChild(renderer.domElement);                 

                // Create the camera
                camera = new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.01,5000)
                camera.position.set( 3.5  , 1.7, -2.5);
                let targetFOV = camera.fov;

                // Create a new <div> element to display the camera height
                const cameraHeightDiv = document.createElement('div');
                cameraHeightDiv.id = 'camera-height';
                cameraHeightDiv.style.position = 'absolute';
                cameraHeightDiv.style.top = '10px';
                cameraHeightDiv.style.left = '10px';
                cameraHeightDiv.style.color = 'white';
                document.body.appendChild(cameraHeightDiv);
                
                // Create a new <div> element to display the camera FOV
                const cameraFOVDiv = document.createElement('div');
                cameraFOVDiv.id = 'camera-FOV';
                cameraFOVDiv.style.position = 'absolute';
                cameraFOVDiv.style.top = '30px';
                cameraFOVDiv.style.left = '10px';
                cameraFOVDiv.style.color = 'white';
                document.body.appendChild(cameraFOVDiv);

                // Create the controls for OrbitalControls.js
                orbitalControls = new OrbitControls( camera, renderer.domElement );
                orbitalControls.autoRotate = true ;
                orbitalControls.enablePan = true ;
                orbitalControls.enableZoom = true;
                orbitalControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
				orbitalControls.dampingFactor = 0.25; // Rotation damping, smaller is lower damping
				orbitalControls.minDistance = 1; // Zoom-in Limit
				orbitalControls.maxDistance = 15; // Zoom-out Limit
                orbitalControls.maxPolarAngle = Math.PI / 2.01; // limit of looking under the object
                orbitalControls.target.set(0, 0, 0); // sets the coordinates of where to look at
                orbitalControls.listenToKeyEvents( window );
                
                // prevent panning below ground plane
                orbitalControls.addEventListener('change', () => {
                if (camera.position.y < 0.01) {
                    camera.position.setY(0.01);
                    orbitalControls.target.setY(0);
                }
                });

                // Create controls for PointerLockControls.js
                pointerLockControls = new PointerLockControls( camera, document.body );

                // Create controls for Fly Controls
                flyControls = new FlyControls(camera, renderer.domElement);
				flyControls.movementSpeed = 5;
				//flyControls.domElement = container;
				flyControls.rollSpeed = Math.PI / 6;
				flyControls.autoForward = false;
				flyControls.dragToLook = true;

                // Set initial controls
                let controls = orbitalControls;
                pointerLockControls.enabled = false;
                flyControls.enabled = false;
                orbitalControls.enabled = true;

                // Create cool triangle pyramids
                const geometry = new THREE.CylinderGeometry( 0, 10, 30, 4, 1 );
				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

				for ( let i = 0; i < 500; i ++ ) {

					const mesh = new THREE.Mesh( geometry, material );
					mesh.position.x = Math.random() * 1600 - 800;
					mesh.position.y = 0;
					mesh.position.z = Math.random() * 1600 - 800;
					mesh.updateMatrix();
					mesh.matrixAutoUpdate = false;
					scene.add( mesh );

				}

                // // Add the light
                // hlight = new THREE.AmbientLight (0xff1500,100)

				// const dirLight1 = new THREE.DirectionalLight( 0xffffff );
				// dirLight1.position.set( 1, 1, 1 );
				// scene.add( dirLight1 );

				// const dirLight2 = new THREE.DirectionalLight( 0x002288 );
				// dirLight2.position.set( - 1, - 1, - 1 );
				// scene.add( dirLight2 );

				// const ambientLight = new THREE.AmbientLight( 0x222222 );
				// scene.add( ambientLight );

                // Call Window Resize
                window.addEventListener( 'resize', onWindowResize );
            
                // Add event listener for keydown event (Orbital Camera Rotation)
                document.addEventListener('keydown', function(event) {
                    switch (event.key) {
                        case 'r':
                            // Toggle autorotation
                            orbitalControls.autoRotate = !isAutorotating;
                            isAutorotating = !isAutorotating;
                            break;
                        case 't':
                            // Increase rotation speed by 1, with a maximum of 20
                            if (rotationSpeed < 20) {
                                rotationSpeed += 1;
                            }
                            break;
                        case 'g':
                            // Decrease rotation speed by 1, with a minimum of 0
                            if (rotationSpeed > 0) {
                                rotationSpeed -= 1;
                            }
                            break;
                        case 'R':
                            // Flip rotation direction
                            rotationDirection = -rotationDirection;
                            break;
                        default:
                            break;
                    }
                });      

                // Add event listener for Camera FOV
                document.addEventListener('keydown', function(event) {
                    switch (event.key) {
                        case '7':
                            // Decrease FOV by 5mm
                            targetFOV = Math.max(camera.fov - 5, MIN_FOV); // Calculate the target FOV value
                            new TWEEN.Tween(camera).to({ fov: targetFOV }, 150).easing(TWEEN.Easing.Quadratic.Out).start(); // Tween the FOV value over 150ms using a quadratic easing function
                            break;
                        case '8':
                            // Reset FOV to Default
                            targetFOV = 50; 
                            new TWEEN.Tween(camera).to({ fov: targetFOV }, 150).easing(TWEEN.Easing.Quadratic.Out).start(); // Tween the FOV value over 150ms using a quadratic easing function
                            break;
                        case '9':
                            // Increase FOV by 5mm
                            targetFOV = Math.min(camera.fov + 5, MAX_FOV); // Calculate the target FOV value
                            new TWEEN.Tween(camera).to({ fov: targetFOV }, 150).easing(TWEEN.Easing.Quadratic.Out).start(); // Tween the FOV value over 150ms using a quadratic easing function
                            break;
                    }
                });  
                                
                // Add KeyDown event listener for FPS Movement
				document.addEventListener( 'keydown', function ( event ) {

                        switch ( event.code ) {

                            case 'ArrowUp':
                                pitchUp = true;
                                break;
                            case 'KeyW':
                                moveForward = true;
                                break;
                            case 'ArrowLeft':
                                rollLeft = true ;
                                break;
                            case 'KeyA':
                                moveLeft = true;
                                break;
                            case 'ArrowDown':
                                pitchDown = true ;
                                break;
                            case 'KeyS':
                                moveBackward = true;
                                break;
                            case 'ArrowRight':
                                rollRight = true ;
                                break;
                            case 'KeyD':
                                moveRight = true;
                                break;
                            case 'KeyR':
                                moveUp = true;
                                break;
                            case 'KeyF':
                                moveDown = true;
                                break;
                            case 'KeyQ':
                                yawLeft = true;
                                break;
                            case 'KeyE':
                                yawRight = true;
                                break;
                            case 'ShiftLeft':
                            case 'ShiftRight':
                                sprint=true;
                                break;
                            case 'Space':   
                                slowwalk=true;
                                break;                            
                        }

                    }

                );


                // Add KeyUp event listener for FPS Movement
                document.addEventListener( 'keyup', function ( event ) {

                        switch ( event.code ) {
                            case 'ArrowUp':
                                pitchUp = false;
                                break;
                            case 'KeyW':
                                moveForward = false;
                                break;
                            case 'ArrowLeft':
                                rollLeft = false ;
                                break;
                            case 'KeyA':
                                moveLeft = false;
                                break;
                            case 'ArrowDown':
                                pitchDown = false ;
                                break;
                            case 'KeyS':
                                moveBackward = false;
                                break;
                            case 'ArrowRight':
                                rollRight = false ;
                                break;
                            case 'KeyD':
                                moveRight = false;
                                break;
                            case 'KeyR':
                                moveUp = false;
                                break;
                            case 'KeyF':
                                moveDown = false;
                                break;
                            case 'KeyQ':
                                yawLeft = false;
                                break;
                            case 'KeyE':
                                yawRight = false;
                                break;
                            case 'ShiftLeft':
                            case 'ShiftRight':
                                sprint=false;
                                break;
                            case 'Space':   
                                slowwalk=false;
                                break;      

                        }

                    }
                    
                );

                


                document.addEventListener('keydown', event => {
                if (event.key === 'c') {
                    controlKeyPressed = true;
                } else if (controlKeyPressed) {
                    if (event.key === '1') {
                    //////////////// Switch to Orbital Controls
                    controls = orbitalControls;

                    // Enable Orbital Controls
                    orbitalControls.enabled = true;

                    //Disable Pointer Lock Controls
                    pointerLockControls.enabled = false;
                    pointerLockControls.unlock();

                    //Disable Fly Controls
                    flyControls.enabled = false;
 
                    // Use Tween to smoothly transition the control's target
                    new TWEEN.Tween(orbitalControls.target).to(new THREE.Vector3(0, 0, 0), 350).start();

                    // Define the camera's current direction vector and target direction vector
                    
                    camera.getWorldDirection(currentCamDirection);
                    const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                    // Use Tween to smoothly transition the camera's direction
                    new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                    camera.lookAt(currentCamDirection);
                    }).start();

                    } else if (event.key === '2') {
                    //////////////// Switch to Pointer Lock Controls
                    controls = pointerLockControls;

                    // Enable Pointer Lock Controls
                    pointerLockControls.enabled = true;
                    pointerLockControls.lock();

                    // Disable Orbital Controls
                    orbitalControls.enabled = false;

                    // Disable Fly Controls 
                    flyControls.enabled = false;

                    } else if (event.key === '3') {
                    //////////////// Switch to Fly Controls
                    controls = flyControls;

                    // Enable Fly Controls
                    flyControls.enabled = true;

                    // Disable Orbital Controls
                    orbitalControls.enabled = false;

                    //Disable Pointer Lock Controls
                    pointerLockControls.enabled = false;
                    pointerLockControls.unlock();

                    }
                    // Reset the keyPressed flag
                    controlKeyPressed = false;
                }
                });
                // // Set up button to toggle between controls
                // document.addEventListener('keydown', event => {
                //     if (event.key === 'c') {
                //         if (controls === orbitalControls) {
                //         // Switch to Pointer Lock Controls
                //         controls = pointerLockControls;

                //         // Disable Orbital Controls
                //         orbitalControls.enabled = false;

                //         // Enable Pointer Lock Controls
                //         pointerLockControls.enabled = true;
                //         pointerLockControls.lock();
                //         } else {
                //         // Switch to Orbital Controls
                //         controls = orbitalControls;

                //         // Disable Pointer Lock Controls
                //         pointerLockControls.enabled = false;
                //         pointerLockControls.unlock();

                //         // Enable Orbital Controls
                //         orbitalControls.enabled = true;
                        
                //         // Use Tween to smoothly transition the control's target
                //         new TWEEN.Tween(orbitalControls.target).to(new THREE.Vector3(0, 0, 0), 350).start();

                //         // Define the camera's current direction vector and target direction vector
                        
                //         camera.getWorldDirection(currentCamDirection);
                //         const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                //         // Use Tween to smoothly transition the camera's direction
                //         new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                //         camera.lookAt(currentCamDirection);
                //         }).start();

                //         }

                //     }
                // });


                // Set up button to lock camera to target (0,0,0)
                document.addEventListener('keydown', function(event) {
                    if (event.key === 'O' && controls != orbitalControls) {
                        lockTarget=!lockTarget;
                    }
                });

                // Set up button to reset orbital target to (0,0,0)
                document.addEventListener('keydown', function(event) {
                    if (event.key === 'o' && controls === orbitalControls) {
                        new TWEEN.Tween(orbitalControls.target).to(new THREE.Vector3(0, 0, 0), 350).start();
                    }
                });

                // Set up button to reset pointerlock target to (0,0,0)
                document.addEventListener('keydown', function(event) {
                    if (event.key === 'o' && controls === pointerLockControls) {
                        // Define the camera's current direction vector and target direction vector

                        camera.getWorldDirection(currentCamDirection);
                        const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                        // Use Tween to smoothly transition the camera's direction
                        new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                        camera.lookAt(currentCamDirection);
                        }).start();
                    }
                });


                // Set up button to reset flycontrols target to (0,0,0)
                document.addEventListener('keydown', function(event) {
                    if (event.key === 'o' && controls === flyControls) {
                        // Define the camera's current direction vector and target direction vector

                        camera.getWorldDirection(currentCamDirection);
                        const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                        // Use Tween to smoothly transition the camera's direction
                        new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                        camera.lookAt(currentCamDirection);
                        }).start();
                    }
                });


            } // closing init() function
      
            // Declare animate function
            function animate() { 
                requestAnimationFrame( animate );
                
                console.log(isPaused)
                // Required if controls.enableDamping or controls.autoRotate are set to true
                orbitalControls.autoRotateSpeed =  rotationSpeed * rotationDirection; // Set the autoRotateSpeed property based on the rotation speed and direction
                
                // Required for locking on target when 'O' is pressed
                if (lockTarget) {
                    camera.getWorldDirection(currentCamDirection);
                    const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                    // Use Tween to smoothly transition the camera's direction
                    new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                    camera.lookAt(currentCamDirection);
                    }).start();
                }

                // FPS Controls 
				const time = performance.now();

                let delta 

				if ( pointerLockControls.enabled && pointerLockControls.isLocked === true ) {

                    if (sprint) {
                        delta = ( time - prevTime ) / 700; // Increase movement speed 
                    } else if (slowwalk) {
                        delta = ( time - prevTime ) / 9000; // Slow down movement 
                    } 
                    else {
                        delta = ( time - prevTime ) / 2500; // Normal Movement speed
                    }

					velocity.x -= velocity.x * 20.0 * delta; // increasing more than 10 slows movement
					velocity.z -= velocity.z * 20.0 * delta;
					velocity.y = 0;
                    //velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

					direction.z = Number( moveForward ) - Number( moveBackward );
					direction.x = Number( moveRight ) - Number( moveLeft );
					direction.normalize(); // this ensures consistent movements in all directions

                    // Define the angle of rotation in radians
                    let angle = Math.PI * delta / 1.5 ; 

                    // Create a rotation matrix for the y-axis
                    let rotationMatrix = new THREE.Matrix4().makeRotationY(angle);

					if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
					if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;
                    if ( moveUp ) {
                        camera.position.y = Math.min(camera.position.y + 3 * delta, maxCamHeight); // Limit maximum camera height
                    }
                    if ( moveDown ) {
                        camera.position.y = Math.max(camera.position.y - 3 * delta, minCamHeight); // Limit minimum camera height
                    }
                    if ( yawLeft ) {
                        // Apply the rotation to the camera
                        camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), angle);
                    }
                    if ( yawRight ) {
                        // Apply the rotation to the camera
                        camera.rotateOnWorldAxis(new THREE.Vector3(0, -1, 0), angle);
                    }
                    if (pitchUp){camera.rotateX(0.02);}
                    if (pitchDown){camera.rotateX(-0.02);}
                    if (rollLeft){camera.rotateZ(0.02);}
                    if (rollRight){camera.rotateZ(-0.02);}
                    

					pointerLockControls.moveRight( - velocity.x * delta );
					pointerLockControls.moveForward( - velocity.z * delta );
					pointerLockControls.getObject().position.y += ( velocity.y * delta ); // This line updates the vertical position of the camera object based on its current velocity and the time elapsed since the last frame (the delta value).
                    
				}

                
				prevTime = time;

                // Update Fly Controls
                if ( flyControls.enabled ) {

                    if (sprint) {
                        delta = ( time - prevTime ) / 700; // Increase movement speed 
                    } else if (slowwalk) {
                        delta = ( time - prevTime ) / 9000; // Slow down movement 
                    } 
                    else {
                        delta = ( time - prevTime ) / 2500; // Normal Movement speed
                    }
                    flyControls.update(delta);
                }

                
                // Update the camera's projection matrix
                camera.updateProjectionMatrix();
                // Update the camera height display
                const cameraHeightDiv = document.getElementById('camera-height');
                cameraHeightDiv.textContent = `Camera height: ${camera.position.y.toFixed(2)} m`;
                // Update the camera FOV display
                const cameraFOVDiv = document.getElementById('camera-FOV');
                cameraFOVDiv.textContent = `Camera FOV: ${camera.fov.toFixed(2)} \u00B0`;

                // Update Orbital Controls
                if ( orbitalControls.enabled ) {
                    orbitalControls.update();

                }

                
                // Update Tween
                TWEEN.update()

                //Render Scene
                render();

                

                //Pause Controls when Paused
                if(isPaused){
                    orbitalControls.enabled = false;
                    pointerLockControls.enabled = false;
                    flyControls.enabled = false;
                }else {

                    if (controls === 'OrbitControls') {
                        orbitalControls.enabled = true;
                    } else if (controls === 'PointerLockControls') {
                        pointerLockControls.enabled = true; 
                    } else if (controls === 'flyControls') {
                        flyControls.enabled = true; 
                    }

                }
            
            }

            // Function for WindowResize
            function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );
            render();

            }