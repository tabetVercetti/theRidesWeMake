import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { TWEEN } from 'three/addons/libs/tween.module.min.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';




let scene, camera, renderer, composer, hlight, car, testCube, testPlane, controls, orbitalControls, pointerLockControls, objectCenter, ground, carModel, wheel_FL, wheel_FR, wheel_RL, wheel_RR, body, glass,lights_rear, initialFrontWheelHeight, initialRearWheelHeight, initialBodyHeight, stats ; 
let floorShadowPlane; 
const initialShadowPlaneHeight = 0.005;
let test, test2;
let sky, sun;
let aomap,aomap2, aoMapBody, aoMapFloor;
let guiExposure = null;

// GUI parms 
const params = {
    color: 0xffffff,
    metalness: 1,
    roughness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    HDRIexposure: 1.0,
    ToneMapping: 'ACESFilmic',
    HDRImap: 'Map1',
    HDRIblurriness: 0,
    HDRIintensity: 1.0,
};

const toneMappingOptions = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
};

var hdriOptions = {
    None: null, // If you want an option for no HDRI map
    Map1: 'studio_small_08_4k.hdr',
    Map2: 'belfast_sunset_puresky_4k.hdr',
    // Add more maps as needed
};


//pause menu stuff
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );
const resume = document.getElementById( 'resume' );
let paused;
let PLCinitialized = false;
// let pressedESCtolock = false;
//let OCinitialized = false ;  

//Perlin Noise Stuff
let x_perlin = 0; // Initial value for x
let x_perlin_flatness = 0;
const seed_perlin = 42; // You can choose any seed value you like

startmenu()

function startmenu() {
    paused = true;
    console.log('im in OC. Start')
    blocker.style.display = 'block';
    instructions.style.display = '';
    resume.style.display = 'block';
}



function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
function lerp(t, a, b) {
return a + t * (b - a);
    }

function grad(hash, x) {
const h = hash & 15;
const grad = 1 + (h & 7); // Gradient value between 1 and 8
return (h & 8 ? -grad : grad) * x; // Random gradient direction
    }

// function generatePerlinNoise(x, seed) {
// const X = Math.floor(x) & 255;
// x -= Math.floor(x);
// const fadeX = fade(x);

// const hash = (seed << 4) ^ X;
// const grad1 = grad(hash, x);
// const grad2 = grad(hash + 1, x - 1);

// const noise = lerp(fadeX, grad1, grad2);
// return noise * 2 - 1; // Scale the output to be between -1 and 1
//     }

// function perlinNoiseRoad(x, seed) {
// const noise = generatePerlinNoise(x, seed);
// return noise * roadOndulationAmplitude; // Scale the output to be between -2 and 2
//     }

// function perlinNoiseBump(x, seed) {
// const noise = generatePerlinNoise(x, seed);
// return noise ; // 
//    }

function perlinNoise1D(x) {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const fadeX = fade(x);
    const grad1 = grad(p[X], x);
    const grad2 = grad(p[X + 1], x - 1);
    const firstPass = lerp(fadeX, (grad1 + 1) / 2, (grad2 + 1) / 2);
    const secondPass = Math.tanh(firstPass) // keeps values between -1 and 1
    // to switch rand to 0 and 1, multiply by 0.5 and add 0.5

    return secondPass *roadOndulationAmplitude;
  }


function perlinNoiseZeroToOne(x) {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const fadeX = fade(x);
    const grad1 = grad(p[X], x);
    const grad2 = grad(p[X + 1], x - 1);
    const firstPass = lerp(fadeX, (grad1 + 1) / 2, (grad2 + 1) / 2);
    const secondPass = Math.tanh(firstPass) // keeps values between -1 and 1
    // to switch rand to 0 and 1, multiply by 0.5 and add 0.5

    return secondPass * 0.5 + 0.5;
  }
  
  // Generate a permutation array with values from 0 to 255
const p = new Array(512);
for (let i = 0; i < 256; i++) {
    p[i] = p[i + 256] = Math.floor(Math.random() * 256);
  }


const brakeLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF0000, // Red color
    emissive: 0xFF0000, // Red color
    emissiveIntensity: 20, // Intensity of the red glow
  });
//var brakeLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
let originBrakeLightMaterial;


let isAutorotating = true;
let rotationSpeed = 0; // Initial rotation speed
let rotationDirection = 1; // Initial rotation direction (1 for clockwise, -1 for counterclockwise)
let CameraRoll=0;

let carSpeed = 0;
let oldCarSpeed = 0;
let carAccel = 0;
let wheelRotationSpeed = 0; // Adjust this value to control the speed
let wheelRotationDirection = -1; // -1 for forward, 1 for reverse
let minWheelRotationSpeed = 0;
let maxWheelRotationSpeed = 2;
let wheelAcceleration = 0;
let maxWheelAcceleration = 0.015; // Adjust as needed
let maxWheelDeceleration = 0.015; // Adjust as needed
let distanceDriven = 0;
let distanceDrivenOnBumpFront = 0;
let distanceDrivenOnBumpRear = 0;
var bumpPhaseFront = 0;
var bumpPhaseRear = 0;
var prevBumpPhaseFront = bumpPhaseFront;
var prevBumpPhaseRear = bumpPhaseRear;
let bumpIsFlatteningFront = false;
let bumpIsFlatteningRear = false;
let prevNumbOfBumps = 0 ;

const rollingResistance = 0.0; // Adjust as needed, 0.001 is a good value
// const airResistance = 0.0; // Adjust as needed
const gravity = 9.81;
var COG_h = 0;
var wheelBase = 0;
var bodyPitch = 0;
var bumpPitch = 0;
const pitchStiffness = 0.2;
const pitchSpeed = 0.075;
// var trackWidth = 0;

// Example code to animate suspension movement

const maxWheelVerticalTravel = 0.01; // value set by creator of each car
let roadBumpHeight;
let roadBumpFrequency;
let wheel_FR_verticalTravel;

const roadOndulationIntensity = 0.15 // value set by user, range from 0 to 1, 0 being flat road and 1 being road with max ondulation
let roadOndulationAmplitude //= 0.01; // Adjust the intensity of the suspension effect
//const roadBumpFrequency = 0.05; // Adjust the speed of the suspension effect
const roadFlatnessFactor = 0.4; // Set the desired flatness percentage (0 to 1) -- not being used anymore
const roadBumpinessIntensity = 0.8; // value set by user, range from 0 to 1, set to 0 for no bumps and 1 for very very bumpy road
const roadBumpCheck = 10; // sample distance for checking if road has bump or not
const maxRoadBumpFrequency = 0.1;
const minRoadBumpFrequency = 0.04;
let isOnBump = false;
let isOnBumpFront = false; 
let isOnBumpRear = false; 
//const targetRoadFlatnessValue = 0;




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
let isdriving = false;
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




// Initialize the scene
init();

// Start the animation loop
animate();

console.log(scene)

function render() {
// to add bloom, add this 
composer.render( scene, camera )  
// to add bloom, add this 
//renderer.render( scene, camera );

}

function PLCinit() {


    pointerLockControls.addEventListener( 'lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';
        console.log('PLC says none - lock');
        return;


    } );

    pointerLockControls.addEventListener( 'unlock', function () {



            if (pointerLockControls.enabled){
                paused=true;
                blocker.style.display = 'block';
                instructions.style.display = '';
                setTimeout(() => {
                    resume.style.display = 'block';
                }, 1000)
                moveForward = false;
                moveBackward = false;
                moveLeft = false;
                moveRight = false;
                moveUp = false;
                moveDown = false;
                yawRight = false;
                yawLeft = false;
                pitchDown = false;
                pitchUp = false; 
                rollLeft = false;
                rollRight = false;
                sprint = false;
                slowwalk = false;
                console.log('PLC says block - unlock');
            } 
            else {

                instructions.style.display = 'none';
                blocker.style.display = 'none';
                console.log('PLC says none - unlock - aka change to OC');
            }


    }
     );

    
    
    }

    function OCinit() {

        console.log('im in OC Init function')

        console.log(paused);
    
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (!paused && orbitalControls.enabled) {
                    paused=true;
                    console.log('im in pause . OC function')
                    blocker.style.display = 'block';
                    instructions.style.display = '';
                    resume.style.display = 'block';  
                    console.log('i hear click');        
                    } else if (paused && orbitalControls.enabled){
                        paused = false;
                        resume.style.display = 'none';
                        instructions.style.display = 'none';
                        blocker.style.display = 'none';
                        
                    } 

                console.log(paused);
            }
            });
        
        }


function init() {



    // Create the scene

    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0xdddddd);
    //scene.fog = new THREE.FogExp2( 0xcccccc, 0.02 );
    scene.backgroundBlurriness = params.blurriness;

    const flakes_normalMap = new THREE.TextureLoader().load( 'Textures/flakes_normalMap.003.png' );
    flakes_normalMap.wrapS = THREE.RepeatWrapping;
    flakes_normalMap.wrapT = THREE.RepeatWrapping;
    flakes_normalMap.repeat.set( 1, 1 );

    new RGBELoader()
        .setPath( 'Environment/' )
        .load( hdriOptions[params.HDRImap], function ( texture ) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            render();

        });

    // materials

    const floorAOMaterial = new THREE.MeshStandardMaterial( {
        color: 0x000000, metalness: 1.0, roughness: 1
    } );

    const floorAOMaterialCube = new THREE.MeshStandardMaterial( {
        color: 0x000000, metalness: 1.0, roughness: 1
    } );

    const bodyMaterial = new THREE.MeshPhysicalMaterial( {
        color: params.color, 
        metalness: params.metalness, 
        roughness: params.roughness, 
        clearcoat: params.clearcoat, 
        clearcoatRoughness: params.clearcoatRoughness //341f0b // 7C5B2D
    } );

    const detailsMaterial = new THREE.MeshPhysicalMaterial( {
        color: 0xff0000, metalness: 0.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
    } );

    const glassMaterial = new THREE.MeshPhysicalMaterial( {
        color: 0xffffff, metalness: 0, roughness: 0, transmission: 1.0
    } );


    //Ground
    const groundGeo = new THREE.PlaneGeometry( 100, 100 ); // i noticed that if ground is too large, shadows shake on it
    //const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
    //groundMat.color.setHSL( 0.095, 1, 0.75 );
    const groundMat = new THREE.MeshPhysicalMaterial( {
        color: 0x6c8093, metalness: 1.0, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.3
    } );
    

    ground = new THREE.Mesh( groundGeo, groundMat );
    ground.position.y = 0;
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add( ground );


    // // // Load the GLTF file - Datsun
    // let loader = new GLTFLoader().setPath( 'Car/Datsun/' );;
    // loader.load('scene.gltf',function(gltf){                    
    //     car = gltf.scene.children[0];
    //     car.scale.set(0.00175,0.00175,0.00175);
    //         //Move the object up by 10 units in the y direction
    //     car.position.y += 11.04;
    //     //car.position.z +=1;
    //     car.position.x +=7;
    //     car.rotation.z += 90;
    //     car.castShadow = true;
    //     car.receiveShadow = true ; 
    //     scene.add(gltf.scene);
    //     render();
    // });

    // // Load the GLTF file - Floor Shadow Test Cube
    let loaderplane = new GLTFLoader().setPath( 'Car/TestCar/' );;
    loaderplane.load('TestPlane.glb',function(gltf){                    
        testPlane = gltf.scene.children[0];
        gltf.scene.traverse(function(child){
            if(child.material && child.material.aoMap){
                aomap2 = child.material.aoMap;
            }
        });
        // testPlane.scale.set(0.002,0.002,0.002);
        //     // Move the object up by 10 units in the y direction
        testPlane.position.y += 0.01; // raise plane abit to avoid z-fighting/glitching
        
        testPlane.material = floorAOMaterialCube ;
        //testPlane.material.aoMap = aomap2;

        testPlane.material.alphaMap = aomap2;
        testPlane.material.transparent = true ;
        
        testPlane.material.opacity = 1 ; // provides ability to fine tune shadow opacity
        //testPlane.material.blending.THREE.NoBlending;
        //testPlane.material.alphaHash = true ;

        //testPlane.castShadow = true;
        //testPlane.receiveShadow = true ; 
        scene.add(gltf.scene);
        render();
        console.log(testPlane)
    });


    // // Load the GLTF file - Datsun
    let loadercube = new GLTFLoader().setPath( 'Car/TestCar/' );;
    loadercube.load('TestCube4.glb',function(gltf){                    
        testCube = gltf.scene.children[0];
        gltf.scene.traverse(function(child){
            if(child.material && child.material.aoMap){
                aomap = child.material.aoMap;
            }
        });
        // testCube.scale.set(0.002,0.002,0.002);
        //     // Move the object up by 10 units in the y direction
        //testCube.position.y += 0.5;
        
        testCube.material = detailsMaterial ;
        testCube.material.aoMap = aomap;

        // // normal map flakes
        // testCube.material.normalMap = flakes_normalMap ; 
        // //testCube.material.normalMapType = THREE.ObjectSpaceNormalMap;
        // testCube.material.normalScale.set(20, 20)

        // testCube.material.alphaMap = aomap;
        // testCube.material.transparent = true ;
    

        //testCube.castShadow = true;
        //testCube.receiveShadow = true ; 
        scene.add(gltf.scene);
        render();
        //console.log(testCube)
    });


    // // Load the GLTF file - human
    // let loaderHuman = new GLTFLoader();
    // loaderHuman.load('human.gltf',function(gltf){
    //     const humanMesh = gltf.scene.children [0];
    //     humanMesh.scale.set (10,10,10);
    //     humanMesh.position.x = -10; 
    //     humanMesh.castShadow = true ;                    
    //     scene.add(gltf.scene);
    //     render();
    // });


    // Load the GLTF file - TestCar
    let loader1 = new GLTFLoader().setPath( 'Car/TestCar/' );;
    loader1.load('TestCarVD5.glb',function(gltf){                    
        carModel = gltf.scene;
        gltf.scene.traverse(function(child){
            if(child.isMesh){
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    


    // const carParts = {
    //     body: [],
    // };
    // carModel.traverse(child =>{
    //     if (child.name.includes('body')){
    //         carParts.body.push(child);
    //     }
    // });
    // body=carParts.body;

    //carModel.getObjectByName( 'bodyglass' ).material = glassMaterial;
    //carModel.getObjectByName( 'body' ).material = bodyMaterial;

    wheel_FR = carModel.getObjectByName('wheel_FR');
    wheel_FL = carModel.getObjectByName('wheel_FL');
    wheel_RR = carModel.getObjectByName('wheel_RR');
    wheel_RL = carModel.getObjectByName('wheel_RL');
    
    body = carModel.getObjectByName('body');
    aoMapBody = body.material.aoMap
    body.material = bodyMaterial;
    body.material.aoMap = aoMapBody;

    //carmolel.rotation.y=

    // body.material.color.r = 1;
    // body.material.color.g = 0;
    // body.material.color.b = 0;
    // body.material.side = 0; //enables backface culling

    
    floorShadowPlane = carModel.getObjectByName ('floorShadow');
    floorShadowPlane.position.y += initialShadowPlaneHeight; // raise plane abit to avoid z-fighting/glitching
    aoMapFloor = floorShadowPlane.material.aoMap;
    floorShadowPlane.material = floorAOMaterial;
    floorShadowPlane.material.alphaMap = aoMapFloor;
    floorShadowPlane.material.transparent = true;
    floorShadowPlane.material.opacity = 1;


    body.material.roughnessMap = flakes_normalMap ; 
    //body.material.metalnessMap = flakes_normalMap;
    //body.material.clearcoatNormalMap = flakes_normalMap ; 
    // body.material.normalMap = flakes_normalMap ; 
    // body.material.normalScale.set(3, 3);

    wheel_FL.material.color.g = 1;

    //glass = carModel.getObjectByName('glass');
    //lights_rear = carModel.getObjectByName('lights_rear');

    //lights_rear.material = brakeLightMaterial;

    var boundingBox_carModel = new THREE.Box3().setFromObject(carModel);
    var COG_car = boundingBox_carModel.getCenter(new THREE.Vector3());
    COG_h = COG_car.y;
    initialBodyHeight = body.position.y;
    console.log('COG car is',COG_h);

    // var boundingBox_body = new THREE.Box3().setFromObject(body);
    // var COG_body = boundingBox_body.getCenter(new THREE.Vector3());
    // initialBodyHeight = COG_body.y;
    // console.log('COG body is',initialBodyHeight);

    // test = carModel.position;
    // test2 = body.position;
    // console.log('test cog body is',test,'and',test2);

    var boundingBox_wheel_FR = new THREE.Box3().setFromObject(wheel_FR);
    var COG_wheel_FR = boundingBox_wheel_FR.getCenter(new THREE.Vector3());
    initialFrontWheelHeight = COG_wheel_FR.y;
    console.log(initialFrontWheelHeight);

    var boundingBox_wheel_RR = new THREE.Box3().setFromObject(wheel_RR);
    var COG_wheel_RR = boundingBox_wheel_RR.getCenter(new THREE.Vector3());
    initialRearWheelHeight = COG_wheel_RR.y;

    wheelBase = COG_wheel_FR.x - COG_wheel_RR.x; 

    console.log('wheelbase is',wheelBase)
     
    scene.add(carModel);
    console.log(carModel)
    render();
    });
            //});

            

            // // Load the GLTF file
            // let loader2 = new GLTFLoader().setPath( 'Car/Bidaya/' );;
            // loader2.load('bidaya_mat.gltf',function(gltf){                    
            //     // car = gltf.scene.children[0];
            //     // car.scale.set(1,1,1);
            //     scene.add(gltf.scene);
            //     let bbox = new THREE.Box3().setFromObject( gltf.scene ); // Gets Bounding Box of GLTF
            //     objectCenter = bbox.getCenter( new THREE.Vector3() ); // Gets center of Bounding Box
            //     console.log('Object Height:',objectCenter.y)
            //     render();
            // });

            // // Load the GLTF file - Floor
            // let loaderFloor = new GLTFLoader();
            // loaderFloor.load('floor.gltf',function(gltf){ 
            //     ground = gltf.scene;
            //     gltf.scene.traverse(function(child){
            //         if(child.isMesh){
            //             child.castShadow = true;
            //             child.receiveShadow = true;
            //         }
            //     });  
            //     ground.receiveShadow = true;                 
            //     scene.add(ground);
            //     render();
            // });

    //GROUND



    // // Load the GLTF file - human
    // let loaderHuman = new GLTFLoader();
    // loaderHuman.load('human.gltf',function(gltf){                    
    //     scene.add(gltf.scene);
    //     render();
    // });




    // Create GUI
    const gui = new GUI();
    const toneMappingFolder = gui.addFolder( 'tone mapping' );

        toneMappingFolder.add( params, 'ToneMapping', Object.keys( toneMappingOptions ) )

        .onChange( function () {

            updateGUIToneMapping( toneMappingFolder );

            renderer.toneMapping = toneMappingOptions[ params.ToneMapping ];
            render();
            //console.log('batata2')

        } );

    const backgroundFolder = gui.addFolder( 'background' );

        backgroundFolder.add( params, 'HDRImap', Object.keys( hdriOptions ) )

        .onChange( function () {

            //updateGUIToneMapping( toneMappingFolder );
            updateHDRI(backgroundFolder)
            //renderer.toneMapping = toneMappingOptions[ params.ToneMapping ];
            render();
            //console.log('batata2')

            } );

        backgroundFolder.add( params, 'HDRIblurriness', 0, 1 )

            .onChange( function ( value ) {

                scene.backgroundBlurriness = value;
                render();

            } );

        backgroundFolder.add( params, 'HDRIintensity', 0, 1 )

            .onChange( function ( value ) {

                scene.backgroundIntensity = value;
                render();

            } );

    gui.addColor( params, 'color' )
    .onChange( function () {

        bodyMaterial.color.set( params.color );
        render();

    } );

    gui.add( params, 'metalness', 0, 1, 0.01 )
    .onChange( function () {

        bodyMaterial.metalness = params.metalness;
        render();

    } );

    gui.add( params, 'roughness', 0, 1, 0.01 )
    .onChange( function () {

        bodyMaterial.roughness = params.roughness;
        render();

    } );

    gui.add( params, 'clearcoat', 0, 1, 0.01 )
    .onChange( function () {

        bodyMaterial.clearcoat = params.clearcoat;
        render();

    } );

    gui.add( params, 'clearcoatRoughness', 0, 1, 0.01 )
    .onChange( function () {

        bodyMaterial.clearcoatRoughness = params.clearcoatRoughness;
        render();

    } );

    updateGUIToneMapping( toneMappingFolder );

    gui.open();




    // Create the renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    //renderer.useLegacyLights = false;

    // renderer.toneMapping = THREE.ACESFilmicToneMapping;// check the diff options
    // renderer.toneMappingExposure = 1;

    
    renderer.toneMapping = toneMappingOptions[ params.ToneMapping ];
    renderer.toneMappingExposure = params.HDRIexposure;



    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement); 
   
    
    // Create Stats info
	stats = new Stats();
	document.body.appendChild( stats.dom );

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

    // Create a new <div> element to display the wheel acceleration
    const WheelAccel = document.createElement('div');
    WheelAccel.id = 'wheel-accel';
    WheelAccel.style.position = 'absolute';
    WheelAccel.style.top = '50px';
    WheelAccel.style.left = '10px';
    WheelAccel.style.color = 'white';
    document.body.appendChild(WheelAccel);

    // Create a new <div> element to display the wheel speed
    const WheelSpeed = document.createElement('div');
    WheelSpeed.id = 'wheel-speed';
    WheelSpeed.style.position = 'absolute';
    WheelSpeed.style.top = '70px';
    WheelSpeed.style.left = '10px';
    WheelSpeed.style.color = 'white';
    document.body.appendChild(WheelSpeed);

    // Create a new <div> element to display the car velocity
    const carVelocity = document.createElement('div');
    carVelocity.id = 'car-velocity';
    carVelocity.style.position = 'absolute';
    carVelocity.style.top = '90px';
    carVelocity.style.left = '10px';
    carVelocity.style.color = 'white';
    document.body.appendChild(carVelocity);

    // Create a new <div> element to display the distance travelled
    const distanceTravelled = document.createElement('div');
    distanceTravelled.id = 'car-distance';
    distanceTravelled.style.position = 'absolute';
    distanceTravelled.style.top = '110px';
    distanceTravelled.style.left = '10px';
    distanceTravelled.style.color = 'white';
    document.body.appendChild(distanceTravelled);
    

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
    if (camera.position.y < 0.01) {
        camera.position.setY(0.01);
        orbitalControls.target.setY(0);
    }


    // Create controls for PointerLockControls.js
    pointerLockControls = new PointerLockControls( camera, document.body );


    
    // Set initial controls
    let controls = orbitalControls;
    pointerLockControls.enabled = false;
    orbitalControls.enabled = true;
    OCinit();


        resume.addEventListener( 'click', function () {

            if (pointerLockControls.enabled) {
                paused = false;
                pointerLockControls.lock();
                resume.style.display = 'none';
                instructions.style.display = 'none';
                blocker.style.display = 'none';
            } else if (orbitalControls.enabled) {
                paused = false;
                resume.style.display = 'none';
                instructions.style.display = 'none';
                blocker.style.display = 'none';
                
            }

        } );


        const target = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight, {
            type: THREE.HalfFloatType,
            format: THREE.RGBAFormat,
            //encoding: THREE.sRGBEncoding,
            encoding: THREE.LinearEncoding
          })
        target.samples = 8

        // to add bloom, add this 
        const renderScene = new RenderPass( scene, camera );
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1, 1, 2 ); // strength, radius ,threshold
        // bloomPass.threshold = 0;
        // bloomPass.strength = 0.5;
        // bloomPass.radius = 0;
        // bloomPass.exposure = 0;

        composer = new EffectComposer( renderer );
        //composer.renderToScreen = false ; 
        composer.addPass( renderScene );

        // const lightsRearBloomPassIndex = 1;
        composer.addPass( bloomPass );
        // bloomPass.selectedObjects = [scene.children[lightsRearBloomPassIndex]];

        // to add bloom, add this 




       


    // // Create cool triangle pyramids
    // const geometry = new THREE.CylinderGeometry( 0, 10, 30, 4, 1 );
    // const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

    // for ( let i = 0; i < 500; i ++ ) {

    //     const mesh = new THREE.Mesh( geometry, material );
    //     mesh.position.x = Math.random() * 1600 - 800;
    //     mesh.position.y = 0;
    //     mesh.position.z = Math.random() * 1600 - 800;
    //     mesh.updateMatrix();
    //     mesh.matrixAutoUpdate = false;
    //     scene.add( mesh );

    // }

    //another test cube
    const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
    // const material = new THREE.MeshPhongMaterial( {
    //     color: 0x999999,
    //     shininess: 0.5,
    //     specular: 0x222222
    // } );
    const cube = new THREE.Mesh( geometry, 
        new THREE.MeshStandardMaterial({
          toneMapped: false,
          emissive: "red",
          emissiveIntensity: 10
        }) 
        
        //new THREE.MeshBasicMaterial({ toneMapped: false, color: new THREE.Color().setRGB(10, 10, 10) })
        
        ); 
    cube.position.y = 1;
    cube.position.x = 3;
    cube.castShadow = true;
    scene.add( cube );

    // LIGHTS

    // Directional Light

    const dirLight = new THREE.DirectionalLight( 0x35ff02 , 1);
	//dirLight.color.setHSL( 1.3, 1, 0.95 );
    //dirLight.color.setHex( 0x35ff02 );
	dirLight.position.set( - 1, 1.75, 1 );
	dirLight.position.multiplyScalar( 30 );
	//scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 1000//4096 //4096 //2048 //8192//2048;
	dirLight.shadow.mapSize.height = 1000 //4096//4096 //2048 //8192//2048;

	const d = 10;// the larger the blurrier the shadows become

	dirLight.shadow.camera.left = - d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = - d;

	dirLight.shadow.camera.far = 350;
	dirLight.shadow.bias =  0; // the smaller the more accurate, default was - 0.0001

	const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
	//scene.add( dirLightHelper );

    // HemisphereLight 

    // const hemLight = new THREE.HemisphereLight( 0x35ff02, 0x000000, 1 ); //first color is Skycolor, second is ground color)
    // scene.add( hemLight );

    // // Ambient Light 

    const ambLight = new THREE.AmbientLight( 0x0019ff );
    //scene.add( ambLight );


    // const light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    // light.position.set(20, 10, 10);
    // light.target.position.set(0, 0, 0);
    // light.castShadow = true ;
    // // light.shadow.bias = -0.001;
    // // light.shadow.mapSize.width = 2048;
    // // light.shadow.mapSize.height = 2048;
    // // light.shadow.camera.near = 0.1;
    // // light.shadow.camera.far = 500.0;
    // // light.shadow.camera.near = 0.5;
    // // light.shadow.camera.far = 500.0;
    // // light.shadow.camera.left = 100;
    // // light.shadow.camera.right = -100;
    // // light.shadow.camera.top = 100;
    // // light.shadow.camera.bottom = -100;
    // scene.add( light );

    // //Create a helper for the shadow camera (optional)
    // const helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );
    

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

    // // Add Sky

    // sky = new Sky();
    // sky.scale.setScalar( 450000 );
    // scene.add( sky );

    // sun = new THREE.Vector3();


    // Call Window Resize
    window.addEventListener( 'resize', onWindowResize );

    // Add event listener for keydown event (Orbital Camera Rotation)
    document.addEventListener('keydown', function(event) {
        if(!paused){
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
        }

    });    
    



    // Add event listener for Camera FOV
    document.addEventListener('keydown', function(event) {
        if(!paused){
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
        }
    });  

    // // Add event listener for enabling driving
    // document.addEventListener('keydown', function(event) {
    //     if(!paused){
    //         if (event.key === 'b' ) {
    //             isdriving=!isdriving;
    //         }
    //         // decrease driving speed
    //         if (event.key === 'n' ) {
    //             if(wheelRotationSpeed > 0){
    //                 wheelRotationSpeed -= 0.1;
    //             }
    //         }
    //         // increase driving speed
    //         if (event.key === 'm') {
    //             if(wheelRotationSpeed < 20){
    //                 wheelRotationSpeed += 0.1;
    //             }
    //         }
    //     }
    // }); 


    // Add event listener for enabling driving
    document.addEventListener('keydown', function(event) {
        if(!paused){
            switch (event.key) {
                case 'b':
                    // Toggle driving
                    isdriving=!isdriving;
                    break;

                default:
                    break;
            }
        }

    }); 

    // Accelerate button (m key)
    window.addEventListener('keydown', (event) => {
        if (event.key === 'm') {
                wheelAcceleration = maxWheelAcceleration * (1 - Math.pow((wheelRotationSpeed / maxWheelRotationSpeed),2)); // Adjust as needed
        }
    });

    // Decelerate button (n key)
    window.addEventListener('keydown', (event) => {
        if (event.key === 'n') {
            wheelAcceleration = -maxWheelDeceleration * (Math.pow((wheelRotationSpeed / maxWheelRotationSpeed),0.2)); // Adjust as needed

        }
    });


    // Stop accelerating or decelerating when releasing the buttons
    window.addEventListener('keyup', (event) => {
        if (event.code === 'KeyM' || event.code === 'KeyN') {
          // Released 'm' or 'n' key, stop accelerating/decelerating
          wheelAcceleration = 0;
        }
      });

    
                    
    // Add KeyDown event listener for FPS Movement
    const onKeyDownFPS = function ( event ) {

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

        };

    document.addEventListener( 'keydown', onKeyDownFPS );


    // Add KeyUp event listener for FPS Movement
    const onKeyUpFPS = function ( event ) {

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

        };
        
    

    document.addEventListener( 'keyup', onKeyUpFPS );


    // Set up button to toggle between controls
    document.addEventListener('keydown', event => {
        if(!paused){
            if (event.key === 'c') {
                if (controls === orbitalControls) {
                // Switch to Pointer Lock Controls
                controls = pointerLockControls;

                // Disable Orbital Controls
                orbitalControls.enabled = false;

                // Enable Pointer Lock Controls
                pointerLockControls.enabled = true;
                pointerLockControls.lock();

                //initialize lock and unlock for pause menu
                if (!PLCinitialized){
                    PLCinit();
                    PLCinitialized = true;
                }
                

                } else {

                // //initialize lock and unlock for pause menu
                // if (!OCinitialized){
                //     OCinit();
                //     OCinitialized = true;
                // }

                // Switch to Orbital Controls
                controls = orbitalControls;

                // Disable Pointer Lock Controls
                pointerLockControls.enabled = false;
                pointerLockControls.unlock();

                // Enable Orbital Controls
                orbitalControls.enabled = true;


                
                // Use Tween to smoothly transition the control's target
                new TWEEN.Tween(orbitalControls.target).to(new THREE.Vector3(0, 0, 0), 350).start();

                // Define the camera's current direction vector and target direction vector
                
                camera.getWorldDirection(currentCamDirection);
                const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                // Use Tween to smoothly transition the camera's direction
                new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                camera.lookAt(currentCamDirection);
                }).start();


                }

            }
        }
    });


    // Set up button to lock camera to target (0,0,0)
    document.addEventListener('keydown', function(event) {
        if(!paused){
            if (event.key === 'O' && controls != orbitalControls) {
                lockTarget=!lockTarget;
            }
        }
    });

    // Set up button to reset orbital target to (0,0,0)
    document.addEventListener('keydown', function(event) {
        if(!paused){
            if (event.key === 'o' && controls === orbitalControls) {
                new TWEEN.Tween(orbitalControls.target).to(new THREE.Vector3(0, 0, 0), 350).start();
            }
        }
    });

    // Set up button to reset camera roll to 0
    document.addEventListener('keydown', function(event) {
        if(!paused){
            if (event.key === 'p' && controls === pointerLockControls) {
                // camera.rotation.z = CameraRoll;
                camera.rotateZ(-CameraRoll);
                CameraRoll=0;
            }
        }
    });

    // Set up button to reset camera roll to 0
    document.addEventListener('keydown', function(event) {
        if(!paused){
            if (event.key === 'P' && controls === pointerLockControls) {
                console.log(camera.position.y)
            }
        }
    });

    // Set up button to reset pointerlock target to (0,0,0)
    document.addEventListener('keydown', function(event) {
        if(!paused){
            if (event.key === 'o' && controls === pointerLockControls) {
                // Define the camera's current direction vector and target direction vector

                camera.getWorldDirection(currentCamDirection);
                const targetDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();

                // Use Tween to smoothly transition the camera's direction
                new TWEEN.Tween(currentCamDirection).to(targetDirection, 350).onUpdate(() => {
                camera.lookAt(currentCamDirection);
                }).start();
            }
        }
    });



} // closing init() function

function updateGUIToneMapping( folder ) {

    if ( guiExposure !== null ) {

        guiExposure.destroy();
        guiExposure = null;

    }

    if ( params.ToneMapping !== 'None' ) {

        guiExposure = folder.add( params, 'HDRIexposure', 0, 2 )

            .onChange( function () {

                renderer.toneMappingExposure = params.HDRIexposure;
                render();
                //console.log('batata')

            } );

    }

}

function updateHDRI() {
    //var selectedMap = hdriOptions[params.HDRImap];

    // Update your scene's environment map
    // For example, if using a THREE.Scene with a skybox:
    //scene.background = new THREE.CubeTextureLoader().load(selectedMap);
    //scene.background = new THREE.EquirectangularReflectionMappinglo

    if (hdriOptions[params.HDRImap] == null) {
        scene.environment = null;
        scene.background = null ; 
    } else {

        new RGBELoader()
        .setPath( 'Environment/' )
        .load( hdriOptions[params.HDRImap], function ( texture ) {
    
            texture.mapping = THREE.EquirectangularReflectionMapping;
    
            scene.background = texture;
            scene.environment = texture;
    
            render();
    
        });

    }


}


// Declare animate function
function animate() {
    requestAnimationFrame( animate );

    if (paused) {
        return; // Don't update camera position and rotation
      }


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
    let deltaCar 

    if ( pointerLockControls.enabled && pointerLockControls.isLocked === true ) {


        if (sprint) {
            delta = Math.min(( time - prevTime ) / 700, 0.1);
        } else if (slowwalk) {
            delta = Math.min(( time - prevTime ) / 9000, 0.1); // Slow down movement 
        } 
        else {
            delta = Math.min(( time - prevTime ) / 2500, 0.1); // Normal Movement speed
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
        if ( moveLeft || moveRight ) {
            velocity.x -= direction.x * 400.0 * delta;
            if (camera.position.y < 0.1) {
                camera.position.setY(0.1);
                // orbitalControls.target.setY(0);
            }
        }
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
        if (rollLeft){
            camera.rotateZ(0.02);
            // CameraRoll=CameraRoll+0.02;
            CameraRoll += 0.02;
        }
        if (rollRight){
            camera.rotateZ(-0.02)
            CameraRoll -= 0.02;;
        }
        if (camera.position.y < 0.1 && CameraRoll != 0) {
            camera.position.setY(0.1);
            // orbitalControls.target.setY(0);
        }
        

        pointerLockControls.moveRight( - velocity.x * delta );
        pointerLockControls.moveForward( - velocity.z * delta );
        pointerLockControls.getObject().position.y += ( velocity.y * delta ); // This line updates the vertical position of the camera object based on its current velocity and the time elapsed since the last frame (the delta value).
        
    }

    deltaCar = (time -prevTime)/1000;
    prevTime = time;

    
    // Update the camera's projection matrix
    camera.updateProjectionMatrix();
    // Update the camera height display
    const cameraHeightDiv = document.getElementById('camera-height');
    cameraHeightDiv.textContent = `Camera height: ${camera.position.y.toFixed(2)} m`;
    // Update the camera FOV display
    const cameraFOVDiv = document.getElementById('camera-FOV');
    cameraFOVDiv.textContent = `Camera FOV: ${camera.fov.toFixed(2)} \u00B0`;
    // Update the wheel Accel display
    const WheelAccel = document.getElementById('wheel-accel');
    WheelAccel.textContent = `Wheel Acceleration: ${wheelAcceleration.toFixed(2)} `;
    // Update the wheel speed display
    const WheelSpeed = document.getElementById('wheel-speed');
    WheelSpeed.textContent = `Wheel Speed: ${wheelRotationSpeed.toFixed(2)} `;
    // Update the car velocity display
    const carVelocity = document.getElementById('car-velocity');
    carVelocity.textContent = `Car Velocity: ${carSpeed.toFixed(2)} `;
    // Update the distance travelled display
    const distanceTravelled = document.getElementById('car-distance');
    distanceTravelled.textContent = `Distance Travelled: ${distanceDriven.toFixed(2)} `;

    // Update Orbital Controls
    if ( orbitalControls.enabled ) {
        orbitalControls.update();

    }

    

    if (isdriving)
    {
        // // Update rotation speed based on acceleration
        wheelRotationSpeed += wheelAcceleration;

          // Apply rolling resistance
        if (wheelRotationSpeed > 0) {
            wheelRotationSpeed -= rollingResistance;
            wheelRotationSpeed = Math.max(0, wheelRotationSpeed); // Ensure non-negative speed
        } else if (wheelRotationSpeed < 0) {
            wheelRotationSpeed += rollingResistance;
            wheelRotationSpeed = Math.min(0, wheelRotationSpeed); // Ensure non-positive speed
        }

        // // Apply air resistance
        // wheelRotationSpeed *= (1 - airResistance);
        
        // Clamp rotation speed within the minimum and maximum values
        wheelRotationSpeed = Math.max(minWheelRotationSpeed, Math.min(maxWheelRotationSpeed, wheelRotationSpeed));
        
        // Rotate the wheels
        wheel_FR.rotation.z += wheelRotationSpeed * wheelRotationDirection;
        wheel_FL.rotation.z += wheelRotationSpeed * wheelRotationDirection;
        wheel_RR.rotation.z += wheelRotationSpeed * wheelRotationDirection;
        wheel_RL.rotation.z += wheelRotationSpeed * wheelRotationDirection;

        // Calculate the distance covered by the wheel
        oldCarSpeed = carSpeed;
        carSpeed = wheelRotationSpeed * -wheelRotationDirection * 2 * Math.PI * initialFrontWheelHeight;
        distanceDriven += carSpeed;
        carAccel = (carSpeed - oldCarSpeed)/(deltaCar);

        //console.log(carAccel);
  
        //console.log("Distance covered by the wheel:", distanceDriven);

        // // Bumps on Road
        // const roadBumpDisplacement = roadOndulationAmplitude * Math.sin(2 * Math.PI * roadBumpFrequency * time);
        // wheel_FR.position.y = initialWheelHeight + roadBumpDisplacement;


        x_perlin_flatness += perlinNoiseZeroToOne(0.1)*0.1//Math.random() * 0.1;//0.1;
        //const randomRoadFlatness = Math.random(); // Random value between 0 and 1
        const randomRoadFlatness = perlinNoiseZeroToOne(x_perlin_flatness); // Random value between 0 and 1

        // Example usage:
        // Update x value to change the Perlin noise over time
        //roadOndulationAmplitude = maxroadOndulationAmplitude * (wheelRotationSpeed / maxWheelRotationSpeed) //* (Math.max(0,roadFlatnessFactor-randomRoadFlatness)/roadFlatnessFactor)
        roadOndulationAmplitude = roadOndulationIntensity * maxWheelVerticalTravel * (wheelRotationSpeed / maxWheelRotationSpeed) //* (Math.max(0,roadFlatnessFactor-randomRoadFlatness)/roadFlatnessFactor)
        
        
        // x_perlin_bump += 0.01;
        // x_perlin = perlinNoiseBump(x_perlin_bump, seed_perlin);
        x_perlin += 0.01 * (wheelRotationSpeed / maxWheelRotationSpeed); // frequency of perlin noise , aka oscillation speed
        
        //const perlinNoise = perlinNoiseRoad(x_perlin, seed_perlin);
        const perlinNoise = perlinNoise1D(x_perlin);
        const roadflatten = (Math.max(0,roadFlatnessFactor-randomRoadFlatness)/roadFlatnessFactor);
        //const phase = (Math.sin((wheelRotationSpeed / maxWheelRotationSpeed)*Date.now() *0.01) + 1) / 2;
        //const phase = (Math.sin((wheelRotationSpeed)*(time*0.01)) + 1) / 2;

        

        if(isOnBump){
            distanceDrivenOnBumpFront += carSpeed;
            if(isOnBumpFront){
                bumpPhaseFront = roadBumpHeight*((Math.sin((distanceDrivenOnBumpFront * roadBumpFrequency * Math.min(10,(maxWheelRotationSpeed/wheelRotationSpeed)))-(Math.PI/2)) + 1) / 2);
            }
            
            bumpPhaseRear = roadBumpHeight*((Math.sin(((Math.max(0,distanceDrivenOnBumpFront-2*wheelBase)) * roadBumpFrequency *Math.min(10,(maxWheelRotationSpeed/wheelRotationSpeed)))-(Math.PI/2)) + 1) / 2);

            //console.log('bingo', bumpIsFlattening, bumpPhase)
            
            // if((Math.floor(bumpPhase*100) == 0) && bumpIsFlattening){
            //     isOnBump = false;
            //     distanceDrivenOnBump = 0;
            //     bumpPhase = 0;
            //     console.log('bingoBYEE')
            // }

            if((Math.floor(bumpPhaseFront*1000) == 0) && bumpIsFlatteningFront){
                isOnBumpFront = false;
                //distanceDrivenOnBumpFront = 0;
                bumpPhaseFront = 0;
                //bumpPhaseRear = 0;
                //console.log('MakePhaseZeroFront')
            }

            if (bumpPhaseFront < prevBumpPhaseFront) {
                bumpIsFlatteningFront = true;
                //console.log('bumpIsFlatteningFront is True')
              } else {
                bumpIsFlatteningFront = false;
              }
              prevBumpPhaseFront = bumpPhaseFront; // Update prev to the current value for the next iteration

            if((Math.floor(bumpPhaseRear*1000) == 0) && bumpIsFlatteningRear){
                isOnBumpRear = false;
                isOnBump = false
                distanceDrivenOnBumpFront = 0;
                bumpPhaseRear = 0;
                //console.log('MakePhaseZeroRear')
            }

            if (bumpPhaseRear < prevBumpPhaseRear) {
                bumpIsFlatteningRear = true;
                //console.log('bumpIsFlatteningRear is True')
              } else {
                bumpIsFlatteningRear = false;
              }
              prevBumpPhaseRear = bumpPhaseRear; // Update prev to the current value for the next iteration


              //console.log ('front phase is',bumpPhaseFront,'rear phase is',bumpPhaseRear)
            
        } else {
            bumpPhaseFront = 0;
            bumpPhaseRear = 0;
        }

        const currentNumbOfBumps = Math.floor(distanceDriven / roadBumpCheck);
        
        if (!isOnBump && (currentNumbOfBumps > prevNumbOfBumps) && (distanceDriven > roadBumpCheck) ){
            prevNumbOfBumps = currentNumbOfBumps;
            const randomRoadBumpiness = Math.random(); // Random value between 0 and 1
            if (randomRoadBumpiness < roadBumpinessIntensity){
                isOnBumpFront = true;
                isOnBumpRear = true;
                isOnBump = true ; 
                bumpIsFlatteningFront = false;
                bumpIsFlatteningRear = false;
                distanceDrivenOnBumpFront = 0;
                distanceDrivenOnBumpRear = 0;
                roadBumpHeight = maxWheelVerticalTravel * Math.random();
                roadBumpFrequency = (maxRoadBumpFrequency - minRoadBumpFrequency) * Math.random() + minRoadBumpFrequency;
                //console.log('height is: ',roadBumpHeight,', and frequency is: ',roadBumpFrequency) 
            } else {
                //console.log('noBump')
            }
        }

        

        // if (!isOnBump && (Math.floor(distanceDriven) % roadBumpCheck === 0) && (distanceDriven > roadBumpCheck) ){
        //     const randomRoadBumpiness = Math.random(); // Random value between 0 and 1
        //     console.log('yesOrNoBump', distanceDriven) 
        //     if (randomRoadBumpiness < roadBumpinessIntensity){
        //         // bumpPhase = (Math.sin((distanceDriven * 0.1)-(Math.PI/2)) + 1) / 2;
        //         // console.log('bingo')
        //         isOnBump = true;
        //         bumpIsFlattening = false;
        //         distanceDrivenOnBump = 0;
        //         console.log('yesBump') 
        //     } else {
        //         console.log('noBump')
        //     }
        // }

        

        //const myBumps = Math.sin(phase * (Math.PI/2));

        // let adjustedNoiseValue;
        // if (randomRoadFlatness < roadFlatnessFactor) {
        // // Smoothly transition to the target flatness value
        // adjustedNoiseValue = lerp(1,perlinNoise, targetRoadFlatnessValue); //randomRoadFlatness / roadFlatnessFactor
        // } else {
        // // Keep the original noise value
        // adjustedNoiseValue = perlinNoise;
        // }

        wheel_FR_verticalTravel = Math.min(maxWheelVerticalTravel,(perlinNoise+ bumpPhaseFront))

        
    

        wheel_FR.position.y = initialFrontWheelHeight + wheel_FR_verticalTravel; // Displaces the wheel vertically
        wheel_FL.position.y = initialFrontWheelHeight + maxWheelVerticalTravel; // Displaces the wheel vertically

        wheel_RR.position.y = initialRearWheelHeight + perlinNoise + bumpPhaseRear; // Displaces the wheel vertically
        wheel_RL.position.y = initialRearWheelHeight + perlinNoise; // Displaces the wheel vertically
        ground.position.y = perlinNoise + (bumpPhaseFront+bumpPhaseRear)/2 // Displaces the ground vertically
        floorShadowPlane.position.y = initialShadowPlaneHeight + perlinNoise + (bumpPhaseFront+bumpPhaseRear)/2;
        //body.position.y = initialBodyHeight + (bumpPhaseFront+bumpPhaseRear)/4;
    
        //body.position.y = COG_h + (perlinNoise) // Displaces the ground vertically
        //body.position.y = COG_h + 0.5*(perlinNoise) // Displaces the ground vertically

        // wheel_front.position.y = initialRearWheelHeight + bumpPhase;
        // wheel_rear.position.y = initialRearWheelHeight + bumpPhase;
        
        //console.log(perlinNoise);

        //pitch car body
        bodyPitch = (50*wheelAcceleration*COG_h)/(gravity*wheelBase*(1+pitchStiffness));
        //bodyPitch = (carAccel*COG_h)/(gravity*wheelBase*(1+pitchStiffness));
    
        // if (isOnBumpFront && bumpIsFlatteningFront){
        //     console.log('time to pitch')
        //     bumpPitch = Math.sin(time * 0.001) * 0.1; // Adjust bumpFrequency and bumpAmplitude as needed
        //     bodyPitch += bumpPitch
        // }
        // if (isOnBumpRear && bumpIsFlatteningRear){
        //     bodyPitch -= 0.1
        // }
        const pitchDiff = bodyPitch - body.rotation.z;
        body.rotation.z += pitchDiff * pitchSpeed;
        //lights_rear.rotation.z += pitchDiff * pitchSpeed;
        //glass.rotation.z += pitchDiff * pitchSpeed;

        console.log(bodyPitch)
 
    }

    
    // Update Tween
    TWEEN.update()

    //Render Scene
    render();

    //Update Stats
    stats.update();


}

// Function for WindowResize
function onWindowResize() {

camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();

renderer.setSize( window.innerWidth, window.innerHeight );

// to add bloom, add this 
composer.setSize( window.innerWidth, window.innerHeight );
// to add bloom, add this 
render();

}