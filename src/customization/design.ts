import {Appearance} from '../engine/appearance';
import {Candidate} from '../studio/shape';
export const eyeStyles=['bean','round','sparkle','glossy','sleepy','happy','curious','surprised','derpy','oval','shy','wide','unimpressed'] as const;
export type EyeStyle=typeof eyeStyles[number];
export const expressions=['Neutral','Happy','Sleepy','Curious','Surprised','Confused','Annoyed','Blink'] as const;
export type Expression=typeof expressions[number];
export const eyeLabels:Record<EyeStyle,string>={bean:'Classic Bean',round:'Big Round Eyes',sleepy:'Sleepy',derpy:'Derpy',sparkle:'Sparkling Eyes',happy:'Smiling Eyes',unimpressed:'Unimpressed',surprised:'Surprised Eyes',glossy:'Glossy Eyes',curious:'Curious Eyes',oval:'Soft Oval Eyes',shy:'Shy Eyes',wide:'Wide-Eyed Eyes'};
export const bodyCandidate:Record<Appearance['body'],Candidate>={dumpling:'mochi',poof:'potato',blob:'messy'};
export const coatColors:Record<Appearance['tone'],string>={cream:'#eee0cd',white:'#f4f2ee',charcoal:'#55565f',gray:'#a5a8b2',lavender:'#c4afd9',pink:'#e7b7c8'};
export type FaceShape={width:number;height:number;arc:number;asymmetry:number;tilt:number;gaze:number};
const base:FaceShape={width:1,height:1,arc:0,asymmetry:0,tilt:0,gaze:0};
export function faceShape(style:EyeStyle,expression:Expression):FaceShape{
 const f={...base};
 if(style==='round'){f.width=1.5;f.height=1.2}
 if(style==='sparkle'){f.width=1.3;f.height=1.22}
 if(style==='glossy'){f.width=1.06;f.height=1.3}
 if(style==='curious'){f.width=1.1;f.height=1.05;f.asymmetry=.018;f.gaze=.01}
 if(style==='oval'){f.width=.88;f.height=1.18}
 if(style==='shy'){f.width=.92;f.height=.72;f.tilt=.22;f.gaze=-.008}
 if(style==='wide'){f.width=1.42;f.height=1.18}
 if(style==='sleepy'){f.width=1.1;f.height=.42}
 if(style==='derpy')f.asymmetry=.022;
 if(style==='happy'){f.width=1.28;f.height=.17;f.arc=1}
 if(style==='unimpressed'){f.width=1.25;f.height=.22;f.tilt=-.12}
 if(style==='surprised'){f.width=1.22;f.height=1.03}
 if(expression==='Happy'){f.arc=1;f.height=.17;f.width=1.3}
 if(expression==='Sleepy'){f.height*=.38;f.tilt=.08}
 if(expression==='Curious'){f.asymmetry+=.012;f.gaze=.012;f.tilt=.12}
 if(expression==='Surprised'){f.width*=1.18;f.height*=1.2}
 if(expression==='Confused'){f.asymmetry+=.025;f.tilt=.22;f.gaze=-.008}
 if(expression==='Annoyed'){f.height*=.26;f.tilt=-.18}
 if(expression==='Blink')f.height=.07;
 return f;
}
