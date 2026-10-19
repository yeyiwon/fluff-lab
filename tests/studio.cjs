const assert=require('node:assert/strict');
const {defaults,validate,ranges}=require('../.studio-build/parameters.js');
const {skin,guides,furGeometry}=require('../.studio-build/procedural.js');
const {candidates,distance,frontDepth}=require('../.studio-build/shape.js');
assert.equal(validate({eyeSize:Infinity}).eyeSize,defaults.eyeSize);
assert.equal(validate({furDensity:-4}).furDensity,8000);
function components(mesh){const a=mesh.attributes.position,parents=[],ids=new Map();const find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));const index=i=>{const key=[a.getX(i),a.getY(i),a.getZ(i)].map(n=>Math.round(n*1e5)).join(',');if(!ids.has(key)){ids.set(key,parents.length);parents.push(parents.length)}return ids.get(key)};for(let i=0;i<a.count;i+=3){const v=[index(i),index(i+1),index(i+2)];parents[find(v[1])]=find(v[0]);parents[find(v[2])]=find(v[0]);}return new Set(parents.map((_,i)=>find(i))).size;}
const signatures=[];
for(const c of candidates){
 const p={...defaults,furDensity:8000},body=skin(p,c),g=guides(p,c,body),fur=furGeometry(p,c,body);
 assert.equal(components(body),1,`${c} must be one connected body including all limbs`);
 for(const geometry of [body,fur])for(const attribute of Object.values(geometry.attributes))assert.ok(Array.from(attribute.array).every(Number.isFinite));
 for(let i=0;i<g.lengths.length;i+=53){const [x,y,z]=g.roots.slice(i*3,i*3+3);assert.ok(Math.abs(distance(x,y,z,p,c))<.025,'Fur roots must follow the actual continuous skin');}
 const z=frontDepth(p.eyeSpacing/2,p.eyeHeight,p,c);assert.ok(Math.abs(distance(p.eyeSpacing/2,p.eyeHeight,z,p,c))<.001,'Eyes must sit on front surface');
 assert.deepEqual([...new Set(g.layers)].sort(),[0,1,2]);assert.equal(fur.instanceCount,p.furDensity);signatures.push(body.attributes.position.count);
 assert.deepEqual(guides(p,c,body),g);body.dispose();fur.dispose();
}
assert.equal(new Set(signatures).size,3,'Three different geometries');
for(const bound of [0,1]){const p={...defaults};for(const k in ranges)p[k]=ranges[k][bound];const body=skin(p,'messy');assert.ok(Array.from(body.attributes.position.array).every(Number.isFinite));assert.ok(body.boundingSphere.radius<3);assert.equal(components(body),1,'Bounded limb controls must keep body connected');body.dispose();}
console.log('PASS: invalid data, three shapes, surface-attached groom/eyes, three layers, deterministic guides, extremes');
