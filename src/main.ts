var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() { return new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
var agents = [];

var player;



var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    let navigationPlugin = new BABYLON.RecastJSPlugin();
    navigationPlugin.setWorkerURL("./src/workers/navMeshWorker.js");

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(-6, 4, -8), scene);
    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // This attaches the camera to the canvas
    // camera.attachControl(canvas, true);
    camera.detachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var staticMesh = createStaticMesh(scene);
    var navmeshParameters = {
        cs: 0.2,
        ch: 0.2,
        walkableSlopeAngle: 90,
        walkableHeight: 1.0,
        walkableClimb: 1,
        walkableRadius: 1,
        maxEdgeLen: 12.,
        maxSimplificationError: 1.3,
        minRegionArea: 8,
        mergeRegionArea: 20,
        maxVertsPerPoly: 6,
        detailSampleDist: 6,
        detailSampleMaxError: 1,
        };

    navigationPlugin.createNavMesh([staticMesh], navmeshParameters, async (navmeshData) =>
    {
        console.log("got worker data", navmeshData);
        navigationPlugin.buildFromNavmeshData(navmeshData);
        var navmeshdebug = navigationPlugin.createDebugNavMesh(scene);
        navmeshdebug.position = new BABYLON.Vector3(0, 0.01, 0);

        var matdebug = new BABYLON.StandardMaterial('matdebug', scene);
        matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;
        
        // crowd
        var crowd = navigationPlugin.createCrowd(10, 0.1, scene);
        var i;
        var agentParams = {
            radius: 0.1,
            height: 0.2,
            maxAcceleration: 4.0,
            maxSpeed: 1.0,
            collisionQueryRange: 0.5,
            pathOptimizationRange: 0.0,
            separationWeight: 1.0
        };
            
        for (i = 0; i <1; i++) {
            var width = 0.20;
            //player
            player  = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "Adventurer.glb", scene, (meshes)=>{
                // console.log(meshes);
                // meshes[0].position = new BABYLON.Vector3(0, 0.5, 0);
            });
            // player = BABYLON.MeshBuilder.CreateBox("player", {size: 0.2, height: 0.2}, scene);

            var targetCube = BABYLON.MeshBuilder.CreateBox("cube", { size: 0.1, height: 0.1 }, scene);
            var matAgent = new BABYLON.StandardMaterial('mat2', scene);
            var variation = Math.random();
            matAgent.diffuseColor = new BABYLON.Color3(0.4 + variation * 0.6, 0.3, 1.0 - variation * 0.3);
            // agentCube.material = matAgent;
            var randomPos = navigationPlugin.getRandomPointAround(new BABYLON.Vector3(-2.0, 0.1, -1.8), 0.5);
            var transform = new BABYLON.TransformNode("transform");
            // player.meshes[0].parent = transform;
            var agentIndex = crowd.addAgent(randomPos, agentParams, transform);
            agents.push({idx:agentIndex, trf:transform, mesh: player.meshes[0], target:targetCube});
        }
        
        var startingPoint;
        var currentMesh;
        var pathLine;
        var getGroundPosition = function () {
            var pickinfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickinfo.hit) {
                return pickinfo.pickedPoint;
            }

            return null;
        }

        var pointerDown = function (mesh) {
                currentMesh = mesh[0];
                startingPoint = getGroundPosition();
                if (startingPoint) { // we need to disconnect camera from canvas
                    setTimeout(function () {
                        // camera.detachControl(this.canvas);
                    }, 0);
                    var agents = crowd.getAgents();
                    var i;
                    for (i=0;i<agents.length;i++) {
                        var randomPos = navigationPlugin.getRandomPointAround(startingPoint, 1.0);
                        crowd.agentGoto(agents[i], navigationPlugin.getClosestPoint(startingPoint));
                    }
                    var pathPoints = navigationPlugin.computePath(crowd.getAgentPosition(agents[0]), navigationPlugin.getClosestPoint(startingPoint));
                    pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", {points: pathPoints, updatable: true, instance: pathLine}, scene);
                }
        }
        
        scene.onPointerObservable.add((pointerInfo) => {      		
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if(pointerInfo.pickInfo.hit) {
                        pointerDown(pointerInfo.pickInfo.pickedMesh)
                    }
                break;
            }
        });

        scene.onBeforeRenderObservable.add(()=> {
            var agentCount = agents.length;
            for(let i = 0;i<agentCount;i++)
            {
                var ag = agents[i];
                ag.mesh.position = crowd.getAgentPosition(ag.idx);
                // ag.mesh.rotation = new BABYLON.Vector3(0, -2 , 0);  
                let vel = crowd.getAgentVelocity(ag.idx);
                crowd.getAgentNextTargetPathToRef(ag.idx, ag.target.position);
                if (vel.length() > 0.2)
                {
                    vel.normalize();
                    var desiredRotation = Math.atan2(vel.x, vel.z);
                    ag.mesh.rotation = new BABYLON.Vector3(0, ag.mesh.rotation.y - (desiredRotation + ag.mesh.rotation.y) * 0.05, 0);
                    // console.log("Mesh Rotation ====== ", player.meshes[0].rotation );
                }
            }
        });
    }); // worker
    return scene;
};

function createStaticMesh(scene) {
    var ground = BABYLON.Mesh.CreateGround("ground1", 20, 20, 2, scene);

    var mat1 = new BABYLON.StandardMaterial('mat1', scene);
    mat1.diffuseColor = new BABYLON.Color3(1, 1, 1);

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", {diameter: 2, segments: 16}, scene);
    sphere.material = mat1;
    sphere.position.y = 1;

    var cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 1, height: 3 }, scene);
    cube.position = new BABYLON.Vector3(1, 1.5, 0);
    //cube.material = mat2;


    // Materials
    var mat1 = new BABYLON.StandardMaterial('mat1', scene);
    mat1.diffuseColor = new BABYLON.Color3(1, 1, 1);
    //cube.material = mat2;

    var mesh = BABYLON.Mesh.MergeMeshes([ sphere, cube, ground]);
    return mesh;
}

var initFunction = async function() {


    await Recast();
    // console.log("Recast .......... ",Recast);
    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();
        } catch(e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
};

initFunction().then(() => {sceneToRender = scene                    
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
