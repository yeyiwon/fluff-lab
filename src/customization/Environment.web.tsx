import React,{useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';

function GlassPillar({position,scale,angle=0}:{position:[number,number,number];scale:[number,number,number];angle?:number}){
 const geometry=useMemo(()=>new RoundedBoxGeometry(1,1,1,5,.15),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={position} rotation={[0,angle,0]}><mesh geometry={geometry} scale={scale}><meshPhysicalMaterial color="#9d91bd" transparent opacity={.10} roughness={.12} metalness={.45} clearcoat={1} envMapIntensity={2.6} side={T.DoubleSide} depthWrite={false}/></mesh><mesh position={[-scale[0]*.39,0,scale[2]*.49]}><boxGeometry args={[.012,scale[1]*.88,.012]}/><meshBasicMaterial color="#aea4d7" transparent opacity={.38}/></mesh><mesh position={[scale[0]*.4,0,scale[2]*.49]}><boxGeometry args={[.008,scale[1]*.86,.01]}/><meshBasicMaterial color="#eee7ff" transparent opacity={.22}/></mesh></group>;
}
function LightVeil(){
 const material=useMemo(()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;
 void main(){vec2 p=vUv;float beam=exp(-pow((p.x-.34-(p.y-.5)*.12)*5.,2.))*pow(sin(p.y*3.14159),2.);float folds=.6+.4*sin(p.x*37.+sin(p.y*5.)*2.);float a=beam*folds*.18;gl_FragColor=vec4(.42,.31,.72,a);}`}),[]);
 useEffect(()=>()=>material.dispose(),[material]);return <mesh position={[0,1,-4]} material={material}><planeGeometry args={[14,12]}/></mesh>;
}
export function Environment(){
 const {gl,scene,size}=useThree(),side=size.width<size.height?.52:1;
 useEffect(()=>{const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(gl),target=pmrem.fromScene(room,.04),old=scene.environment;scene.environment=target.texture;scene.environmentIntensity=.16;room.dispose();pmrem.dispose();return()=>{scene.environment=old;target.dispose()}},[gl,scene]);
 const mirror=useMemo(()=>{const r=new Reflector(new T.PlaneGeometry(200,200),{textureWidth:512,textureHeight:512,color:0x17131f,clipBias:.004});r.rotation.x=-Math.PI/2;r.position.y=-1.23;
 const drawReflection=r.onBeforeRender;
 // The heavily diffused floor reflection uses the skin silhouette, not 1.25M fur triangles.
 r.onBeforeRender=function(renderer,world,camera,geometry,material,group){const hidden:T.Object3D[]=[];world.traverse(o=>{if(o.name==='Groom'&&o.visible){o.visible=false;hidden.push(o)}});try{drawReflection.call(this,renderer,world,camera,geometry,material,group)}finally{hidden.forEach(o=>o.visible=true)}};
 const m=r.material as T.ShaderMaterial;m.toneMapped=false;
 m.vertexShader=m.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying float floorDistance;').replace('vUv = textureMatrix', 'floorDistance=length((modelMatrix*vec4(position,1.)).xz); vUv = textureMatrix');
 m.fragmentShader=m.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying float floorDistance;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv=vUv.xy/vUv.w; vec2 d=vec2(.0025); vec4 base=(texture2D(tDiffuse,uv)*4.+texture2D(tDiffuse,uv+d)+texture2D(tDiffuse,uv-d)+texture2D(tDiffuse,uv+vec2(d.x,-d.y))+texture2D(tDiffuse,uv+vec2(-d.x,d.y)))/8.;`).replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb=vec3(.0056,.006,.007)+base.rgb*.055*exp(-floorDistance*.20);\n#include <tonemapping_fragment>');return r},[]);
 useEffect(()=>()=>{mirror.geometry.dispose();mirror.dispose()},[mirror]);
 const bowl=useMemo(()=>new T.LatheGeometry([new T.Vector2(0,-.18),new T.Vector2(1.18,-.18),new T.Vector2(1.30,-.14),new T.Vector2(1.35,-.06),new T.Vector2(1.35,.03),new T.Vector2(1.31,.08),new T.Vector2(1.24,.08),new T.Vector2(1.23,.015),new T.Vector2(0,.015)],96),[]);
 useEffect(()=>()=>bowl.dispose(),[bowl]);
 return <><color attach="background" args={['#111214']}/><fog attach="fog" args={['#111214',9,24]}/><primitive object={mirror}/>
 <LightVeil/>
 <mesh position={[0,-1.222,.5]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.48,2.50,128]}/><meshBasicMaterial color="#b6a8ff" transparent opacity={.12} depthWrite={false}/></mesh>
 <mesh position={[0,-1.223,.5]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.44,2.56,128]}/><meshBasicMaterial color="#b6a8ff" transparent opacity={.025} depthWrite={false}/></mesh>
 <GlassPillar position={[-3.7*side,.65,-4]} scale={[.85,5.3,.65]} angle={-.28}/>
 <GlassPillar position={[-4.4*side,.1,-4]} scale={[.75,6,1.1]} angle={.15}/>
 <GlassPillar position={[3.8*side,.8,-5]} scale={[1.2,5.5,.5]} angle={.24}/>
 <group position={[2.8*side,.5,-4.5]} rotation={[.12,-.35,-.25]}><mesh><torusGeometry args={[.85,.065,16,96]}/><meshPhysicalMaterial color="#aa9bd1" roughness={.15} metalness={.65} transparent opacity={.22} clearcoat={1} envMapIntensity={2}/></mesh><mesh><torusGeometry args={[.85,.006,8,96]}/><meshBasicMaterial color="#b6a8ff" transparent opacity={.35}/></mesh></group>
 <mesh position={[0,-1.02,0]} geometry={bowl}><meshPhysicalMaterial color="#b4a6d0" metalness={.35} roughness={.12} clearcoat={1} transparent opacity={.17} side={T.DoubleSide} depthWrite={false} envMapIntensity={2.4}/></mesh>
 {[[-.94,1.30],[-1.16,1.23]].map(([y,r])=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[r,.014,12,96]}/><meshPhysicalMaterial color="#d7c9f0" metalness={.6} roughness={.15} emissive="#b6a8ff" emissiveIntensity={.06}/></mesh>)}
 <mesh position={[0,-1.20,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.12,1.42,96]}/><meshBasicMaterial color="#b6a8ff" transparent opacity={.08} depthWrite={false}/></mesh>
 <pointLight position={[-2,-.2,1]} color="#b6a8ff" intensity={.4} distance={7}/><pointLight position={[2,-.7,0]} color="#c6ff4d" intensity={.12} distance={3}/>
 </>;
}
