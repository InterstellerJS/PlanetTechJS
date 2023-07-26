import * as NODE from 'three/nodes';
import * as THREE   from 'three';
import {QuadTrees}  from './quadtree'
import {norm}       from './utils'
import {light,displacemntNormalV3,displacemntNormalV2} from  './../shaders/glslFunctions'


console.log(NODE)

var snoiseCount = 0 
var fbmCount = 0
var displacementNormalCount= 0 
var patternCount = 0 


  export default class Quad{
    constructor(w,h,ws,hs,d){
      this.quadData  = {
        width:          w,
        height:         h,
        widthSegments:  ws,
        heightSegments: hs,
        dimensions:     d,
       }
       this.children  = []
       this.instances = []
       this.textures  = [] 
       this.quadTreeconfig = new QuadTrees.QuadTreeLoDCore()
       this.count     = 1 
      }
  
    update(player){
      this.quadTree.update(player,this)
    }

    add( q ){
        this.children.push( q )
        this.plane.add(q.plane)
    }


    addTexture(texture_, displacementScale){
      this.textures.push(texture_)
      this.quadTreeconfig.config.dataTransfer[this.side] = {textuers:this.textures}
      var w = this.quadData.width
      var d = this.quadData.dimensions
      var testscaling = w / ( w * d )
      var halfScale   = testscaling / 2
      for (var i = 0; i < this.instances.length; i++) {
        var q = this.instances[i]
        var p = q.plane
        var cnt = this.quadTreeconfig.config.cnt.clone()
        p.worldToLocal(cnt)

  var clampedUVs = NODE.func(`
          vec2 clampedUVs(vec2 uv){
            float scale   = 0.3333333333333333;
            vec2 offset   = vec2(1.0,1.0);
            vec2 uu = vec2(0.5) + (uv - vec2(0.5))/1.0;
            vec2 newUv    = (uu + offset) * scale;
            // Get minimum & maximum limits of UVs
            vec2 min = vec2(offset.x + 0.0, offset.y + 0.0) * scale;
            vec2 max = vec2(offset.x + 1.0, offset.y + 1.0) * scale;
            return clamp(newUv, min, max);
          
          }
          `)
          var uv = clampedUVs.call({uv:NODE.uv()})

          var textureNodeD = NODE.texture(texture_[0],uv)
          var textureNodeN = NODE.texture(texture_[0],uv)  
       


        //textureNode._TexId = `${i}_${this.count}` 
        if(p.material.positionNode){
          //var mouse = p.material.uniforms[`displacementScale_${this.count}`]
          //var ld    = p.material.uniforms[`lightDirection_${this.count}`]
          //const screenFXNode = NODE.uniform( mouse )
          //var ld  = NODE.uniform( ld ).add(NODE.vec3(.0, .0, 0))
          //const displace = textureNode.x.mul(screenFXNode.x).mul(NODE.normalLocal)
          //p.material.colorNode = textureNode //p.material.colorNode.add(lighting(displacedNormal(textureNode,newUV),ld))
          //p.material.positionNode = p.material.positionNode.add( displace );


          //p.material.colorNode = textureNodeN//displacemntTextureV3(texture_,newUV)
          p.material.colorNode = displacemntNormalV2(texture_[0],uv)
          const displace = textureNodeD.x.mul(displacementScale).mul(NODE.positionLocal.sub(cnt).normalize())
          p.material.positionNode =  p.material.positionNode.add( displace );
          
        }else{
          //var mouse = p.material.uniforms[`displacementScale_${this.count}`]
          //var ld    = p.material.uniforms[`lightDirection_${this.count}`]
          //const screenFXNode = NODE.uniform( mouse )
          //var ld  = NODE.uniform( ld ).add(NODE.vec3(.0, .0, 0))
          //const displace = textureNode.x.mul(screenFXNode.x).mul(NODE.normalLocal)
          //p.material.colorNode = textureNode .mul(2.0).sub(1.0)//lighting((displacedNormal(textureNode,newUV)),ld )
          //p.material.positionNode = NODE.positionLocal.add(displace);
          const displace = textureNodeD.r.mul(displacementScale).mul(NODE.normalLocal)
          p.material.colorNode = textureNodeD
          //p.material.positionNode = NODE.positionLocal.add( displace );
        }
        }
        this.count++
      }


    lighting(ld){
      var fn = NODE.func(`
      vec3 light_(vec3 n, vec3 ld ) {
        return light( n,ld);
      }
      `,[light])
      for (var i = 0; i < this.instances.length; i++) {
        var p = this.instances[i].plane
        p.material.colorNode = fn.call({
          n:p.material.colorNode,
          ld:ld,
        })
      }
    }


    createNewMesh(shardedGeometry){
      const width  = shardedGeometry.parameters.width
      const height = shardedGeometry.parameters.height
      const heightSegments = shardedGeometry.parameters.heightSegments
      const widthSegments  = shardedGeometry.parameters.widthSegments
      const material = new NODE.MeshBasicNodeMaterial();
      const quad     = new Quad(width,height,widthSegments,heightSegments)
      quad.plane     = new THREE.Mesh( shardedGeometry, material );
      quad.plane.frustumCulled = false
      return quad
      }

    createQuadTree(lvl){
      Object.assign(this.quadTreeconfig.config,{
        maxLevelSize:  this.quadData.width,
        minLevelSize:  Math.floor(this.quadData.width/Math.pow(2,lvl-1)),
        minPolyCount:  this.quadData.widthSegments,
        dimensions:    this.quadData.dimensions,
        }
      )
      this.quadTreeconfig.levels(lvl)
      this.quadTreeconfig.createArrayBuffers()
      this.quadTree = new QuadTrees.QuadTreeLoD()
    }  

    createDimensions(sideName){
      const w = this.quadData.width
      const d = this.quadData.dimensions
      const shardedGeometry = this.quadTreeconfig.config.arrybuffers[w]
      for (var i = 0; i < d; i++) {
        var i_ = ((i*(w-1))+i)+((-(w/2))*(d-1))
        for (var j = 0; j < d; j++) {
          var j_ = ((j*(w-1))+j)+((-(w/2))*(d-1))
          var q = this.createNewMesh(shardedGeometry).setPosition( [i_,-j_,0], 'dimensions')
          q.quadTree = new QuadTrees.QuadTreeLoD()
          q.side = sideName
          this.instances.push(q)
        }
      }
      this.side = sideName
    }
  

    setPosition( params, quadrent){
      this.plane.updateMatrixWorld(true)
      if       (quadrent=='NW')  {
        this.plane.position.set(-params[0]/2,  params[1]/2, 0)
      }else if (quadrent=='NE') {
        this.plane.position.set( params[0]/2,  params[1]/2, 0)
      }else if (quadrent=='SE') {
        this.plane.position.set( params[0]/2, -params[1]/2, 0)
      }else if (quadrent=='SW') {
        this.plane.position.set(-params[0]/2, -params[1]/2, 0)
      }else if (quadrent=='dimensions') {
        this.plane.position.set(...params)
      }
      return this
    }

    active(a){
      if (a == true){
        this._active = a
        this.plane.material.visible = a;
          if(this.children.length != 0){
            this.children[0].plane.material.visible = !a
            this.children[1].plane.material.visible = !a
            this.children[2].plane.material.visible = !a
            this.children[3].plane.material.visible = !a
          }
        }else if (a == false) {
          this._active = a
          this.plane.material.visible = a;
        }
      }
  
  }
  
  /*
  
var cbt = new CubeTexture()
var t = cbt.get(this.rend)
console.log(t)

this. q = new Quad(50,50,250,250,2)
this. q.createQuadTree(2)
this. q.createDimensions()
this. q.addTexture  (t[0])
this. q.lighting    (NODE.vec3(0,0,0))
this.rend.scene.add( ...this. q.instances.map(x=>x.plane) );

  if(this.q){
    this.controls.update(this.clock.getDelta())
    for (var i = 0; i < this.q.instances.length; i++) {
      this.q.instances[i].update(this.player)
    }
}

  */