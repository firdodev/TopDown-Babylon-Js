import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON  from "@babylonjs/core";

import "recast-detour";



export class MainGame{

    private playerMesh;
    constructor(scene:BABYLON.Scene){
        
        this.enableRecastJSPlugin();
        
        let navigationPlugin = new BABYLON.RecastJSPlugin();
        navigationPlugin.setWorkerURL("workers/navMeshWorker.js");

        var parameters = {
            cs: 0.2,
            ch: 0.2,
            walkableSlopeAngle: 35,
            walkableHeight: 1,
            walkableClimb: 1,
            walkableRadius: 1,
            maxEdgeLen: 12,
            maxSimplificationError: 1.3,
            minRegionArea: 8,
            mergeRegionArea: 20,
            maxVertsPerPoly: 6,
            detailSampleDist: 6,
            detailSampleMaxError: 1,
        }; 
    
        this.playerMesh = BABYLON.MeshBuilder.CreateBox("player",{size: 1,height:1}); 
        let groundMesh = BABYLON.Mesh.CreateGround("ground", 6,6,2, scene);
        navigationPlugin.createNavMesh([groundMesh], parameters);
    
        let navmeshdebug = navigationPlugin.createDebugNavMesh(scene);
        var matdebug = new BABYLON.StandardMaterial("matdebug", scene);
        matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;
    }

    async enableRecastJSPlugin(){
        const recast = await Recast();
    }
}


