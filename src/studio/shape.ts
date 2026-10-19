import * as T from 'three';
import type {Parameters} from './parameters';
export const candidates=['mochi','potato','messy'] as const;
export type Candidate=typeof candidates[number];
export const candidateNames:Record<Candidate,string>={mochi:'CHUBBY MOCHI',potato:'DUMB POTATO',messy:'MESSY FLUFF'};
const union=(a:number,b:number,k:number)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
function ellipsoid(x:number,y:number,z:number,rx:number,ry:number,rz:number){const a=Math.hypot(x/rx,y/ry,z/rz),b=Math.hypot(x/(rx*rx),y/(ry*ry),z/(rz*rz));return b<1e-8?-Math.min(rx,ry,rz):a*(a-1)/b;}
// Smooth unions make the paws and arms part of one closed skin, not attached spheres.
export function distance(x:number,y:number,z:number,p:Parameters,c:Candidate){
 x/=p.bodyWidth/1.08;y=(y+.78)/(p.bodyHeight/.86)-.78;
 let d:number;
 if(c==='mochi')d=ellipsoid(x+.015*Math.sin(y*4),y+.015,z,.96,.80,.78);
 else if(c==='potato')d=union(ellipsoid(x-.025,y+.13,z,.92,.67,.76),ellipsoid(x+.10,y-.35,z+.035,.67,.61,.66),.28);
 else{d=union(ellipsoid(x+.17,y+.04,z,.88,.74,.78),ellipsoid(x-.40,y-.09,z+.05,.63,.63,.66),.23);d+=Math.sin(x*5+y*3)*Math.cos(z*4-y*2)*.025;}
 d+=p.bodyShape*.018*Math.sin(x*4+y*3)*Math.cos(y*5+z*3);
 const limb=p.limbSize/.12;
 for(const s of [-1,1]){
  d=union(d,ellipsoid(x-s*p.armOffset,y+.39+(s===1?.025:0),z-.14,.16*limb,.19*limb,.21*limb),.13);
  d=union(d,ellipsoid(x-s*p.footSpacing,y+.60,z-.22,.18*limb,.25*limb,.24*limb),.18);
  d=union(d,ellipsoid(x-s*p.footSpacing,y+.78,z-.36,.15*limb,.12*limb,.20*limb),.13);
 }
 // A gently rounded contact plane avoids the old hemisphere's hard cut.
 return -union(-d,-(-.92-y),.035);
}
export function surfaceNormal(x:number,y:number,z:number,p:Parameters,c:Candidate){const e=.0015;return new T.Vector3(distance(x+e,y,z,p,c)-distance(x-e,y,z,p,c),distance(x,y+e,z,p,c)-distance(x,y-e,z,p,c),distance(x,y,z+e,p,c)-distance(x,y,z-e,p,c)).normalize();}
export function frontDepth(x:number,y:number,p:Parameters,c:Candidate){let outside=1.5,inside=0;for(let i=0;i<24;i++){const mid=(outside+inside)/2;if(distance(x,y,mid,p,c)>0)outside=mid;else inside=mid;}return(outside+inside)/2;}
export function skin(p:Parameters,c:Candidate='mochi'){
 const n=52,span=3.2,step=span/n,stride=n+1,values=new Float32Array(stride**3),at=(x:number,y:number,z:number)=>x+stride*(y+stride*z);
 for(let z=0;z<=n;z++)for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)values[at(x,y,z)]=distance(x*step-1.6,y*step-1.6,z*step-1.6,p,c);
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 const positions:number[]=[],normals:number[]=[];
 function triangle(a:T.Vector3,b:T.Vector3,d:T.Vector3){const normal=surfaceNormal((a.x+b.x+d.x)/3,(a.y+b.y+d.y)/3,(a.z+b.z+d.z)/3,p,c);if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(d,a)).dot(normal)<0)[b,d]=[d,b];for(const v of [a,b,d]){positions.push(v.x,v.y,v.z);const norm=surfaceNormal(v.x,v.y,v.z,p,c);normals.push(norm.x,norm.y,norm.z)}}
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const ds=corners.map(q=>values[at(x+q[0],y+q[1],z+q[2])]);if(ds.every(d=>d>=0)||ds.every(d=>d<0))continue;
  const ps=corners.map(q=>new T.Vector3((x+q[0])*step-1.6,(y+q[1])*step-1.6,(z+q[2])*step-1.6));
  for(const t of tetra){const points:T.Vector3[]=[];for(const [a,b]of edges){const i=t[a],j=t[b];if((ds[i]<0)===(ds[j]<0))continue;points.push(ps[i].clone().lerp(ps[j],ds[i]/(ds[i]-ds[j])))}if(points.length===3)triangle(points[0],points[1],points[2]);else if(points.length===4){const center=points.reduce((a,v)=>a.add(v),new T.Vector3()).multiplyScalar(.25),normal=surfaceNormal(center.x,center.y,center.z,p,c),axis=points[0].clone().sub(center).normalize(),other=new T.Vector3().crossVectors(normal,axis);points.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(other),a.clone().sub(center).dot(axis))-Math.atan2(b.clone().sub(center).dot(other),b.clone().sub(center).dot(axis)));triangle(points[0],points[1],points[2]);triangle(points[0],points[2],points[3]);}}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.computeBoundingSphere();return geometry;
}
