const fs=require('node:fs');
const {defaults}=require('../../.studio-build/parameters.js');
const {skin,guides}=require('../../.studio-build/procedural.js');
const {candidates}=require('../../.studio-build/shape.js');
fs.mkdirSync('.studio-build',{recursive:true});
for(const candidate of candidates){
 const mesh=skin(defaults,candidate);
 fs.writeFileSync(`.studio-build/${candidate}.json`,JSON.stringify({candidate,parameters:defaults,guides:guides(defaults,candidate,mesh),positions:Array.from(mesh.attributes.position.array),normals:Array.from(mesh.attributes.normal.array),indices:Array.from({length:mesh.attributes.position.count},(_,i)=>i)}));
 console.log(`Wrote .studio-build/${candidate}.json: ${mesh.attributes.position.count/3} body triangles`);mesh.dispose();
}
