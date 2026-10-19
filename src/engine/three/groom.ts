import * as THREE from 'three';
import {Appearance,Body} from '../appearance';
import {random} from '../geometry';

export function bodyPoint(body:Body,x:number,y:number,z:number):THREE.Vector3 {
  const width=body==='dumpling'?1.02-y*.17:body==='blob'?1.12:1;
  const height=body==='dumpling'?.88:body==='blob'?.76:.98;
  const wobble=body==='blob'?1+.045*Math.sin(x*7+y*4)*Math.cos(z*5):1;
  return new THREE.Vector3(x*width*wobble,y*height,z*.82*width*wobble);
}
export function makeBody(body:Body){
 const geometry=new THREE.SphereGeometry(1,64,48),position=geometry.attributes.position;
 for(let i=0;i<position.count;i++){const p=bodyPoint(body,position.getX(i),position.getY(i),position.getZ(i));position.setXYZ(i,p.x,p.y,p.z)}
 geometry.computeVertexNormals();return geometry;
}
export type FurSample=(x:number,y:number,z:number)=>THREE.Vector3;
export function makeFur(a:Appearance,count:number,sample:FurSample=(x,y,z)=>bodyPoint(a.body,x,y,z),face=true){
 const rng=random(a.seed),segments=5,ribbons=2,vertices=count*(segments+1)*2*ribbons;
 const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),colors=new Float32Array(vertices*3),indices=new Uint32Array(count*segments*6*ribbons);
 const tips=new Float32Array(vertices);
 let v=0,k=0;
 const lengthBase=a.fur==='short'?.095:a.fur==='soft'?.205:.29;
 const up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3(),side=new THREE.Vector3(),side2=new THREE.Vector3();
 const root=new THREE.Vector3(),center=new THREE.Vector3(),bend=new THREE.Vector3(),shadeNormal=new THREE.Vector3();
 for(let hair=0;hair<count;hair++){
  const y=1-2*(hair+rng()*.8)/count,angle=hair*2.399963229728653+rng()*.12,r=Math.sqrt(1-y*y),x=r*Math.cos(angle),z=r*Math.sin(angle);
  root.copy(sample(x,y,z));normal.set(x,y,z).normalize();side.crossVectors(normal,Math.abs(y)>.95?new THREE.Vector3(1,0,0):up).normalize();side2.crossVectors(normal,side).normalize();
  const lock=Math.sin(angle*13+y*18)*.35+Math.cos(angle*7-y*11)*.18;
  let len=lengthBase*(.55+rng()*.8);
  // Clear only tiny eye sockets; no broad shaved face patch.
  if(face&&z>.5){const eyeDistance=Math.min(Math.hypot(root.x-.27,(root.y-.02)*1.2),Math.hypot(root.x+.27,(root.y-.02)*1.2));len*=THREE.MathUtils.smoothstep(eyeDistance,.035,.14)*.82+.18;}
  const phase=rng()*Math.PI*2,width=(a.fur==='short'?.0024:.0031)*(.5+rng()*.8);
  bend.copy(side).multiplyScalar(lock*.65).addScaledVector(side2,Math.sin(phase)*.12);
  bend.y-=1.25;
  const tint=.79+rng()*.21;
  for(let ribbon=0;ribbon<ribbons;ribbon++){
   const start=v;const axis=ribbon===0?side:side2;
   for(let j=0;j<=segments;j++){
    const t=j/segments;
    center.copy(root).addScaledVector(normal,len*t*.78).addScaledVector(bend,len*t*t);
    center.addScaledVector(side,Math.sin(t*3+phase)*len*.11*t);
    const taper=Math.pow(1-t,.8)*width+.00012;
    for(let sign=-1;sign<=1;sign+=2){
     positions[v*3]=center.x+axis.x*taper*sign;positions[v*3+1]=center.y+axis.y*taper*sign;positions[v*3+2]=center.z+axis.z*taper*sign;
     shadeNormal.copy(normal).addScaledVector(axis,sign*.22).normalize();normals.set([shadeNormal.x,shadeNormal.y,shadeNormal.z],v*3);
     const value=tint*(.76+.24*Math.sqrt(t));colors.set([value,value,value],v*3);tips[v]=t;v++;
    }
   }
   for(let j=0;j<segments;j++){const base=start+j*2;indices.set([base,base+1,base+2,base+1,base+3,base+2],k);k+=6;}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('groomTip',new THREE.BufferAttribute(tips,1));g.setIndex(new THREE.BufferAttribute(indices,1));g.computeBoundingSphere();return g;
}
