import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame,useLoader} from '@react-three/fiber';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Parameters} from './parameters';
import {Candidate,frontDepth,skin} from './shape';
import {furGeometry,furMaterial} from './procedural';
export type StudyMode='groom'|'clay'|'silhouette';
export function Procedural({p,c,mode}:{p:Parameters;c:Candidate;mode:StudyMode}){
 const body=useMemo(()=>skin(p,c),[c,p.bodyWidth,p.bodyHeight,p.bodyShape,p.limbSize,p.armOffset,p.footSpacing]);
 const fur=useMemo(()=>mode==='groom'?furGeometry(p,c,body):null,[mode,body,c,p.furLength,p.furDensity,p.furDirection,p.eyeSize,p.eyeSpacing,p.eyeHeight]);
 const material=useMemo(()=>furMaterial(.94),[]);
 useEffect(()=>{material.roughness=p.roughness},[p.roughness,material]);
 useEffect(()=>()=>body.dispose(),[body]);useEffect(()=>()=>fur?.dispose(),[fur]);useEffect(()=>()=>material.dispose(),[material]);
 return <group><mesh geometry={body}>{mode==='silhouette'?<meshBasicMaterial color="#101015"/>:<meshStandardMaterial color={mode==='clay'?'#bfb4a7':'#e5d5bd'} roughness={p.roughness}/>}</mesh>{fur&&<mesh geometry={fur} material={material} frustumCulled={false}/>}</group>;
}
export function Baked({p,c}:{p:Parameters;c:Candidate}){
 const gltf=useLoader(GLTFLoader,`./studio/v02/${c}/character-b.glb`);
 const object=useMemo(()=>{const clone=gltf.scene.clone(true);clone.traverse(o=>{if(o instanceof T.Mesh){o.material=(o.material as T.MeshStandardMaterial).clone();o.castShadow=false}});return clone},[gltf]);
 useEffect(()=>{object.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.roughness=p.roughness;if(o.name==='Groom'){m.color.set('#eee0cd');m.emissive.set('#b7a389');m.emissiveIntensity=.12}}})},[object,p.roughness]);
 // Only one baked candidate is shown at a time. Release inactive GPU buffers;
 // the loader retains CPU data so a later selection can upload them again.
 useEffect(()=>()=>object.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose()}}),[object]);
 return <primitive object={object}/>;
}
function Eyes({p,c,animate}:{p:Parameters;c:Candidate;animate:boolean}){
 const group=useRef<T.Group>(null);
 useFrame(({clock})=>{const t=clock.elapsedTime,phase=t%6.8;const blink=animate&&phase>5.9&&phase<6.35?1-Math.sin((phase-5.9)/.45*Math.PI)*.94:1;if(group.current)for(const eye of group.current.children)eye.scale.y=1.04*blink;});
 return <group ref={group}>{[-1,1].map(s=>{const x=s*p.eyeSpacing/2,y=p.eyeHeight+(c==='potato'&&s===1?-.015:0),z=frontDepth(x,y,p,c)+p.eyeDepth;return <mesh key={s} position={[x,y,z]} rotation={[0,s*.12,0]} scale={[.86,1.04,.7]}><sphereGeometry args={[p.eyeSize,32,24]}/><meshPhysicalMaterial color="#0c0a0a" roughness={.42} clearcoat={.08} specularIntensity={.3}/></mesh>})}</group>;
}
export function StudyModel({p,c,pipeline,mode,animate}:{p:Parameters;c:Candidate;pipeline:'A'|'B';mode:StudyMode;animate:boolean}){
 const pivot=useRef<T.Group>(null);
 useFrame(({clock})=>{if(!pivot.current)return;const t=clock.elapsedTime,b=animate?Math.sin(t*1.45)*.009:0;pivot.current.scale.set(1-b*.4,1+b,1-b*.25);pivot.current.rotation.z=animate?Math.sin(t*.7)*.012+Math.pow(Math.max(0,Math.sin(t*.31)),6)*.035:0;pivot.current.rotation.y=animate?Math.sin(t*.42)*.022:0;});
 return <group position={[0,-.92,0]}><group ref={pivot}><group position={[0,.92,0]}>{pipeline==='B'&&mode==='groom'?<Baked p={p} c={c}/>:<Procedural p={p} c={c} mode={mode}/>} {mode==='groom'&&<Eyes p={p} c={c} animate={animate}/>}</group></group></group>;
}
export function ContactShadow(){
 const material=useMemo(()=>new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; void main(){vec2 p=(vUv-.5)*2.;float alpha=exp(-dot(p,p)*4.5)*.30;gl_FragColor=vec4(.025,.02,.04,alpha);}'}),[]);
 useEffect(()=>()=>material.dispose(),[material]);return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.928,.04]} material={material}><planeGeometry args={[3.8,2.8]}/></mesh>;
}
