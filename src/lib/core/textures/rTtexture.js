import * as THREE from 'three';



export class RtTexture {
  constructor(resoultion=512) {
    this.rtWidth  = resoultion;
    this.rtHeight = resoultion;
  }

 initRenderTraget(){
    this. rtScene       = new THREE.Scene();
    this. rtScene.background  = new THREE.Color('pink');
    this. rtCamera      = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this. renderTarget  = new THREE.WebGLRenderTarget(this.rtWidth, this.rtHeight);
  }

  getTexture(){
    return this.renderTarget.texture
  }


  snapShot(rend){
    rend.renderer.setRenderTarget(this.renderTarget);
    rend.renderer.clear();
    rend.renderer.render(this.rtScene, this.rtCamera);
    rend.renderer.setRenderTarget(null);
  }

  getPixels(rend){
    var pixels = new Uint8Array(this.rtWidth * this.rtHeight * 4);
    rend.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.rtWidth, this.rtHeight, pixels);
    return pixels
  }

  toImage(pixels){
    // Create a canvas element
    var canvas    = document.createElement('canvas');
    canvas.width  = this.rtWidth;
    canvas.height = this.rtHeight;
    // Get the pixel data from the render target and put it on the canvas
    var context   = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    canvas.style.imageRendering = "crisp-edges";
    canvas.style.imageRendering = "-moz-crisp-edges";
    canvas.style.imageRendering = "pixelated";
    canvas.style.imageRendering = "-webkit-crisp-edges";

    var imageData = context.createImageData(this.rtWidth, this.rtHeight);
    imageData.data.set(pixels);
    // Flip the image vertically
    var tmpCanvas    = document.createElement('canvas');
    tmpCanvas.width  = this.rtWidth;
    tmpCanvas.height = this.rtHeight;
    tmpCanvas.imageSmoothingEnabled = false;

    tmpCanvas.style.imageRendering = "crisp-edges";
    tmpCanvas.style.imageRendering = "-moz-crisp-edges";
    tmpCanvas.style.imageRendering = "pixelated";
    tmpCanvas.style.imageRendering = "-webkit-crisp-edges";

    var tmpContext   = tmpCanvas.getContext('2d');


    tmpContext.putImageData(imageData, 0, 0);
    context.translate(0, this.rtHeight);
    context.scale(1, -1);
    context.drawImage(tmpCanvas, 0, 0);
    return canvas
  }



  download(canvas,c=0){
    // Download the canvas as an image
    var downloadLink = document.createElement('a');
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = `${c}_image.png`;
    downloadLink.click();
  }

  downloadImages(instances,rend){
    this.initRenderTraget()
    for (let index = 0; index < instances.length; index++) {
      let element = instances[index];
      this.add(element)
      this.snapShot(rend)
      this.download(this.toImage(this.getPixels(rend)),index)
    }
  }

}


