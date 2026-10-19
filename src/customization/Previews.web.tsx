import React,{Suspense,useMemo,useId} from 'react';
import {Canvas} from '@react-three/fiber';
import {AccessoryModel,Accessory} from './Accessories.web';
import {EyeStyle,Expression,faceShape,bodyCandidate} from './design';
import {distance} from '../studio/shape';
import {defaults} from '../studio/parameters';
import {Appearance} from '../engine/appearance';
export function EyePreview({style='bean',expression='Neutral'}:{style?:EyeStyle;expression?:Expression}){
 const f=faceShape(style,expression),id=useId().replace(/:/g,''),polished=style==='glossy'||style==='sparkle';return <svg viewBox="0 0 80 48" width="66" height="48" aria-hidden="true"><defs><radialGradient id={id} cx="25%" cy="20%"><stop stopColor="#fff"/><stop offset=".25" stopColor="#bdb6d0"/><stop offset=".6" stopColor="#50485c"/><stop offset="1" stopColor="#29242e"/></radialGradient></defs>{[-1,1].map(s=><g key={s} transform={`translate(${40+s*17},${25+s*f.asymmetry*200}) rotate(${s*f.tilt*57})`}>{f.arc?<path d="M -7 2 C -5 -3 5 -3 7 2" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/>:<ellipse rx={3.8*f.width} ry={5*f.height} fill={polished?`url(#${id})`:'currentColor'} stroke={polished?'#c8c0d3':'none'} strokeWidth=".5"/>}{(style==='wide'||style==='curious')&&<ellipse rx={style==='wide'?3:2.5} ry="3.7" fill="#24202c"/>}{style==='sparkle'&&!f.arc&&<><circle cx="-1.5" cy="-2" r="1.2" fill="#fff"/><circle cx="1.3" cy="2" r=".65" fill="#fff"/></>}</g>)}</svg>;
}
export function DetailPreview({kind}:{kind:Accessory}){
 if(kind==='none')return <svg viewBox="0 0 60 60" width="50" height="50" aria-hidden="true"><circle cx="30" cy="30" r="13" fill="none" stroke="currentColor" opacity=".3"/><path d="m20 40 20-20" stroke="currentColor"/></svg>;
 return <div style={{width:72,height:60,pointerEvents:'none'}} aria-hidden="true"><Canvas frameloop="demand" dpr={1} camera={{position:[0,0,kind==='headphones'?4:kind==='glasses'?1.4:kind==='beanie'||kind==='crown'?1.2:.8],fov:34}}><ambientLight intensity={1.8}/><directionalLight position={[-2,3,4]} intensity={3}/><Suspense fallback={null}><AccessoryModel kind={kind}/></Suspense></Canvas></div>;
}

export function BodyPreview({body}:{body:Appearance['body']}){
 const id=useId().replace(/:/g,''),path=useMemo(()=>{const c=bodyCandidate[body],points=[];for(let i=0;i<100;i++){const t=i/100*Math.PI*2;let lo=0,hi=1.5;for(let n=0;n<18;n++){const r=(lo+hi)/2;if(distance(Math.cos(t)*r,Math.sin(t)*r,0,defaults,c)>0)hi=r;else lo=r}points.push(`${40+Math.cos(t)*lo*23},${31-Math.sin(t)*lo*23}`)}return 'M'+points.join(' L')+'Z'},[body]);
 return <svg width="66" height="60" viewBox="0 0 80 60" aria-hidden="true"><defs><radialGradient id={id} cx="30%" cy="15%" r="85%"><stop stopColor="#fff4df"/><stop offset="1" stopColor="#9f98aa"/></radialGradient></defs><path d={path} fill={`url(#${id})`}/><circle cx="34" cy="32" r="1.1" fill="#1b1920"/><circle cx="46" cy="32" r="1.1" fill="#1b1920"/></svg>;
}
export function FurPreview({fur}:{fur:Appearance['fur']}){
 return <span className={`fur-sample fur-${fur}`} aria-hidden="true"><img src="./studio/v02/review/mochi-front.png" alt=""/></span>;
}

export function DetailOptions({items,selected,onSelect,compact}:{items:readonly Accessory[];selected:string;onSelect:(value:Accessory)=>void;compact:boolean}){
 const step=compact?67:85,width=items.length*step-(compact?5:13),labels:Record<Accessory,string>={none:'장식 없음',ribbon:'리본',glasses:'둥근 안경',flower:'꽃 장식',beanie:'미니 비니',headphones:'미니 헤드폰',star:'별',crown:'작은 왕관'};
 return <div className="option-strip options-detail" id="appearance-options" role="tabpanel" aria-label="DETAIL"><div className="detail-track" style={{width,minWidth:width,gap:compact?5:13}}><div className="detail-gallery" aria-hidden="true"><Canvas frameloop="demand" orthographic dpr={1} camera={{position:[0,0,100],zoom:1,near:.1,far:200}}><ambientLight intensity={1.3}/><directionalLight position={[-30,50,80]} intensity={2.5}/>{items.map((kind,i)=>{const scale=kind==='headphones'?24:kind==='glasses'?35:kind==='beanie'||kind==='crown'?80:110;return <group key={kind} position={[-width/2+i*step+(compact?62:72)/2,kind==='beanie'||kind==='crown'?-10:0,0]} scale={scale}><AccessoryModel kind={kind}/></group>})}</Canvas></div>{items.map(kind=><button key={kind} className={`preview-option ${selected===kind?'selected':''}`} aria-label={labels[kind]} aria-pressed={selected===kind} onClick={()=>onSelect(kind)}>{kind==='none'?<span aria-hidden="true">∅</span>:null}</button>)}</div></div>;
}
