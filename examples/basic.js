import * as THREE from "https://esm.sh/three";
import * as NODE from "https://esm.sh/three/nodes";
import * as PlanetTech from "https://esm.sh/planettech";

function init(){
    const params = {
        width:            10000,
        height:           10000,
        widthSegment:      50,
        heightSegment:     50,
        quadTreeDimensions: 2,
        levels:             1,
        radius:          80000,
        displacmentScale:  165.,
        lodDistanceOffset:   6,
        material: new NODE.MeshPhysicalNodeMaterial({}),
        color: () => NODE.vec3(1,0,0),
      }
      
      let s = new PlanetTech.Sphere(
        params.width,
        params.height,
        params.widthSegment,
        params.heightSegment,
        params.quadTreeDimensions
      )
      
      s.build(
        params.levels,
        params.radius,
        params.displacmentScale,
        params.lodDistanceOffset,
        params.material,
        params.color,
      )
      console.log(s)
}

init()