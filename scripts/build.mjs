import {mkdir,cp,rm,readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of ['index.html','analysis.html','compare.html','css','js'])await cp(new URL(name,root),new URL(name,dist),{recursive:true});
await mkdir(new URL('data/snapshots/',dist),{recursive:true});
for(const name of ['data/metadata.json','data/regions.json'])await cp(new URL(name,root),new URL(name,dist));
const meta=JSON.parse(await readFile(new URL('data/metadata.json',root),'utf8'));
for(const r of meta.regions)await cp(new URL(r.file,root),new URL(r.file,dist));
console.log('Static build: dist (no scripts, secrets, or dependencies)');
