import * as T from 'three';
import {Parameters} from './parameters';
import {skin, Candidate} from './shape';
export {skin} from './shape';
export function guides(p:Parameters,c:Candidate='mochi',provided?:T.BufferGeometry){
 const mesh=provided||skin(p,c),pos=mesh.attributes.position,norm=mesh.attributes.normal;
 const areas:number[]=[];let total=0;const va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3();
 for(let i=0;i<pos.count;i+=3){va.fromBufferAttribute(pos,i);vb.fromBufferAttribute(pos,i+1);vc.fromBufferAttribute(pos,i+2);total+=vb.sub(va).cross(vc.sub(va)).length()*.5;areas.push(total)}
 let seed=38127;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const roots:number[]=[],normals:number[]=[],bends:number[]=[],lengths:number[]=[],widths:number[]=[],phases:number[]=[],layers:number[]=[];
 for(let i=0;i<p.furDensity;i++){
  const area=rng()*total;let lo=0,hi=areas.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(areas[mid]<area)lo=mid+1;else hi=mid}const tri=lo*3;
  const u=Math.sqrt(rng()),v=rng(),weights=[1-u,u*(1-v),u*v];const root=new T.Vector3(),n=new T.Vector3();
  for(let j=0;j<3;j++){root.addScaledVector(va.fromBufferAttribute(pos,tri+j),weights[j]);n.addScaledVector(va.fromBufferAttribute(norm,tri+j),weights[j])}n.normalize();root.addScaledVector(n,.001);
  const choice=rng(),layer=choice<.55?0:choice<.985?1:2;
  let length=p.furLength*([.35,.88,1.25][layer])*(.75+rng()*.5);
  const angle=Math.atan2(root.z,root.x),latitude=Math.atan2(root.y,Math.hypot(root.x,root.z));
  const ca=(Math.round(angle/.23))*.23,cy=Math.round(latitude/.22)*.22;
  const anchor=new T.Vector3(Math.cos(ca)*Math.cos(cy),Math.sin(cy),Math.sin(ca)*Math.cos(cy)).multiplyScalar(root.length());
  const clump=anchor.sub(root);clump.addScaledVector(n,-clump.dot(n));
  const flow=new T.Vector3(.13*Math.sin(angle*3+root.y*4),-p.furDirection,.04);
  flow.x+=.50*T.MathUtils.smoothstep(root.y,.4,.85);
  flow.addScaledVector(n,-flow.dot(n));flow.addScaledVector(clump,layer===0?1:2.8);
  // Face fibers sweep around the sockets, with a small recessed opening only.
  if(root.z>.45){const eyeX=root.x<0?-p.eyeSpacing/2:p.eyeSpacing/2,dx=root.x-eyeX,dy=root.y-p.eyeHeight,d=Math.hypot(dx,dy);length*=.12+.88*T.MathUtils.smoothstep(d,p.eyeSize*.65,p.eyeSize*2.5);if(d<.22){flow.x+=dx*2;flow.y+=dy*.7}}
  // Short plush on paws exposes their volume while keeping the same continuous coat.
  if(root.y<-.55)length*=.30+.70*T.MathUtils.smoothstep(root.y,-.86,-.55);
  if(Math.abs(root.x)>.83&&root.y<-.15)length*=.7;
  roots.push(root.x,root.y,root.z);normals.push(n.x,n.y,n.z);bends.push(flow.x,flow.y,flow.z);lengths.push(length);widths.push([.0037,.0028,.0015][layer]*(.8+rng()*.4));
  phases.push(ca*8+cy*12+rng()*.55);layers.push(layer);
 }
 if(!provided)mesh.dispose();return {roots,normals,bends,lengths,widths,phases,layers};
}
export function furGeometry(p:Parameters,c:Candidate='mochi',provided?:T.BufferGeometry){
 const g=new T.InstancedBufferGeometry(),positions=[],uv=[],index=[];const segments=8;
 for(let cross=0;cross<2;cross++)for(let j=0;j<=segments;j++)for(const sign of [-1,1]){positions.push(sign,j/segments,cross);uv.push((sign+1)/2,j/segments);}
 for(let cross=0;cross<2;cross++)for(let j=0;j<segments;j++){const b=cross*(segments+1)*2+j*2;index.push(b,b+1,b+2,b+1,b+3,b+2);}
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);
 const d=guides(p,c,provided);for(const [name,array,size] of [['root',d.roots,3],['rootNormal',d.normals,3],['bend',d.bends,3],['hairLength',d.lengths,1],['hairWidth',d.widths,1],['phase',d.phases,1]] as [string,number[],number][]){g.setAttribute(name,new T.InstancedBufferAttribute(new Float32Array(array),size));}
 g.instanceCount=p.furDensity;g.boundingSphere=new T.Sphere(new T.Vector3(),2);return g;
}
export function furMaterial(roughness:number){
 const m=new T.MeshStandardMaterial({color:'#eee0cd',roughness,side:T.DoubleSide,emissive:'#b7a389',emissiveIntensity:.12});
 m.onBeforeCompile=s=>{
 s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
 attribute vec3 root; attribute vec3 rootNormal; attribute vec3 bend;
 attribute float hairLength; attribute float hairWidth; attribute float phase;
 varying float vHairT; varying float vHairEdge;
 `).replace('#include <beginnormal_vertex>',`vec3 objectNormal= rootNormal;`).replace('#include <begin_vertex>',`
 float t=position.y;vHairT=t;vHairEdge=position.x;
 vec3 side=normalize(cross(rootNormal,abs(rootNormal.y)>.95?vec3(1.,0.,0.):vec3(0.,1.,0.)));
 vec3 crossSide=cross(rootNormal,side);
 vec3 axis=position.z<.5?side:crossSide;
 vec3 transformed=root+rootNormal*hairLength*t*.62+bend*hairLength*t*t;
 transformed+=side*sin(t*5.2+phase)*hairLength*.20*t;
 transformed+=axis*position.x*hairWidth*pow(1.-t,.8);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>\nvarying float vHairT; varying float vHairEdge;`).replace('#include <color_fragment>',`#include <color_fragment>\ndiffuseColor.rgb *= .94+.06*sqrt(vHairT);`).replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
 };
 return m;
}
