import React,{memo,useEffect,useMemo} from 'react';
import {AppState,View} from 'react-native';
import {Canvas,Group,Path,Oval,Circle,LinearGradient,RadialGradient,BlurMask,vec} from '@shopify/react-native-skia';
import {useSharedValue,useDerivedValue,useFrameCallback,withSpring,withTiming,withSequence} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import {Appearance,palette} from '../engine/appearance';
import {bodyPath,furGeometry,mixColor} from '../engine/geometry';
import {motion} from '../design/tokens';

type Props={appearance:Appearance;size:number;reduced:boolean;onTouch?:()=>void;onRelease?:()=>void;interactive?:boolean};
export const Character=memo(function Character({appearance:a,size,reduced,onTouch,onRelease,interactive=true}:Props){
 const geometry=useMemo(()=>furGeometry(a),[a.body,a.fur,a.seed]);const body=useMemo(()=>bodyPath(a.body),[a.body]);const shades=palette[a.tone];
 const clock=useSharedValue(0),active=useSharedValue(true),squash=useSharedValue(1),dx=useSharedValue(0),dy=useSharedValue(0),blink=useSharedValue(1),shiver=useSharedValue(0);
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>{active.value=s==='active'});return()=>sub.remove()},[active]);
 useFrameCallback(frame=>{if(active.value)clock.value+=(frame.timeSincePreviousFrame??16)/1000});
 useEffect(()=>{blink.value=withSequence(withTiming(.08,{duration:65}),withTiming(1,{duration:150}))},[a.eye,blink]);
 useEffect(()=>{if(!reduced)shiver.value=withSequence(withTiming(1,{duration:90}),withTiming(-1,{duration:90}),withTiming(0,{duration:120}))},[a.fur,reduced,shiver]);
 useEffect(()=>{squash.value=withSpring(1,motion.spring)},[a.body,squash]);
 const transform=useDerivedValue(()=>{const breath=reduced?0:Math.sin(clock.value*1.8)*.014;const tilt=reduced?0:Math.sin(clock.value*(a.body==='blob'?1.3:1.1))*.025+shiver.value*.04;return[{translateX:size/2+dx.value},{translateY:size*.48+dy.value},{scale:size/300},{rotate:tilt},{scaleX:2-squash.value-breath},{scaleY:squash.value+breath}]});
 const furTransform=useDerivedValue(()=>[{rotate:reduced?0:Math.sin(clock.value*1.8-.5)*.008+shiver.value*.025}] );
 const eyeScale=useDerivedValue(()=>[{scaleY:blink.value*(clock.value%4.9<.13?.12:1)}]);
 const look=useDerivedValue(()=>[{translateX:reduced?0:Math.sin(clock.value*.7)*1.4}]);
 const gesture=useMemo(()=>Gesture.Pan().minDistance(0).onBegin(()=>{squash.value=withTiming(motion.pressScale,{duration:110});if(onTouch)scheduleOnRN(onTouch)}).onUpdate(e=>{dx.value=Math.max(-size*.18,Math.min(size*.18,e.translationX));dy.value=Math.max(-size*.14,Math.min(size*.14,e.translationY));if(Math.hypot(e.translationX,e.translationY)>10)squash.value=withTiming(1.06,{duration:120})}).onFinalize(()=>{dx.value=withSpring(0,motion.spring);dy.value=withSpring(0,motion.spring);squash.value=withSpring(1,motion.spring);if(onRelease)scheduleOnRN(onRelease)}),[size,onTouch,onRelease,dx,dy,squash]);
 const faceY=a.body==='dumpling'?10:5;
 const fiberColors=useMemo(()=>Array.from({length:6},(_,i)=>mixColor(shades[2],shades[0],.20+i*.16)),[shades]);
 const drawing=<Canvas style={{width:size,height:size}}>
 <Oval x={size*.23} y={size*.735} width={size*.54} height={size*.07} color="#00000088"><BlurMask blur={8} style="normal"/></Oval>
 <Group transform={transform}>
 <Oval x={-45} y={67} width={25} height={20}><LinearGradient start={vec(-30,65)} end={vec(-30,87)} colors={[shades[0],shades[2]]}/></Oval>
 <Oval x={22} y={68} width={25} height={20}><LinearGradient start={vec(30,65)} end={vec(30,88)} colors={[shades[0],shades[2]]}/></Oval>
 <Group transform={furTransform}>{geometry.edge.map((p,i)=><Path key={i} path={p} style="stroke" strokeWidth={i===0?1.8:.65} strokeCap="round" color={i===0?shades[1]:shades[0]} opacity={i===0?.5:.8}/>)}</Group>
 <Path path={body}><RadialGradient c={vec(-28,-36)} r={145} colors={[shades[0],shades[1],shades[2]]} positions={[0,.6,1]}/></Path>
 <Group transform={furTransform}>{geometry.layers.map((layer,band)=><Group key={band}>{layer.map((p,i)=><Path key={i} path={p} style="stroke" strokeWidth={a.fur==='short'?.65:.85} strokeCap="round" color={fiberColors[i]}/>)}</Group>)}</Group>
 <Group opacity={.45}>{geometry.inner.map((p,i)=><Path key={i} path={p} style="stroke" strokeWidth={.28} strokeCap="round" color={shades[0]}/>)}</Group>
 <Group transform={furTransform}>{Array.from({length:16},(_,i)=><Path key={i} path={`M ${-12+i*.9} -72 Q ${-20+i*.8} ${-98-i*.18} ${4+i*.65} ${-92+i*.2}`} color={i%3===0?shades[1]:shades[0]} style="stroke" strokeWidth={.55} strokeCap="round"/>)}</Group>
 <Oval x={-39} y={77} width={16} height={11}><LinearGradient start={vec(-34,76)} end={vec(-31,88)} colors={[shades[0],shades[1],shades[2]]}/></Oval>
 <Oval x={25} y={77} width={16} height={11}><LinearGradient start={vec(30,76)} end={vec(33,88)} colors={[shades[0],shades[1],shades[2]]}/></Oval>
 <Group transform={look}>{[-1,1].map((side)=><Group key={side} origin={vec(side*25,faceY)} transform={eyeScale}>{a.eye==='sleepy'?<Path path={`M ${side*25-4} ${faceY} q 4 2 8 0`} color="#27252a" style="stroke" strokeWidth={4} strokeCap="round"/>:<Oval x={side*25-4.5} y={faceY-5+(a.eye==='derpy'&&side===1?4:0)} width={a.eye==='round'?8:6.8} height={a.eye==='round'?8:8.5} color="#29272a"/>}<Circle cx={side*25-1.5} cy={faceY-3} r={.75} color="#ffffff77"/></Group>)}</Group>

 {a.detail==='star'?<Path path="M 57 -67 L 60 -59 L 69 -59 L 62 -53 L 65 -44 L 57 -49 L 49 -44 L 51 -53 L 45 -59 L 54 -59 Z" color="#c6ff4d"/>:a.detail==='ribbon'?<><Path path="M 40 -68 Q 18 -87 28 -59 L 43 -62 Q 66 -42 63 -70 Z" color="#b6a8ff"/><Circle cx={43} cy={-63} r={5} color="#d5caff"/></>:a.detail==='horn'?<Path path="M 32 -82 Q 28 -112 49 -92 L 55 -74 Z" color={shades[1]}/>:null}
 </Group></Canvas>;
 return interactive?<GestureDetector gesture={gesture}><View accessible accessibilityLabel="털복숭이 캐릭터. 누르고 끌었다 놓아 보세요." accessibilityRole="image">{drawing}</View></GestureDetector>:drawing;
});
