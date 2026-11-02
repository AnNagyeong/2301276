import {mkdir,cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of ['index.html','analysis.html','compare.html','css','js'])await cp(new URL(name,root),new URL(name,dist),{recursive:true});
await mkdir(new URL('data/snapshots/',dist),{recursive:true});
for(const name of ['data/metadata.json','data/regions.json'])await cp(new URL(name,root),new URL(name,dist));
const meta=JSON.parse(await readFile(new URL('data/metadata.json',root),'utf8'));
for(const r of meta.regions)await cp(new URL(r.file,root),new URL(r.file,dist));
// Change asset URLs when source changes, including relative module dependencies.
const assets=['css/style.css',...(await readdir(new URL('js/',root))).filter(n=>n.endsWith('.js')).sort().map(n=>'js/'+n)];
const hash=createHash('sha256');for(const file of assets)hash.update(await readFile(new URL(file,root)));
const version=hash.digest('hex').slice(0,12);
for(const file of assets.filter(n=>n.endsWith('.js'))){const url=new URL(file,dist);const source=await readFile(url,'utf8');await writeFile(url,source.replace(/from '(\.\/[^']+\.js)'/g,`from '$1?v=${version}'`));}
for(const file of ['index.html','analysis.html','compare.html']){const url=new URL(file,dist);await writeFile(url,(await readFile(url,'utf8')).replaceAll('./css/style.css',`./css/style.css?v=${version}`).replace(/src="(\.\/js\/[^\"]+\.js)"/g,`src="$1?v=${version}"`));}
console.log('Static build: dist (no scripts, secrets, or dependencies)');
