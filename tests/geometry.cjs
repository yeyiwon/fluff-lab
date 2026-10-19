const assert=require('node:assert/strict');const {initial,validate,bodies,furs}=require('./appearance.js');const {furGeometry,bodyPath}=require('./geometry.js');
assert.deepEqual(furGeometry(initial),furGeometry(initial));assert.notDeepEqual(furGeometry(initial),furGeometry({...initial,seed:1}));
assert.deepEqual(validate({body:'not-real',seed:-1}),initial);assert.equal(validate({...initial,tone:'pink'}).tone,'pink');
assert.equal(new Set(bodies.map(bodyPath)).size,3);
for(const body of bodies)for(const fur of furs){const g=furGeometry({...initial,body,fur});assert(!JSON.stringify(g).match(/NaN|Infinity/));assert(g.edge.every(p=>p.length>0));}
console.log('PASS: deterministic seed, seed variation, validation, three silhouettes, nine finite fur/body combinations');
