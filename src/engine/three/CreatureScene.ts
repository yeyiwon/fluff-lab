import * as THREE from 'three';
import type {Appearance} from '../appearance';
import {bodyPoint,makeBody,makeFur} from './groom';

const coatColors:Record<Appearance['tone'],string>={cream:'#f1dfc8',white:'#f5f3ee',charcoal:'#4d4b53',gray:'#a2a0ab',lavender:'#c9bbdf',pink:'#efbdcc'};
function disposeTree(group:THREE.Object3D){group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}});group.clear()}
export class CreatureScene {
 readonly renderer:THREE.WebGLRenderer;
 readonly scene=new THREE.Scene();
 readonly camera=new THREE.PerspectiveCamera(34,1,.1,30);
 readonly creature=new THREE.Group();
 private coat=new THREE.Group();
 private face=new THREE.Group();
 private accessory=new THREE.Group();
 private eyes:THREE.Mesh[]=[];
 private bodyMaterial=new THREE.MeshStandardMaterial({roughness:.96});
 private furMaterial=new THREE.MeshStandardMaterial({roughness:.91,metalness:0,vertexColors:true,side:THREE.DoubleSide});
 private furTime={value:0};
 private furMotion={value:1};
 private ground:THREE.Mesh;
 private appearance:Appearance;
 private elapsed=0;
 private squash=1;
 private squashVelocity=0;
 private x=0;private y=0;private vx=0;private vy=0;
 private targetX=0;private targetY=0;private held=false;private dragged=false;
 private shiver=0;private blinkUntil=0;
 private eyeLook=new THREE.Vector2();
 private lost=false;
 private disposed=false;
 reduced=false;
 readonly raycaster=new THREE.Raycaster();
 readonly hitBody:THREE.Mesh;
 constructor(readonly canvas:HTMLCanvasElement,a:Appearance,readonly preview=false){
  this.appearance={...a};
  // Hair ribbons are double sided, but their optical normal follows the groom
  // surface; flipping it per triangle creates artificial black/white pinstripes.
  this.furMaterial.onBeforeCompile=shader=>{shader.uniforms.furTime=this.furTime;shader.uniforms.furMotion=this.furMotion;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float furTime;\nuniform float furMotion;\nattribute float groomTip;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(furTime * 1.8 + position.y * 9.0 + position.x * 3.0) * 0.007 * groomTip * groomTip * furMotion;');shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));};
  this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,preview?1.25:1.75));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.renderer.setClearColor(0x000000,0);
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.camera.position.set(0,.22,5.8);this.camera.lookAt(0,-.06,0);
  this.scene.add(new THREE.HemisphereLight('#e6ddf7','#554955',1.7));
  const key=new THREE.DirectionalLight('#fff0db',3.0);key.position.set(-3,4,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.normalBias=.035;key.shadow.radius=4;this.scene.add(key);
  const fill=new THREE.DirectionalLight('#c8bdff',1.3);fill.position.set(3,1,2);this.scene.add(fill);
  const rim=new THREE.DirectionalLight('#f8e6ff',3.1);rim.position.set(1.3,2,-2);this.scene.add(rim);
  const low=new THREE.DirectionalLight('#e3d2be',.35);low.position.set(-1,-2,3);this.scene.add(low);
  this.ground=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.ShadowMaterial({opacity:.16}));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-1.04;this.ground.receiveShadow=true;this.scene.add(this.ground);
  this.creature.add(this.coat,this.face,this.accessory);this.scene.add(this.creature);
  this.hitBody=new THREE.Mesh(makeBody(a.body),new THREE.MeshBasicMaterial({visible:false}));this.creature.add(this.hitBody);
  this.buildCoat();this.buildEyes();this.buildAccessory();this.setTone(a.tone);
 }
 resize(size:number){this.renderer.setSize(size,size,false);this.camera.aspect=1;this.camera.updateProjectionMatrix()}
 private buildCoat(){
  // Materials are shared by coat meshes; dispose geometry only on regeneration.
  this.coat.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});this.coat.clear();
  this.hitBody.geometry.dispose();this.hitBody.geometry=makeBody(this.appearance.body);
  const body=new THREE.Mesh(makeBody(this.appearance.body),this.bodyMaterial);body.castShadow=true;this.coat.add(body);
  const fur=new THREE.Mesh(makeFur(this.appearance,this.preview?8000:24000),this.furMaterial);fur.name='fur';this.coat.add(fur);
  const limbRadius=.115;
  for(const side of [-1,1]){
   const foot=new THREE.Mesh(new THREE.SphereGeometry(limbRadius,24,16),this.bodyMaterial);foot.scale.set(1,.7,1.25);foot.position.set(side*.34,-.89,.60);this.coat.add(foot);
   const hair=new THREE.Mesh(makeFur({...this.appearance,fur:'short',seed:this.appearance.seed+side+4},this.preview?300:750,(x,y,z)=>new THREE.Vector3(x*limbRadius,y*limbRadius*.7,z*limbRadius*1.25),false),this.furMaterial);hair.position.copy(foot.position);this.coat.add(hair);
   const arm=new THREE.Mesh(new THREE.SphereGeometry(.12,20,14),this.bodyMaterial);arm.scale.set(.68,1.6,.8);arm.position.set(side*.94,-.4,.08);arm.rotation.z=side*-.35;this.coat.add(arm);
   const armFur=new THREE.Mesh(makeFur({...this.appearance,fur:'short',seed:this.appearance.seed+side+9},this.preview?300:800,(x,y,z)=>new THREE.Vector3(x*.082,y*.19,z*.096),false),this.furMaterial);armFur.position.copy(arm.position);armFur.rotation.copy(arm.rotation);this.coat.add(armFur);
  }
  // A small swept crown tuft, made of fibers rather than a solid antenna.
  const tuftMaterial=this.furMaterial;
  const tuft=new THREE.Mesh(makeFur({...this.appearance,fur:'soft',seed:this.appearance.seed+11},this.preview?100:350,(x,y,z)=>new THREE.Vector3(x*.075-.05,y*.04+.86,z*.05),false),tuftMaterial);tuft.scale.set(.7,.7,.7);tuft.position.y=.25;this.coat.add(tuft);
 }
 private buildEyes(){
  disposeTree(this.face);this.eyes=[];
  for(const side of [-1,1]){
   const material=new THREE.MeshPhysicalMaterial({color:'#121014',roughness:.3,metalness:0,clearcoat:.35});
   const eye=new THREE.Mesh(new THREE.SphereGeometry(.046,24,20),material);
   const surface=bodyPoint(this.appearance.body,side*.27,.02,Math.sqrt(1-.27*.27-.02*.02));
   eye.position.set(side*.27,.02+(this.appearance.eye==='derpy'&&side===1?-.035:0),surface.z+.025);eye.scale.set(.82,this.appearance.eye==='round'?1:1.12,.6);
   this.eyes.push(eye);this.face.add(eye);
  }
 }
 private buildAccessory(){
  disposeTree(this.accessory);const type=this.appearance.detail;if(type==='none')return;
  const material=new THREE.MeshStandardMaterial({color:type==='star'?'#d4e89f':'#b9a4d6',roughness:.35,metalness:.12});
  let mesh:THREE.Mesh;
  if(type==='star'){
   const shape=new THREE.Shape();for(let i=0;i<10;i++){const t=i*Math.PI/5+Math.PI/2,r=i%2?.07:.15;const x=Math.cos(t)*r,y=Math.sin(t)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y)}shape.closePath();mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012}),material);
  }else if(type==='ribbon'){
   const group=new THREE.Group();for(const side of [-1,1]){const loop=new THREE.Mesh(new THREE.SphereGeometry(.1,24,16),material.clone());loop.scale.set(1,.65,.32);loop.position.x=side*.085;loop.rotation.z=side*-.35;group.add(loop)}const knot=new THREE.Mesh(new THREE.SphereGeometry(.04,16,12),material);group.add(knot);group.position.set(.49,.60,.55);this.accessory.add(group);return;
  }else mesh=new THREE.Mesh(new THREE.ConeGeometry(.09,.22,32),material);
  mesh.position.set(.49,.6,.55);mesh.rotation.z=-.25;this.accessory.add(mesh);
 }
 private setTone(tone:Appearance['tone']){const color=new THREE.Color(coatColors[tone]);this.bodyMaterial.color.copy(color).multiplyScalar(.83);this.furMaterial.color.copy(color)}
 update(a:Appearance){const old=this.appearance;this.appearance={...a};if(a.body!==old.body||a.fur!==old.fur||a.seed!==old.seed){this.buildCoat();if(a.fur!==old.fur)this.shiver=1}if(a.eye!==old.eye||a.body!==old.body){this.buildEyes();this.blinkUntil=this.elapsed+.16}if(a.detail!==old.detail)this.buildAccessory();if(a.tone!==old.tone)this.setTone(a.tone)}
 hit(nx:number,ny:number){this.scene.updateMatrixWorld(true);this.raycaster.setFromCamera(new THREE.Vector2(nx,ny),this.camera);return this.raycaster.intersectObject(this.hitBody).length>0}
 down(){this.held=true;this.dragged=false;this.targetX=this.x;this.targetY=this.y}
 drag(x:number,y:number){this.dragged=Math.hypot(x,y)>.04;this.targetX=THREE.MathUtils.clamp(x,-.55,.55);this.targetY=THREE.MathUtils.clamp(y,-.45,.45)}
 release(){this.held=false;this.targetX=0;this.targetY=0}
 look(x:number,y:number){this.eyeLook.set(THREE.MathUtils.clamp(x,-1,1),THREE.MathUtils.clamp(y,-1,1))}
 frame(dt:number){
  if(this.disposed||this.lost)return;dt=Math.min(.033,dt);this.elapsed+=dt;this.furTime.value=this.elapsed;this.furMotion.value=this.reduced?0:1;
  const target=this.held?(this.dragged?1.045:.84):1;
  this.squashVelocity+=(target-this.squash)*150*dt;this.squashVelocity*=Math.exp(-12*dt);this.squash+=this.squashVelocity*dt;
  this.vx+=(this.targetX-this.x)*100*dt;this.vy+=(this.targetY-this.y)*100*dt;this.vx*=Math.exp(-12*dt);this.vy*=Math.exp(-12*dt);this.x+=this.vx*dt;this.y+=this.vy*dt;
  this.shiver*=Math.exp(-5*dt);
  const breath=this.reduced?0:Math.sin(this.elapsed*1.7)*.012;
  this.creature.scale.set(2-this.squash-breath,this.squash+breath,1);
  this.creature.position.set(this.x,this.y+(this.squash-1)*.8,0);
  this.creature.rotation.z=this.reduced?0:Math.sin(this.elapsed*1.15)*.025+Math.sin(this.elapsed*40)*this.shiver*.028;
  this.creature.rotation.y=this.reduced?0:Math.sin(this.elapsed*.52)*.075;
  const blinking=this.elapsed<this.blinkUntil||this.elapsed%4.7<.12;
  for(const eye of this.eyes){const base=this.appearance.eye==='round'?1:1.12;eye.scale.y=blinking?.10:this.appearance.eye==='sleepy'?.19:base;}
  this.face.position.set(this.eyeLook.x*.012,this.eyeLook.y*.012,0);
  this.renderer.render(this.scene,this.camera);
 }
 loseContext(value:boolean){this.lost=value}
 stats(){return{calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,dpr:this.renderer.getPixelRatio(),furCount:this.preview?8000:24000}}
 dispose(){this.disposed=true;this.coat.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});this.coat.clear();disposeTree(this.face);disposeTree(this.accessory);this.hitBody.geometry.dispose();(this.hitBody.material as THREE.Material).dispose();this.bodyMaterial.dispose();this.furMaterial.dispose();this.ground.geometry.dispose();(this.ground.material as THREE.Material).dispose();this.scene.traverse(o=>{if(o instanceof THREE.DirectionalLight)o.shadow.map?.dispose()});this.renderer.dispose();this.renderer.forceContextLoss()}
}
