import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDiary} from './diary-store.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const diary=openDiary(path.join(root,'local-data','diary.sqlite'));
const allowed=new Set(['index.html','style.css','app.js','data.js','engine.js']);
const port=Number(process.env.PORT||4180);
http.createServer(async(req,res)=>{
  const host=req.headers.host;
  if(!host||!/^127\.0\.0\.1:\d+$/.test(host)){res.writeHead(403);return res.end('Forbidden host');}
  const apiPath=new URL(req.url,'http://localhost').pathname;
  if(apiPath==='/api/diary'||apiPath.startsWith('/api/diary/')){
    const reply=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    if(req.headers.origin&&req.headers.origin!==`http://${host}`)return reply(403,{error:'다른 사이트에서는 접근할 수 없습니다.'});
    const match=/^\/api\/diary\/([1-9]\d*)$/.exec(apiPath),id=match?Number(match[1]):null;
    if(apiPath!=='/api/diary'&&!match)return reply(404,{error:'잘못된 경로입니다.'});
    try{
      if(req.method==='GET'&&!id)return reply(200,diary.list());
      if(req.method==='DELETE'&&id)return diary.remove(id)?reply(200,{ok:true}):reply(404,{error:'일기를 찾을 수 없습니다.'});
      if((req.method==='POST'&&!id)||(req.method==='PUT'&&id)){
        if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'JSON 요청이 필요합니다.'});
        let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>700000)return reply(413,{error:'일기 내용이 너무 큽니다.'});raw+=chunk;}
        let input;try{input=JSON.parse(raw);}catch{return reply(400,{error:'잘못된 JSON입니다.'});}
        if(!input||typeof input!=='object')return reply(400,{error:'일기 내용을 확인해 주세요.'});
        return reply(id?200:201,diary.save(input,id));
      }
      return reply(405,{error:'지원하지 않는 요청입니다.'});
    }catch(error){return reply(error.status||500,{error:error.status?error.message:'저장소 처리에 실패했습니다. 디스크 공간과 폴더 권한을 확인해 주세요.'});}
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);return res.end('Bad request');}
  if(name==='pdf-counter'){res.writeHead(302,{'Location':'/pdf-counter/'});return res.end();}
  if(name==='gas-cafe'){res.writeHead(302,{'Location':'/gas-cafe/'});return res.end();}
  if(name==='diary'){res.writeHead(302,{'Location':'/diary/'});return res.end();}
  if(name==='diary/')name+='index.html';
  const diaryAsset=/^diary\/(index\.html|style\.css|app\.js)$/.test(name);
  if(name==='gas-cafe/')name+='index.html';
  const gasAsset=/^gas-cafe\/(index\.html|style\.css|game\.js)$/.test(name);
  if(name==='pdf-counter/')name+='index.html';
  const pdfAsset=/^pdf-counter\/(index\.html|style\.css|app\.js|count\.js|vendor\/(pdf\.mjs|pdf\.worker\.mjs|LICENSE|(?:cmaps|standard_fonts)\/[a-zA-Z0-9_.-]+))$/.test(name);
  if(!allowed.has(name)&&!pdfAsset&&!gasAsset&&!diaryAsset){res.writeHead(404);return res.end('Not found');}
  try{const data=await readFile(path.join(root,name));const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8'}[path.extname(name)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));

