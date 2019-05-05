var stats;
let clock;
let scene, camera, webGLRenderer, controls;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let objects = {
    children: []
};
let camTarget, ground, circle;
let movingTarget, moveTime, moveSpeed;
let currentObject;
let downPoint = new THREE.Vector3(0, 0, 0)
let upPoint;
let manager = new THREE.LoadingManager();
let startTime;
let scaleset = 10;
let mobileModelPath = 'assets/models/gltf/interior2-test/scene.gltf'
let desktopModelPath = 'assets/models/gltf/interior2/scene.gltf'
init();
animate();


function init() {
    stats = initStats();
    
    webGLRenderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
    });
    webGLRenderer.shadowMap.enabled = true;
    document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);

    webGLRenderer.setClearColor(new THREE.Color(0xCCCCCC));
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    webGLRenderer.setPixelRatio(window.devicePixelRatio);


    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(-12, 14, -12);
    scene.add(camera);

    clock = new THREE.Clock();

    controls = new THREE.OrbitControls(camera, webGLRenderer.domElement);
    controls.target = new THREE.Vector3(0, 10, 0);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 0;
    controls.maxDistance = 5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotation = 0.3;
    controls.addEventListener('start', () => {
        if (movingTarget) {
            movingTarget.stop();
        }
    });
    //controls.addEventListener('change', render);

    let targetMat = new THREE.MeshBasicMaterial({color: '#ff0000'});
    let targetGeo = new THREE.BoxGeometry(0.01, 14, 0.01);
    camTarget = new THREE.Mesh(targetGeo, targetMat);
    camTarget.position.set(-12, 14, -12);
    camTarget.visible = false;
    scene.add(camTarget);

    addPointer();
    addLights();
    configLoadingManager();
    if (isMobile()) {
        //loadGLTF(desktopModelPath);
        loadGLTF(mobileModelPath);
    } else {
        //loadGLTF(mobileModelPath);
        loadGLTF(desktopModelPath);
        console.log(navigator.userAgent);
    }
    //loadGLTF('assets/models/gltf/interior2/scene.glb');
    //loadDRACO('assets/models/gltf/interior2/scene-draco.glb');
    //addGround();
    //addObjs();
    
    createSkyBox('assets/skybox/');

    window.addEventListener('mouseup', onClick, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchend', onTouchEnd, false);

}

function addLights() {
    let ambientLight = new THREE.AmbientLight(0xffffff);
    let directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(-30, 50, -100);
    directionalLight.intensity = 1;
    //directionalLight.castShadow = true;

    directionalLight.shadow.camera.near = 0;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(ambientLight);
    scene.add(directionalLight);
    //var debug = new THREE.CameraHelper(directionalLight.shadow.camera);
    //debug.name = "debug";
    //scene.add(debug);
}

function addGround() {
    ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(500, 500, 1, 1), new THREE.MeshBasicMaterial({
        color: 0xfff000,
        side: THREE.FrontSide
    }));
    ground.position.set(0, 0.1, 0);
    ground.name = 'ground';
    ground.material.transparent = true;
    ground.material.opacity = 0;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    objects.children.push(ground)
}

function addPointer() {
    let circleMat = new THREE.MeshBasicMaterial({
        color: '#eeeeee'
    });
    let circleGeo = new THREE.CircleGeometry(1.5, 20);
    circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(10000, 10000, 10000);
    circle.material.transparent = true;
    circle.material.opacity = 0.5;
    scene.add(circle);
    
}


function getMousePosition(event) {
    let x, y;
    if (event.changedTouches) {
        x = event.changedTouches[0].pageX;
        y = event.changedTouches[0].pageY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    getMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    if (objects.children.length > 0) {
        let intersects = raycaster.intersectObjects(objects.children);
        if (intersects.length > 0) {
            currentObject = intersects[0].object;
            console.log(intersects[0].point);
            console.log(currentObject.id + currentObject.name);
            upPoint = intersects[0].point || new THREE.Vector3(0, 0, 0);
            let bool = (upPoint.x == downPoint.x && upPoint.y == downPoint.y && upPoint.z == downPoint.z) && (currentObject.name == 'SM_floor_trim_0' || currentObject.name == 'SM_carpet_0');
            if (bool) {
                let distance = Math.sqrt(Math.pow(camTarget.position.x - intersects[0].point.x, 2) + Math.pow(camTarget.position.z - intersects[0].point.z, 2));
                if (distance > moveSpeed) {
                    let i = distance / moveSpeed;
                    moveTime = i * 1000;
                } else {
                    moveTime = 1000;
                }
                movingTarget = new TWEEN.Tween(camTarget.position);
                movingTarget.to(new THREE.Vector3(intersects[0].point.x, camTarget.position.y, intersects[0].point.z), moveTime);
                movingTarget.start();
                //console.log(camTarget.position);
                //console.log(controls.target);
            }
        }
    }
}

function onMouseMove(event) {
    getMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    if (objects.children.length > 0) {
        let intersects = raycaster.intersectObjects(objects.children);
        if (intersects.length > 0) {
            if (intersects[0].object.name == 'SM_floor_trim_0' || intersects[0].object.name == 'SM_carpet_trim_0') {
                let ip = intersects[0].point;
                let np = new THREE.Vector3(ip.x, ip.y + 0.1, ip.z);
                circle.position.copy(np);
            } else {
                //$('#HUD').text(intersects[0].object.name);
                HUD(intersects[0]);
            }
        }
    }
}

function onMouseDown(event) {
    getMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    if (objects.children.length > 0) {
        let intersects = raycaster.intersectObjects(objects.children);
        if (intersects.length > 0) {
            downPoint = intersects[0].point || new Vector3(0, 0, 0);
        }
    }
}

function onTouchStart(event) {
    getMousePosition(event);
    // console.log("touch start");
    raycaster.setFromCamera(mouse, camera);
    if (objects.children.length > 0) {
        let intersects = raycaster.intersectObjects(objects.children);
        if (intersects.length > 0) {
            downPoint = intersects[0].point || new Vector3(0, 0, 0);
        }
    }
}

function onTouchEnd(event) {
    getMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    if (objects.children.length > 0) {
        let intersects = raycaster.intersectObjects(objects.children);
        if (intersects.length > 0) {
            currentObject = intersects[0].object;
            console.log(intersects[0].point);
            console.log(currentObject.id + currentObject.name);
            upPoint = intersects[0].point || new THREE.Vector3(0, 0, 0);
            let isSamePoint = (upPoint.x == downPoint.x && upPoint.y == downPoint.y && upPoint.z == downPoint.z);
            let isFloor = (currentObject.name == 'SM_floor_trim_0' || currentObject.name == 'SM_carpet_0');
            if (isSamePoint && isFloor) {
                let distance = Math.sqrt(Math.pow(camTarget.position.x - intersects[0].point.x, 2) + Math.pow(camTarget.position.z - intersects[0].point.z, 2));
                if (distance > moveSpeed) {
                    let i = distance / moveSpeed;
                    moveTime = i * 1000;
                } else {
                    moveTime = 1000;
                }
                movingTarget = new TWEEN.Tween(camTarget.position);
                movingTarget.to(new THREE.Vector3(intersects[0].point.x, camTarget.position.y, intersects[0].point.z), moveTime);
                movingTarget.start();
            } else if (isSamePoint && !isFloor) {
                $('#HUD').css('visibility', 'visible');
                HUD(intersects[0]);
            } else {
                $('#HUD').css('visibility', 'hidden');
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    webGLRenderer.setSize(window.innerWidth, window.innerHeight)
}

function createSkyBox(path) {
    let sides = [path + 'posx.jpg', path + 'negx.jpg', path + 'posy.jpg', path + 'negy.jpg', path + 'posz.jpg', path + 'negz.jpg'];
    let skyCube = new THREE.CubeTextureLoader().load(sides);
    skyCube.format = THREE.RGBFormat;
    scene.background = skyCube;
}

function HUD(e) {
    let objId = e.object.name;
    let position = worldToScreen(e.point);
    $('#HUD').text(objId);
    $('#HUD').css('padding', 0);
    $('#HUD').css({'left': `${position.x}px`, 'top': `${position.y - 35}px`, 'padding': '5px 15px'});
}

function worldToScreen(position) {
    let worldVector = position;
    let vector = worldVector.project(camera);
    let halfWidth = window.innerWidth / 2;
    let halfHeight = window.innerHeight / 2;
    let result = {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight)
    };
    return result;
}

function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}

function render() {
    TWEEN.update()
    controls.target.copy(camTarget.position).add(new THREE.Vector3(0, 1, 0))
    controls.update(clock.getDelta())
    webGLRenderer.clear()
    webGLRenderer.render(scene, camera)
}

function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}

function loadGLTF(path) {
    var count = 0;
    let loader = new THREE.GLTFLoader(manager);
    loader.load(path, (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                // count += 1;
                // child.material.transparent = true;
                // console.log(child.material);
                //child.receiveShadow = true;
                //child.castShadow = true;
                //child.material.lights = true;
                objects.children.push(child);
                // console.log(count);
            }
        });
        gltf.scene.scale.set(scaleset, scaleset, scaleset);
        //setContent(gltf.scene);
        scene.add(gltf.scene);
    });
}

function loadDRACO(path) {
    var count = 0;
    let loader = new THREE.GLTFLoader(manager);

    THREE.DRACOLoader.setDecoderPath( './libs/draco/' );
    loader.setDRACOLoader( new THREE.DRACOLoader() );
    loader.load(path, (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
            
                objects.children.push(child);
                console.log(count);
            }
        });
        gltf.scene.scale.set(scaleset, scaleset, scaleset);
        scene.add(gltf.scene);
    });
}

function configLoadingManager() {
    manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
        if (itemsLoaded == 0) {
            startTime = new Date();
        }
        console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    manager.onLoad = function ( ) {
        let elapsedTime = (new Date()) - startTime;
        console.log( 'Loading complete! Elapsed Time: ' + elapsedTime + 'ms');
    };

    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        let elapsedTime = (new Date()) - startTime;
        console.log( 'Elapsed Time: ' + elapsedTime + 'ms');
        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    manager.onError = function ( url ) {
        console.log( 'There was an error loading ' + url );
    };
}

function setContent(object) {
    object.updateMatrixWorld();
    let box = new THREE.Box3().setFromObject(object);
    let size = box.getSize(new THREE.Vector3()).length();
    let center = box.getCenter(new THREE.Vector3());

    controls.reset();
    object.position.x += (object.position.x - center.x);
    object.position.y += (object.position.y - center.y);
    object.position.z += (object.position.z - center.z);
    controls.maxDistance = size * 10;
    camera.near = size / 100;
    camera.far = size * 100;
    camera.updateProjectionMatrix();

    camera.position.copy(center);
    console.log("size: " + size);
    console.log("center: " + camera.position.x + ", "  + camera.position.y + ", "  + camera.position.z);
    console.log("position: " + object.position.x + ", "  + object.position.y + ", "  + object.position.z);
    camera.position.x += size / 2.0;
    camera.position.y += size / 5.0;
    camera.position.z += size / 2.0;
    camera.lookAt(center);
    controls.saveState();
}

function isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|webOS|Windows Phone|SymbianOS|IEMobile|Opera Mini/i.test(navigator.userAgent);
}