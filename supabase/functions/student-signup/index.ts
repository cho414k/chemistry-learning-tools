const origins=new Set(['https://mongle-gas-cafe.vercel.app','https://cho414k.github.io']);
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://mongle-gas-cafe.vercel.app','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'허용하지 않은 사이트입니다.'});
 if(req.method!=='POST')return reply(405,{error:'POST 요청이 필요합니다.'});
 try {
  const raw=await req.text();if(raw.length>2048)return reply(413,{error:'입력이 너무 깁니다.'});
  const {username,password}=JSON.parse(raw);
  if(typeof username!=='string'||!/^[-a-z0-9_]{4,20}$/.test(username)||typeof password!=='string'||password.length<8||password.length>72)return reply(400,{error:'아이디는 영문 소문자·숫자·_·- 4~20자, 비밀번호는 8~72자입니다.'});
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),url=Deno.env.get('SUPABASE_URL');
  const adminHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+ip));
  const bucket=Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,'0')).join('');
  const quota=await fetch(url+'/rest/v1/rpc/consume_signup_quota',{method:'POST',headers:adminHeaders,body:JSON.stringify({bucket_key:bucket})});
  if(!quota.ok)return reply(503,{error:'잠시 후 다시 시도해 주세요.'});
  if(await quota.json()!==true)return reply(429,{error:'가입 요청이 많습니다. 잠시 후 다시 시도하거나 담당 교사에게 문의하세요.'});
  const result=await fetch(url+'/auth/v1/admin/users',{method:'POST',headers:adminHeaders,body:JSON.stringify({email:username+'@students.mongle.invalid',password,email_confirm:true})});
  if(!result.ok)return reply(400,{error:'가입할 수 없습니다. 다른 아이디를 사용하거나 담당 교사에게 문의하세요.'});
  return reply(201,{ok:true});
 }catch{return reply(400,{error:'입력 내용을 확인해 주세요.'});}
});
