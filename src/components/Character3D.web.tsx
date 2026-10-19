import React,{memo,useEffect,useRef,useState} from 'react';
import type {Appearance} from '../engine/appearance';
import {CreatureScene} from '../engine/three/CreatureScene';
type Props={appearance:Appearance;size:number;reduced:boolean;onTouch?:()=>void;onRelease?:()=>void;interactive?:boolean};
export const Character=memo(function Character3D({appearance,size,reduced,onTouch,onRelease,interactive=true}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<CreatureScene|null>(null);
 const current=useRef({appearance,size,reduced,onTouch,onRelease});current.current={appearance,size,reduced,onTouch,onRelease};
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;let scene:CreatureScene;
  try{scene=new CreatureScene(element,current.current.appearance,!interactive);scene.resize(current.current.size);engine.current=scene}catch{setFailed(true);return}
  let last=performance.now(),id=0,pointer:number|null=null,origin={x:0,y:0};let lost=false;
  const samples:number[]=[];let frames=0;const inspect=new URLSearchParams(location.search).has('inspect');
  const tick=(now:number)=>{if(!document.hidden&&!lost){const dt=(now-last)/1000;scene.reduced=current.current.reduced;scene.frame(dt);if(inspect){if(frames>30&&samples.length<360)samples.push(dt*1000);if(samples.length===360&&frames===390){const sorted=[...samples].sort((a,b)=>a-b);element.dataset.metrics=JSON.stringify({...scene.stats(),frames:360,medianMs:+sorted[180].toFixed(2),p95Ms:+sorted[342].toFixed(2),over33ms:samples.filter(v=>v>33.4).length});}frames++;}}last=now;id=requestAnimationFrame(tick)};id=requestAnimationFrame(tick);
  const position=(e:PointerEvent)=>{const r=element.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2}};
  const down=(e:PointerEvent)=>{if(!interactive||pointer!==null||e.button!==0)return;const p=position(e);if(!scene.hit(p.x,p.y))return;e.preventDefault();pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};element.setPointerCapture(pointer);scene.down();current.current.onTouch?.()};
  const move=(e:PointerEvent)=>{const p=position(e);scene.look(p.x,p.y);if(pointer!==e.pointerId)return;scene.drag((e.clientX-origin.x)/current.current.size*3,-(e.clientY-origin.y)/current.current.size*3)};
  const release=()=>{if(pointer===null)return;const old=pointer;pointer=null;if(element.hasPointerCapture(old))element.releasePointerCapture(old);scene.release();current.current.onRelease?.()};
  const end=(e:PointerEvent)=>{if(pointer===e.pointerId)release()};
  const visibility=()=>{last=performance.now();if(document.hidden)release()};
  const contextLost=(e:Event)=>{e.preventDefault();lost=true;scene.loseContext(true);release();setFailed(true)};
  const keyboard=(e:KeyboardEvent)=>{if(!interactive||e.repeat)return;if(e.code==='Space'){e.preventDefault();scene.down();current.current.onTouch?.()}};
  const keyup=(e:KeyboardEvent)=>{if(e.code==='Space'){scene.release();current.current.onRelease?.()}};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',end);element.addEventListener('keydown',keyboard);element.addEventListener('keyup',keyup);element.addEventListener('blur',release);element.addEventListener('webglcontextlost',contextLost);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(id);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',end);element.removeEventListener('keydown',keyboard);element.removeEventListener('keyup',keyup);element.removeEventListener('blur',release);element.removeEventListener('webglcontextlost',contextLost);document.removeEventListener('visibilitychange',visibility);scene.dispose();engine.current=null};
 },[interactive]);
 useEffect(()=>engine.current?.update(appearance),[appearance]);
 useEffect(()=>engine.current?.resize(size),[size]);
 return <div style={{width:size,height:size,position:'relative'}}>{failed?<div className="graphics-error" role="alert">3D 그래픽을 사용할 수 없습니다.<button onClick={()=>location.reload()}>다시 불러오기</button></div>:null}<canvas ref={canvas} width={size} height={size} style={{width:size,height:size,display:'block',touchAction:'none'}} tabIndex={interactive?0:-1} role="img" aria-label="실시간 3D 털복숭이. 누르고 끌었다 놓거나 Space로 눌러보세요."/></div>;
});
