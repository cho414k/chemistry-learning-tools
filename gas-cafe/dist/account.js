import {SUPABASE_URL,SUPABASE_KEY,SIGNUP_GATEWAY_KEY} from './backend-config.js';
const byId=id=>document.getElementById(id);
let session=null,refreshing=null;
try{session=JSON.parse(sessionStorage.getItem('mongle-session')||'null');}catch{}
function remember(value){session=value;try{value?sessionStorage.setItem('mongle-session',JSON.stringify(value)):sessionStorage.removeItem('mongle-session');}catch{}}
function message(text){byId('account-status').textContent=text;}
async function request(route,options={},token=SUPABASE_KEY){
 const response=await fetch(SUPABASE_URL+route,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error_description||data?.error||data?.message||'서버에 연결하지 못했습니다.');
 return data;
}
async function fresh(){
 if(!session)throw new Error('로그인 후 저장할 수 있습니다.');
 if(session.expires_at*1000>Date.now()+60000)return session;
 if(!refreshing)refreshing=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})}).then(data=>{remember(data);return data;}).catch(error=>{remember(null);showAccount();throw error;}).finally(()=>{refreshing=null;});
 return refreshing;
}
async function history(){
 byId('learning-history').replaceChildren();if(!session)return;
 try{const current=await fresh();const rows=await request('/rest/v1/learning_runs?select=completed_at,first_correct,attempts,coins&order=completed_at.desc&limit=20',{},current.access_token);if(session?.user.id!==current.user.id)return;
 for(const row of rows){const item=document.createElement('li');item.textContent=`${new Date(row.completed_at).toLocaleString('ko-KR')} · 첫 시도 정답 ${row.first_correct}/5 · 시도 ${row.attempts}회 · ${row.coins}코인`;byId('learning-history').append(item);}
 if(!rows.length)byId('learning-history').textContent='아직 저장한 학습 기록이 없어요.';
 }catch{message('학습 기록을 불러오지 못했습니다. 다시 로그인해 주세요.');}
}
function showAccount(){byId('login-form').hidden=!!session;byId('signed-in').hidden=!session;byId('account-name').textContent=session?session.user.email.split('@')[0]:'';history();}
byId('login-form').onsubmit=async event=>{event.preventDefault();await authenticate(false);};
byId('signup').onclick=()=>authenticate(true);
async function authenticate(signup){
 const username=byId('username').value.trim().toLowerCase(),password=byId('password').value;
 if(!/^[-a-z0-9_]{4,20}$/.test(username)||password.length<8||password.length>72){message('아이디는 영문 소문자·숫자·_·- 4~20자, 비밀번호는 8~72자로 입력하세요.');return;}
 const controls=[...byId('login-form').querySelectorAll('input,button')];controls.forEach(e=>e.disabled=true);
 try{if(signup)await request('/functions/v1/student-signup',{method:'POST',headers:{apikey:SIGNUP_GATEWAY_KEY},body:JSON.stringify({username,password})},SIGNUP_GATEWAY_KEY);
 const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:username+'@students.mongle.invalid',password})});remember(data);byId('password').value='';showAccount();message(signup?'가입했습니다. 학습을 마치면 기록을 저장할 수 있어요.':'로그인했습니다.');if(pending){byId('save-status').textContent='로그인했습니다. 학습 기록 저장 버튼을 눌러 주세요.';byId('finish').showModal();}
 }catch{message(signup?'가입하지 못했습니다. 다른 아이디로 시도하거나 담당 교사에게 문의하세요.':'아이디 또는 비밀번호를 확인하세요. 비밀번호를 잊었다면 담당 교사에게 문의하세요.');}finally{controls.forEach(e=>e.disabled=false);}
}
byId('logout').onclick=async()=>{const token=session?.access_token;remember(null);pending=null;savedId=null;byId('save-learning').disabled=true;byId('save-status').textContent='로그아웃하여 저장 대기 중인 기록을 지웠습니다.';byId('password').value='';showAccount();message('로그아웃했습니다. 공용 기기에서는 창을 닫아 주세요.');if(token)await request('/auth/v1/logout',{method:'POST'},token).catch(()=>{});};
byId('refresh-history').onclick=history;
let pending=null,saving=false,savedId=null;
window.addEventListener('mongle-completed',event=>{pending=event.detail;savedId=null;byId('save-learning').disabled=false;byId('save-status').textContent=session?'학습 기록 저장 버튼을 눌러 주세요.':'로그인하면 이번 학습 기록을 저장할 수 있어요.';});
byId('restart').addEventListener('click',()=>{pending=null;savedId=null;});
byId('save-learning').onclick=async()=>{if(saving||!pending||savedId===pending.run_id)return;if(!session){byId('finish').close();byId('username').focus();message('로그인하면 방금 완료한 학습 기록을 저장할 수 있어요.');return;}saving=true;byId('save-learning').disabled=true;const run=pending;
 try{const current=await fresh();await request('/rest/v1/learning_runs?on_conflict=user_id,run_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({...run,user_id:current.user.id})},current.access_token);if(session?.user.id!==current.user.id||pending?.run_id!==run.run_id)return;savedId=run.run_id;byId('save-status').textContent='나의 학습 기록을 저장했습니다.';history();}
 catch(error){byId('save-status').textContent=session?'저장하지 못했습니다. 연결을 확인하고 다시 시도하세요.':'먼저 로그인한 후 다시 저장해 주세요.';byId('save-learning').disabled=false;}finally{saving=false;}
};
showAccount();
