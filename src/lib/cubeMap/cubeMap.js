
import * as THREE  from 'three'
import * as NODE   from 'three/nodes';
import Quad        from './../PlanetTech/engine/quad';
import {RtTexture} from './rTtexture'
import { displayCanvasesInGrid } from './utils';
//import {snoise,normals, sdfbm2,} from '../../shaders/analyticalNormals';
import * as Shaders  from  './../PlanetTech/shaders/index.js'



let calculateNormal  = NODE.glslFn(
  `
   vec3 calculateNormal(vec3 position, float epsilon_){
    float scale    = 1.9;   
    float epsilon  = epsilon_;  
    float strength = 1.;                   
    float center = snoise3D(position); // Sample displacement map
    float dx     = snoise3D(position + vec3(epsilon, 0.0, 0.0)) - center; 
    float dy     = snoise3D(position + vec3(0.0, 0.0, epsilon)) - center; 
    vec3 normalMap = normalize(vec3(dx * scale, dy * scale, 1.0));              
    normalMap *= strength;                                                       
    return vec3(normalMap * 0.5 + 0.5);                                     
  }
`,[Shaders.snoise3D]
)



export class CubeMap{
    constructor(wxh,d,mapType=false){
        this.w  = wxh
        this.h  = wxh
        this.ws = 1
        this.hs = 1
        this.d  = d
        this.textuerArray = []
        this.mapType = mapType
       }
    
    centerPosition(c) {
        var bbox  = new THREE.Box3();
        bbox.expandByObject(c);
        var center = new THREE.Vector3();
        bbox.getCenter(center);
        return center
      }
    

    buildRttMesh(size){
        const geometry = new THREE.PlaneGeometry(size,size,1,1);
        const material = new NODE.MeshBasicNodeMaterial();
        const plane    = new THREE.Mesh( geometry, material );
        return plane
      }

    simplexNoise(params){
        let p = this.cube
        var newPostion = NODE.positionLocal
        p.material.colorNode =calculateNormal({position:newPostion.mul(params.scale),epsilon_:1.})
    }


    buildCube(){
        const geometry = new THREE.IcosahedronGeometry(1, 250);
        const material = new NODE.MeshBasicNodeMaterial({side: THREE.DoubleSide});
        const mesh = new THREE.Mesh( geometry, material );
        return mesh            
    }


    build(resoultion=512,renderer){
        this.cube  = this.buildCube()
        let cubeRT = new THREE.WebGLCubeRenderTarget( resoultion, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
        let camera = new THREE.CubeCamera( .0001, 100000,cubeRT);
        this.rtt   = new RtTexture(resoultion,renderer)
        this.rtt.initRenderTraget()
        this.rtt.renderTarget = cubeRT
        this.rtt.rtCamera = camera
        this.rtt.rtScene.add(this.cube)
        }
      

    snapShotFrontC(download=false){
        this.rtt.rtCamera.update(this.rtt.renderer_,this.rtt.rtScene)
        let fpixels = this.rtt.getSpherePixels(2)
        let fcanvas = this.rtt.toImage(fpixels)
        var ctx    = fcanvas.getContext('2d');


        var scaleH =  -1 
        var scaleV =  1 

        var posX =  this.rtt.rtWidth * -1  // Set x position to -100% if flip horizontal 
        var posY =  0; // Set y position to -100% if flip vertical

        ctx.save(); // Save the current state
        ctx.scale(scaleH, scaleV); // Set scale to flip the image
        ctx.drawImage(fcanvas, posX, posY, this.rtt.rtWidth, this.rtt.rtWidth); // draw the image
        ctx.restore(); // Restore the last saved state


        var scaleH =  -1 
        var scaleV =  -1 

        var posX =  this.rtt.rtWidth * -1  // Set x position to -100% if flip horizontal 
        var posY =  this.rtt.rtWidth * -1; // Set y position to -100% if flip vertical

        ctx.save(); // Save the current state
        ctx.scale(scaleH, scaleV); // Set scale to flip the image
        ctx.drawImage(fcanvas, posX, posY, this.rtt.rtWidth, this.rtt.rtWidth); // draw the image
        ctx.restore(); // Restore the last saved state


        this.rtt.download(fcanvas,`nt`)
    }

}