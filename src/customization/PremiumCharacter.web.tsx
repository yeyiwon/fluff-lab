import React,{Suspense,useEffect,useMemo,useRef,useState,useDeferredValue} from 'react';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Environment} from './Environment.web';
import {Appearance} from '../engine/appearance';
import {ContactShadow} from '../studio/StudyModel.web';
import {Candidate} from '../studio/shape';
import {Face} from './Face.web';
import {Accessories,Accessory} from './Accessories.web';
import {bodyCandidate,coatColors,Expression,faceShape} from './design';

function Coat({a,c,expression,reduced,onReady}:{a:Appearance;c:Candidate;expression:Expression;reduced:boolean;onReady:(c:Candidate)=>void}){
 const gltf=useLoader(GLTFLoader,`./studio/v02/${c}/character-b.glb`);
 const uniforms=useMemo(()=>({fluffLength:{value:1},earPads:{value:0},socketShape:{value:new T.Vector4(.26,-.08,.075,.082)}}),[]);
 const object=useMemo(()=>{
  gltf.scene.updateMatrixWorld(true);const group=new T.Group();
  gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;
   // Normalize Blender transforms once; shader controls then share the face coordinate system.
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld),m=(o.material as T.MeshStandardMaterial).clone();
   const mesh=new T.Mesh(geometry,m);mesh.name=o.name;m.roughness=.94;m.envMapIntensity=.18;
   if(o.name==='Groom'){
    m.emissiveIntensity=.10;
    m.onBeforeCompile=shader=>{
     Object.assign(shader.uniforms,uniforms);
     shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
 uniform float fluffLength; uniform float earPads; uniform vec4 socketShape;
 float ell(vec3 p,vec3 r){float a=length(p/r),b=length(p/(r*r));return b<.00001?-min(r.x,min(r.y,r.z)):a*(a-1.)/b;}
 float uni(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
 float coatSurface(vec3 p){float d;
 ${c==='mochi'?'d=ell(p+vec3(.015*sin(p.y*4.),.015,0.),vec3(.96,.8,.78));':c==='potato'?'d=uni(ell(p+vec3(-.025,.13,0.),vec3(.92,.67,.76)),ell(p+vec3(.10,-.35,.035),vec3(.67,.61,.66)),.28);':'d=uni(ell(p+vec3(.17,.04,0.),vec3(.88,.74,.78)),ell(p+vec3(-.40,-.09,.05),vec3(.63,.63,.66)),.23);d+=sin(p.x*5.+p.y*3.)*cos(p.z*4.-p.y*2.)*.025;'}
 d+=.65*.018*sin(p.x*4.+p.y*3.)*cos(p.y*5.+p.z*3.);
 for(int i=0;i<2;i++){float s=i==0?-1.:1.;d=uni(d,ell(p+vec3(-s*.88,.39+(i==1?.025:0.),-.14),vec3(.16,.19,.21)),.13);d=uni(d,ell(p+vec3(-s*.36,.60,-.22),vec3(.18,.25,.24)),.18);d=uni(d,ell(p+vec3(-s*.36,.78,-.36),vec3(.15,.12,.20)),.13);}
 return -uni(-d,-(-.92-p.y),.035);}
 `)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
       float front=smoothstep(.40,.65,position.z);
       vec2 delta=vec2(abs(position.x)-socketShape.x,position.y-socketShape.y);
       float aperture=1.-smoothstep(.55,1.45,length(delta/socketShape.zw));
       if(abs(fluffLength-1.)>.001)transformed+=normal*max(0.,coatSurface(position))*(fluffLength-1.)*(1.-aperture*front);
       transformed.z-=aperture*front*.105;
       transformed.xy+=delta*aperture*front*.16;
       if(earPads>.001&&abs(position.x)>.8){float pad=1.-smoothstep(.55,1.2,length(vec2((position.y-.03)/.23,position.z/.21)));transformed-=normal*max(0.,coatSurface(position))*.92*pad*earPads;}
      `);
    };m.customProgramCacheKey=()=> 'fluff-v04-sockets-'+c;
   }group.add(mesh);
  });return group;
 },[gltf,uniforms]);
 useEffect(()=>onReady(c),[object,c,onReady]);
 const target=useMemo(()=>new T.Color(coatColors[a.tone]),[a.tone]);
 const socketTarget=useMemo(()=>{const f=faceShape(a.eye,expression);return new T.Vector4(.26,-.08,(.075*f.width+.018)*a.eyeScale,(.074*Math.max(.6,f.height)+.022+f.asymmetry)*a.eyeScale)},[a.eye,a.eyeScale,expression]);
 useFrame((_,dt)=>{
  const k=reduced?1:1-Math.exp(-dt*7);
  uniforms.fluffLength.value=T.MathUtils.lerp(uniforms.fluffLength.value,a.fur==='short'?.94:a.fur==='messy'?1.08:1,k);
  uniforms.earPads.value=T.MathUtils.lerp(uniforms.earPads.value,a.detail==='headphones'?1:0,k);
  uniforms.socketShape.value.lerp(socketTarget,k);
  object.children.forEach(o=>{const m=(o as T.Mesh).material as T.MeshStandardMaterial;m.color.lerp(target,k);if(o.name==='Groom')m.emissive.copy(m.color).multiplyScalar(.65)});
 });
 useEffect(()=>()=>object.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose()}}),[object]);
 return <primitive object={object}/>;
}
type TouchState={held:boolean;x:number;y:number};
function Creature({a,expression,reduced,reaction,onReady,touch}:{a:Appearance;expression:Expression;reduced:boolean;reaction:number;onReady:(c:Candidate)=>void;touch:React.RefObject<TouchState>}){
 const spring=useRef({y:1,vy:0,x:0,vx:0});
 const pivot=useRef<T.Group>(null),last=useRef({fur:a.fur,detail:a.detail,reaction}),pulse=useRef({start:-10,fur:false}),c=bodyCandidate[a.body];
 useFrame(({clock},dt)=>{
  const t=clock.elapsedTime;if(last.current.fur!==a.fur||last.current.detail!==a.detail||last.current.reaction!==reaction){pulse.current={start:t,fur:last.current.fur!==a.fur};last.current={fur:a.fur,detail:a.detail,reaction}}
  if(!pivot.current)return;const age=t-pulse.current.start,shake=!reduced&&age<.65?Math.sin(age*(pulse.current.fur?55:15))*.025*(1-age/.65):0;
  const breath=reduced?0:Math.sin(t*1.45)*.009;const lean=expression==='Curious'?.065:expression==='Confused'?-.065:expression==='Sleepy'?.025:0;
  // Substeps keep the spring stable after a slow frame; all attached parts deform together.
  const targetY=touch.current.held?T.MathUtils.clamp(.77-touch.current.y*.5,.62,1.22):1;
  const targetX=touch.current.held?touch.current.x*.55:0;
  const h=Math.min(dt,.05)/4,q=spring.current;
  for(let i=0;i<4;i++){q.vy+=((targetY-q.y)*190-q.vy*(reduced?28:14))*h;q.y+=q.vy*h;q.vx+=((targetX-q.x)*170-q.vx*(reduced?28:13))*h;q.x+=q.vx*h;}
  const spread=1/Math.sqrt(Math.max(.6,q.y));
  pivot.current.scale.set(spread-breath*.4,q.y+breath,spread-breath*.25);
  pivot.current.position.x=q.x;

  pivot.current.rotation.z=T.MathUtils.lerp(pivot.current.rotation.z,lean-q.x*.28+(reduced?0:Math.sin(t*.7)*.012)+shake,1-Math.exp(-dt*9));
 });
 const detail:Accessory=a.detail==='horn'?'none':a.detail;
 return <group position={[0,-.92,0]}><group ref={pivot}><group position={[0,.92,0]}><Coat a={a} c={c} expression={expression} reduced={reduced} onReady={onReady}/><Face candidate={c} style={a.eye} eyeScale={a.eyeScale} expression={expression} reduced={reduced}/><Accessories kind={detail} candidate={c} scale={a.detailScale} offset={a.detailOffset} tone={a.detailTone}/></group></group></group>;
}
function Rig({interactive,view=0,reset=0,room=false,ready=false,measurementKey=""}:{interactive:boolean;view?:number;reset?:number;room?:boolean;ready?:boolean;measurementKey?:string}){
 const {camera,gl,size}=useThree(),frames=useRef<number[]>([]);
 useEffect(()=>{const aspect=size.width/size.height,d=room?Math.max(7.2,4.8/aspect):5.6;camera.position.set(Math.sin(view)*d,room?.65:.15,Math.cos(view)*d);camera.lookAt(0,room?-.4:-.02,0)},[camera,view,reset,room,size.width,size.height]);
 useEffect(()=>{frames.current=[];delete gl.domElement.dataset.metrics},[measurementKey,ready,gl]);
 useEffect(()=>{gl.info.autoReset=false;return()=>{gl.info.autoReset=true}},[gl]);
 useFrame((_,dt)=>{if(!ready){gl.info.reset();return}if(frames.current.length<210){frames.current.push(dt*1000);if(frames.current.length===210){const a=frames.current.slice(30).sort((a,b)=>a-b);gl.domElement.dataset.metrics=JSON.stringify({medianMs:a[90],p95Ms:a[171],triangles:gl.info.render.triangles,drawCalls:gl.info.render.calls,geometries:gl.info.memory.geometries})}}gl.info.reset();});
 return <><hemisphereLight args={['#fff2e1','#a99daf',.8]}/><directionalLight position={[-3,4,5]} color="#fff0dc" intensity={1.8}/><directionalLight position={[3,1,3]} color="#e4ddf6" intensity={.7}/><directionalLight position={[1,3,-3]} color="#f4e8ff" intensity={1.1}/><ContactShadow/></>;
}
export function PremiumCharacter({appearance,size,reduced,expression='Neutral',interactive=true,view=0,room=false,onTouch,onRelease,interaction='touch'}:{appearance:Appearance;size:number;reduced:boolean;expression?:Expression;interactive?:boolean;view?:number;room?:boolean;onTouch?:()=>void;onRelease?:()=>void;interaction?:'touch'|'rotate'}){
 const rendered=useDeferredValue(appearance);
 const [loadedBody,setLoadedBody]=useState<Candidate|null>(null);
 const touch=useRef<TouchState>({held:false,x:0,y:0});
 const rotation=useRef<T.Group>(null),drag=useRef<{x:number;y:number;angle:number}|null>(null);
 const [reset,setReset]=useState(0),[reaction,setReaction]=useState(0),[pressed,setPressed]=useState(false);
 return <div className="premium-render" style={{width:size,height:size}} tabIndex={interactive?0:-1} role="img" aria-label={interaction==='touch'?'3D 캐릭터. 누르고 끌어 말랑하게 만지기':'3D 캐릭터. 드래그로 회전'} onDoubleClick={()=>{setReset(n=>n+1);if(rotation.current)rotation.current.rotation.y=0}} onKeyDown={e=>{if(interactive&&e.code==='Space'){e.preventDefault();setReaction(n=>n+1)}}} onPointerMove={e=>{if(drag.current){if(interaction==='rotate'&&rotation.current)rotation.current.rotation.y=drag.current.angle+(e.clientX-drag.current.x)*.009;else{touch.current.x=T.MathUtils.clamp((e.clientX-drag.current.x)/180,-.65,.65);touch.current.y=T.MathUtils.clamp((e.clientY-drag.current.y)/180,-.9,.6)}}}} onPointerDown={e=>{if(interactive){touch.current={held:interaction==='touch',x:0,y:0};drag.current={x:e.clientX,y:e.clientY,angle:rotation.current?.rotation.y||0};e.currentTarget.setPointerCapture(e.pointerId);setReaction(n=>n+1);setPressed(true);onTouch?.()}}} onPointerUp={()=>{drag.current=null;touch.current.held=false;setPressed(false);onRelease?.()}} onPointerCancel={()=>{drag.current=null;touch.current.held=false;setPressed(false);onRelease?.()}} onPointerLeave={()=>{if(!drag.current)setPressed(false);onRelease?.()}}>
 <Canvas dpr={[1,1.5]} camera={{position:[0,.15,5.6],fov:32}} gl={{antialias:true,alpha:true,toneMapping:T.ACESFilmicToneMapping}}><Suspense fallback={null}><group ref={rotation}><Creature a={rendered} expression={pressed?'Curious':expression} reduced={reduced} reaction={reaction} onReady={setLoadedBody} touch={touch}/></group></Suspense>{room&&<Environment/>}<Rig interactive={interactive} view={view} reset={reset} room={room} ready={loadedBody===bodyCandidate[rendered.body]} measurementKey={JSON.stringify(rendered)}/></Canvas></div>;
}
