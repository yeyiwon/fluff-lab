import React, {useId,useMemo} from 'react';
import {Appearance,palette} from '../engine/appearance';
import {bodyPath,furGeometry} from '../engine/geometry';
export type Category='BODY'|'EYES'|'FUR'|'COLOR'|'DETAIL';
export function OptionPreview({category,value,appearance:a}:{category:Category;value:string;appearance:Appearance}) {
 const id=useId().replace(/:/g,'');
 const sample={...a,...(category==='BODY'?{body:value}:category==='FUR'?{fur:value}:{})} as Appearance;
 const shape=bodyPath(sample.body);
 const fur=useMemo(()=>furGeometry(sample),[sample.body,sample.fur,sample.seed]);
 if(category==='COLOR')return <span className="color-orb" style={{background:`radial-gradient(circle at 30% 23%, ${palette[value as Appearance['tone']][0]}, ${palette[value as Appearance['tone']][1]} 52%, ${palette[value as Appearance['tone']][2]})`}}/>;
 return <svg width="66" height="62" viewBox="-132 -125 264 250" aria-hidden="true"><defs><radialGradient id={id} cx="32%" cy="23%" r="80%"><stop stopColor="#fff4e4"/><stop offset=".6" stopColor="#d6c8c1"/><stop offset="1" stopColor="#847c89"/></radialGradient></defs>
 {category==='BODY'||category==='FUR'?<><path d={shape} fill={`url(#${id})`}/>{fur.edge.map((p,i)=><path key={i} d={p} fill="none" stroke={i===0?'#c1b7b1':'#efe5da'} strokeWidth={category==='FUR'?2:1.3}/>)}<path d={fur.inner[0]} fill="none" stroke="#fff5e5" strokeWidth="1" opacity=".5"/>{category==='BODY'?<><ellipse cx="-24" cy="10" rx="4" ry="5" fill="#28262a"/><ellipse cx="24" cy="10" rx="4" ry="5" fill="#28262a"/></>:null}</>:null}
 {category==='EYES'?<g fill="#eae7ee" stroke="#eae7ee" strokeWidth="5" strokeLinecap="round">{value==='sleepy'?<><path d="M -52 0 q 12 9 24 0" fill="none"/><path d="M 28 0 q 12 9 24 0" fill="none"/></>:<><ellipse cx="-40" cy="0" rx={value==='round'?9:7} ry={value==='round'?9:11}/><ellipse cx="40" cy={value==='derpy'?7:0} rx="7" ry={value==='round'?9:11}/></>}</g>:null}
 {category==='DETAIL'?value==='none'?<path d="M -24 24 L 24 -24" stroke="#a29dab" strokeWidth="5" strokeLinecap="round"/>:value==='star'?<path d="M 0 -42 L 13 -14 L 44 -11 L 20 10 L 26 40 L 0 25 L -26 40 L -20 10 L -44 -11 L -13 -14 Z" fill="url(#detail-star)" stroke="#e2e6b5" strokeWidth="2"/>:value==='ribbon'?<g fill="#c4b4de" stroke="#e0d4ee" strokeWidth="1.5"><path d="M -7 0 Q -65 -55 -48 16 Q -36 34 -7 0 M 7 0 Q 65 -55 48 16 Q 36 34 7 0"/><circle r="11"/></g>:<path d="M -25 32 Q -36 -60 24 -27 L 39 32 Z" fill={`url(#${id})`}/>:null}
 <defs><linearGradient id="detail-star"><stop stopColor="#f1f4bf"/><stop offset="1" stopColor="#9eaf68"/></linearGradient></defs></svg>;
}
