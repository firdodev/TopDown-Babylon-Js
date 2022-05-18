import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";

export class Player{

    private player;
    private playerCreated: boolean = false;

    public async createPlayer(scene: BABYLON.Scene){
        this.player = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "Adventurer.glb");
        this.playerCreated = true;
    }

    public getPlayerMesh(meshindex: number){
        if(this.playerCreated){
            return this.player.meshes[meshindex];
        }else{
            console.log("Player not created");
        }
    }
}