import {useEffect,useState} from 'react';
// Opt-in diagnostics. No telemetry leaves the browser; not part of normal UI.
export function useFrameProbe(){
 const [result,setResult]=useState('');
 useEffect(()=>{if(!new URLSearchParams(location.search).has('inspect'))return;let id=0,last=0;const samples:number[]=[];const tick=(time:number)=>{if(document.hidden){last=0;id=requestAnimationFrame(tick);return}if(last)samples.push(time-last);last=time;if(samples.length<360){id=requestAnimationFrame(tick);return}const sorted=[...samples].sort((a,b)=>a-b);setResult(JSON.stringify({frames:samples.length,medianMs:+sorted[180].toFixed(2),p95Ms:+sorted[342].toFixed(2),over33ms:samples.filter(v=>v>33.4).length,kind:'browser rAF cadence, not GPU timing'}));};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id)},[]);
 return result;
}
