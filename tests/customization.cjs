const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--ignoreConfig','src/customization/design.ts','--outDir','.studio-build','--module','commonjs','--target','es2020','--skipLibCheck'],{stdio:'inherit'});
const {faceShape,eyeStyles,expressions}=require('../.studio-build/customization/design.js');
const {validate}=require('../.studio-build/engine/appearance.js');
for(const eye of eyeStyles){assert.equal(validate({eye}).eye,eye);for(const expression of expressions){const f=faceShape(eye,expression);for(const v of Object.values(f))assert.ok(Number.isFinite(v));assert.ok(f.width<2.1&&f.height>0&&f.height<1.8)}}
for(const detail of ['ribbon','glasses','flower','beanie','headphones','star','crown'])assert.equal(validate({detail}).detail,detail);
assert.equal(validate({eye:'invalid'}).eye,'bean');
const base=faceShape('derpy','Neutral');faceShape('derpy','Happy');assert.deepEqual(faceShape('derpy','Neutral'),base);
assert.notDeepEqual(faceShape('bean','Neutral'),faceShape('round','Neutral'));
assert.equal(faceShape('bean','Happy').arc,1);assert.ok(faceShape('bean','Blink').height<.1);
console.log('Customization schema, all style/expression combinations, and base-style isolation passed');

assert.equal(validate({eyeScale:Infinity}).eyeScale,1);assert.equal(validate({eyeScale:100}).eyeScale,1.5);assert.equal(validate({eyeScale:-1}).eyeScale,.75);assert.equal(validate({}).eyeScale,1);

assert.equal(validate({detailScale:Infinity}).detailScale,1);assert.equal(validate({detailScale:20}).detailScale,1.15);assert.equal(validate({detailOffset:-99}).detailOffset,-.06);assert.equal(validate({detailTone:'invalid'}).detailTone,'original');assert.equal(validate({detailTone:'pink',detailOffset:.10}).detailTone,'pink');
