import {buildMaterialVisuals,checkMaterialVisuals} from './material-visuals.mjs';
const args=process.argv.slice(2);
if(args.some(a=>a!=='--check'))throw Error('Only --check is supported');
const receipt=args.includes('--check')?checkMaterialVisuals():buildMaterialVisuals();
console.log(`SRM 126c material visuals ${args.includes('--check')?'checked':'generated'}: ${receipt.artifacts.length} source-bound artifacts; PARTIAL composition; no standalone-panel credit.`);
