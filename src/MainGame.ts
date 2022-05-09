import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON  from "@babylonjs/core";

import "recast-detour";



export class MainGame{

    private playerMesh: any;
    

    constructor(scene:BABYLON.Scene){
        //Create Navigation Mesh in BabylonJs
        this.createNavigationMesh(scene);
        //Create Player
        this.createPlayer(scene);

    }

    private createNavigationMesh(scene:BABYLON.Scene){
        //Create Navigation Mesh
        let navigationMesh = BABYLON.MeshBuilder.CreateBox("navMesh", {size: 100}, scene);
        navigationMesh.isVisible = false;
        let navigationMeshRecast = new BABYLON.RecastJSPlugin();
    }

    private createPlayer(scene:BABYLON.Scene){
        //Create Player
        this.playerMesh = BABYLON.MeshBuilder.CreateBox("player", {size: 1}, scene);
        this.playerMesh.position.y = 1;
        this.playerMesh.position.z = -10;
        this.playerMesh.position.x = -10;
        this.playerMesh.isVisible = false;
        let playerRecast = new BABYLON.RecastJSPlugin();
    }


    async enableRecast(){
        const recast = await Recast();
    }
}


