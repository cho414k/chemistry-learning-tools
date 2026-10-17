import {mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('pages-site');
await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','app.js','data.js','engine.js'])await copyFile(`enthalpy-hub/${file}`,`${out}/${file}`);
for(const dir of ['pdf-counter','gas-cafe'])await cp(`enthalpy-hub/${dir}`,`${out}/${dir}`,{recursive:true});
await cp('chemistry-portal/dist',`${out}/chemistry-games`,{recursive:true});
await writeFile(`${out}/.nojekyll`,'');
console.log('Pages artifact: only hub, games and browser PDF assets. No diary database or server.');
