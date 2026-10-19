import React,{useMemo,useEffect,useRef} from 'react';
import * as T from 'three';
import {Candidate,distance,frontDepth} from '../studio/shape';
import {defaults} from '../studio/parameters';
export type Accessory='none'|'ribbon'|'glasses'|'flower'|'beanie'|'headphones'|'star'|'crown';
export function crownHeight(c:Candidate,x=0){let lo=0,hi=1.4;for(let i=0;i<20;i++){const m=(lo+hi)/2;if(distance(x,m,0,defaults,c)>0)hi=m;else lo=m}return(lo+hi)/2;}
function Wire({points,radius=.012,color='#b6a8d2'}:{points:T.Vector3[];radius?:number;color?:string}){
 const curve=useMemo(()=>new T.CatmullRomCurve3(points),[points]);return <mesh><tubeGeometry args={[curve,36,radius,8,false]}/><meshStandardMaterial color={color} metalness={.65} roughness={.28}/></mesh>;
}
function RibbonLoop({side}:{side:number}){
 const shape=useMemo(()=>{const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(.07,.035,.18,.14,.205,.085);s.bezierCurveTo(.23,.015,.18,-.095,.12,-.055);s.bezierCurveTo(.06,-.035,.02,-.01,0,0);return s},[]);
 return <mesh scale={[side,1,1]}><extrudeGeometry args={[shape,{depth:.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:5,steps:1,curveSegments:20}]}/><meshPhysicalMaterial color="#c9a6ce" roughness={.45} sheen={1} sheenColor="#f7d9ef" sheenRoughness={.5}/></mesh>;
}
function Beanie(){
 const cap=useMemo(()=>new T.LatheGeometry([new T.Vector2(0,.32),new T.Vector2(.09,.31),new T.Vector2(.19,.25),new T.Vector2(.26,.14),new T.Vector2(.27,0)],48),[]);
 return <group><mesh geometry={cap}><meshPhysicalMaterial color="#aaa1c4" roughness={.98} sheen={1} sheenColor="#ded1ef"/></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.25,.045,12,64]}/><meshStandardMaterial color="#9990b5" roughness={1}/></mesh>{Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2;return <Wire key={i} points={[new T.Vector3(Math.cos(a)*.269,.025,Math.sin(a)*.269),new T.Vector3(Math.cos(a)*.242,.16,Math.sin(a)*.242),new T.Vector3(Math.cos(a)*.11,.29,Math.sin(a)*.11)]} radius={.005} color="#b9afcc"/>})}<mesh position={[0,.36,0]}><sphereGeometry args={[.065,24,16]}/><meshStandardMaterial color="#d7cbe6" roughness={1}/></mesh></group>;
}
function Star(){
 const shape=useMemo(()=>{const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.063:.14;const x=Math.sin(a)*r,y=Math.cos(a)*r;if(i===0)s.moveTo(x,y);else s.lineTo(x,y)}s.closePath();return s},[]);
 return <mesh><extrudeGeometry args={[shape,{depth:.035,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:5}]}/><meshPhysicalMaterial color="#d8db92" metalness={.55} roughness={.27} clearcoat={1}/></mesh>;
}
function Crown(){
 const geometry=useMemo(()=>{const positions=[],indices=[];const n=120;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,height=.09+.14*Math.pow(Math.max(0,Math.cos(a*5)),4);for(const r of [.22,.202])for(const y of [0,height])positions.push(Math.sin(a)*r,y,Math.cos(a)*r)}for(let i=0;i<n;i++){const k=i*4;for(const [a,b] of [[0,1],[2,3],[1,3],[0,2]])indices.push(k+a,k+4+a,k+b,k+b,k+4+a,k+4+b)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g},[]);
 return <group><mesh geometry={geometry}><meshPhysicalMaterial color="#d1bb7c" metalness={.78} roughness={.24} side={T.DoubleSide} clearcoat={.7}/></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.211,.014,10,64]}/><meshStandardMaterial color="#d5be86" metalness={.8} roughness={.25}/></mesh>{Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return <mesh key={i} position={[Math.sin(a)*.22,.235,Math.cos(a)*.22]}><sphereGeometry args={[.022,16,12]}/><meshPhysicalMaterial color="#d7c0ef" metalness={.2} roughness={.12} clearcoat={1}/></mesh>})}</group>;
}
function Headphones(){return <group><Wire points={Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return new T.Vector3(Math.cos(a)*.94,Math.sin(a)*.94,0)})} radius={.035} color="#756b8d"/>{[-1,1].map(s=><group key={s} position={[s*.94,0,0]}><mesh scale={[.095,.19,.17]}><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color="#24232c" roughness={.85}/></mesh><mesh position={[s*.07,0,0]} scale={[.06,.16,.14]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial color="#b1a4c9" metalness={.55} roughness={.26} clearcoat={1}/></mesh><mesh position={[s*.125,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.065,.008,8,32]}/><meshStandardMaterial color="#c6ff4d" emissive="#c6ff4d" emissiveIntensity={.25}/></mesh></group>)}</group>}
export function AccessoryModel({kind}:{kind:Accessory}){
 if(kind==='none')return null;
 if(kind==='beanie')return <Beanie/>;if(kind==='star')return <Star/>;if(kind==='crown')return <Crown/>;if(kind==='headphones')return <Headphones/>;
 if(kind==='glasses')return <group>{[-1,1].map(s=><group key={s}><mesh position={[s*.26,0,0]}><torusGeometry args={[.119,.012,10,64]}/><meshStandardMaterial color="#c9bbd7" metalness={.75} roughness={.22}/></mesh><mesh position={[s*.26,0,0]} scale={[.105,.105,.008]}><sphereGeometry args={[1,32,16]}/><meshPhysicalMaterial color="#d9d4f3" transparent opacity={.08} roughness={.1} clearcoat={1} depthWrite={false}/></mesh><Wire points={[new T.Vector3(s*.38,0,0),new T.Vector3(s*.60,.015,-.11),new T.Vector3(s*.76,.025,-.35)]}/></group>)}<Wire points={[new T.Vector3(-.14,0,0),new T.Vector3(0,.033,.01),new T.Vector3(.14,0,0)]}/></group>;
 if(kind==='ribbon')return <group rotation={[.12,0,-.2]}>{[-1,1].map(s=><group key={s}><RibbonLoop side={s}/><mesh position={[s*.05,-.09,-.008]} rotation={[0,0,s*.3]} scale={[.04,.10,.018]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#b38eb9" roughness={.6}/></mesh></group>)}<mesh scale={[.043,.054,.052]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#e0bedb" roughness={.42} sheen={.8}/></mesh></group>;
 return <group rotation={[.15,0,-.25]}>{Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return <mesh key={i} position={[Math.sin(a)*.075,Math.cos(a)*.075,0]} rotation={[0,0,-a]} scale={[.045,.075,.025]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#f3dce8" roughness={.55} sheen={.6}/></mesh>})}<mesh position={[0,0,.025]} scale={[.045,.045,.03]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#decb78" roughness={.6}/></mesh><Wire points={[new T.Vector3(0,-.03,-.025),new T.Vector3(-.02,-.15,-.03)]} radius={.012} color="#8d9e77"/></group>;
}
function StyledItem({kind,scale,offset,tone}:{kind:Accessory;scale:number;offset:number;tone:string}){
 const group=useRef<T.Group>(null),original=useRef(new WeakMap<T.Material,T.Color>());
 useEffect(()=>{const tint=tone==='pink'?'#f2aacb':tone==='lavender'?'#b6a8ff':tone==='lime'?'#c6ff4d':null;group.current?.traverse(o=>{if(!(o instanceof T.Mesh))return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!(m instanceof T.MeshStandardMaterial))continue;if(!original.current.has(m))original.current.set(m,m.color.clone());const base=original.current.get(m)!;m.color.copy(base);if(tint&&Math.max(base.r,base.g,base.b)>.18)m.color.lerp(new T.Color(tint),.7)}})},[kind,tone]);
 return <group ref={group} scale={scale} position={[0,offset,0]}><AccessoryModel kind={kind}/></group>;
}
export function Accessories({kind,candidate,scale=1,offset=0,tone='original'}:{kind:Accessory;candidate:Candidate;scale?:number;offset?:number;tone?:string}){
 if(kind==='headphones')return <group position={[0,.03,0]} scale={candidate==='potato'?[.94,1.08,1]:[1,1,1]}><StyledItem kind={kind} scale={scale} offset={offset} tone={tone}/></group>;
 if(kind==='beanie'||kind==='crown')return <group position={[-.16,crownHeight(candidate,-.16)+.035,0]} rotation={[0,0,.12]}><StyledItem kind={kind} scale={scale} offset={offset} tone={tone}/></group>;
 if(kind==='ribbon')return <group position={[-.30,crownHeight(candidate,-.30)+.13,.40]} rotation={[-.12,0,-.1]}><StyledItem kind={kind} scale={scale} offset={offset} tone={tone}/></group>;
 const x=kind==='flower'?.36:-.30,y=crownHeight(candidate,x);
 return kind==='glasses'?<group position={[0,-.08,frontDepth(0,-.08,defaults,candidate)+.08]}><StyledItem kind={kind} scale={scale} offset={offset} tone={tone}/></group>:<group position={[x,y+.035,.24]} rotation={[-.25,0,0]}><StyledItem kind={kind} scale={scale} offset={offset} tone={tone}/></group>;
}
