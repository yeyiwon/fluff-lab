import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {Candidate,frontDepth} from '../studio/shape';
import {defaults} from '../studio/parameters';
import {EyeStyle,Expression,faceShape} from './design';

function EyeSurface({style}:{style:EyeStyle}){
 const polished=style==='glossy'||style==='sparkle',rim=style==='wide'||style==='curious';
 return <group><mesh scale={[.044,.055,polished?.044:.035]}><sphereGeometry args={[1,40,28]}/><meshPhysicalMaterial color={style==='oval'?'#231c1a':style==='wide'?'#ddd3c5':'#100d10'} roughness={polished?.075:style==='oval'?.65:.34} clearcoat={polished?1:.2} clearcoatRoughness={.06} specularIntensity={polished?1:.45} envMapIntensity={polished?1.8:.6}/></mesh>
 {rim&&<mesh position={[0,0,.028]} scale={[style==='wide'?.027:.033,.037,.018]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial color={style==='curious'?'#31271f':'#151018'} roughness={.18} clearcoat={1} envMapIntensity={1.3}/></mesh>}
 {style==='sparkle'&&<><mesh position={[-.012,.018,.038]} scale={[1,1.2,.55]}><sphereGeometry args={[.008,16,12]}/><meshPhysicalMaterial color="#fff9ed" roughness={.1} emissive="#fff8eb" emissiveIntensity={.15}/></mesh><mesh position={[.012,-.015,.038]}><sphereGeometry args={[.0035,12,8]}/><meshStandardMaterial color="#fff7ed" roughness={.1}/></mesh></>}
 </group>;
}
export function Face({candidate,style,expression,reduced=false,eyeScale=1}:{candidate:Candidate;style:EyeStyle;expression:Expression;reduced?:boolean;eyeScale?:number}){
 const group=useRef<T.Group>(null),current=useRef(faceShape(style,expression)),previous=useRef(style),blinkStart=useRef(-10);
 // A broad, shallow eyelid with rounded ends, rather than a pointed chevron.
 const arc=useMemo(()=>new T.CatmullRomCurve3([new T.Vector3(-.052,0,0),new T.Vector3(-.033,.015,.004),new T.Vector3(0,.022,.007),new T.Vector3(.033,.015,.004),new T.Vector3(.052,0,0)]),[]);
 useFrame(({clock},dt)=>{
  const t=clock.elapsedTime;if(previous.current!==style){previous.current=style;blinkStart.current=t}
  const target=faceShape(style,expression),f=current.current,k=reduced?1:1-Math.exp(-dt*12);
  for(const key of Object.keys(f) as (keyof typeof f)[])f[key]=T.MathUtils.lerp(f[key],target[key],k);
  const local=t-blinkStart.current,phase=t%6.8;
  const blink=reduced?1:local<.28?1-Math.sin(local/.28*Math.PI)*.94:phase>6.2?1-Math.sin((phase-6.2)/.6*Math.PI)*.94:1;
  group.current?.children.forEach((o,i)=>{
   const s=i===0?-1:1,x=s*.26+f.gaze,y=-.08+s*f.asymmetry+(style==='shy'?-.025:0);
   o.position.set(x,y,frontDepth(x,y,defaults,candidate)+.03);o.rotation.set(0,s*.12,s*f.tilt);
   o.scale.lerp(new T.Vector3(eyeScale,eyeScale,eyeScale),k);
   const bean=o.children[0],curve=o.children[1];bean.scale.set(f.width,f.height*blink*(1-f.arc*.95),1);curve.scale.set(f.width/1.3,Math.max(.01,f.arc)*blink,1);curve.visible=f.arc>.01;
  });
 });
 return <group ref={group}>{[-1,1].map(s=><group key={s}><group><EyeSurface style={style}/></group><mesh><tubeGeometry args={[arc,32,.009,10,false]}/><meshPhysicalMaterial color="#171019" roughness={.5} clearcoat={.15}/></mesh></group>)}</group>;
}
