import ts from 'typescript';import fs from 'node:fs';
export function compileBank(){
 const root=process.cwd();
 for(const [file,out,json,name] of [['factual','/tmp/factual-check.mjs','facts','groups'],['quantitative','/tmp/quantitative-check.mjs',null,null],['bank','/tmp/bank-check.mjs','core','core']]){
 let src=fs.readFileSync(root+'/lib/'+file+'.ts','utf8');
 if(json)src=src.replace(`import ${name} from './${json}.json';`,'const '+name+'='+fs.readFileSync(root+'/lib/'+json+'.json','utf8')+';');
 src=src.replace("from './factual'","from '/tmp/factual-check.mjs'").replace("from './quantitative'","from '/tmp/quantitative-check.mjs'");
 fs.writeFileSync(out,ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 return '/tmp/bank-check.mjs';
}
