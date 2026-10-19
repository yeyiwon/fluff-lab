import {create} from 'zustand';
import {Appearance,initial,validate} from '../engine/appearance';
import {storage} from './storage';
type Lab={appearance:Appearance;saveError:boolean;reduced:boolean;hydrate:()=>void;change:(patch:Partial<Appearance>)=>void;setReduced:(value:boolean)=>void};
export const useLab=create<Lab>((set,get)=>({appearance:initial,saveError:false,reduced:false,hydrate:()=>{try{const raw=storage.read();if(raw){const parsed=JSON.parse(raw);if(parsed.version===1)set({appearance:validate(parsed.appearance)})}}catch{set({saveError:true})}},change:(patch)=>{const appearance=validate({...get().appearance,...patch});set({appearance});try{storage.write(JSON.stringify({version:1,appearance}));set({saveError:false})}catch{set({saveError:true})}},setReduced:reduced=>set({reduced})}));
