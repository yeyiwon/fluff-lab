import Storage from 'expo-sqlite/kv-store';
export const storage={read:()=>Storage.getItemSync('fluff-lab:v1'),write:(value:string)=>Storage.setItemSync('fluff-lab:v1',value)};
