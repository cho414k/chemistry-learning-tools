const $=id=>document.getElementById(id);
let entries=[],selected=null,dirty=false,busy=false;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function status(message){$('status').textContent=message;}
async function api(url,options={}){const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options.headers}});const result=await response.json();if(!response.ok)throw new Error(result.error||'저장소에 연결할 수 없습니다.');return result;}
function canLeave(){return !busy&&(!dirty||confirm('저장하지 않은 내용이 있습니다. 이동하면 사라집니다. 계속할까요?'));}
function render(){
  $('count').textContent=`${entries.length}편`;$('list').replaceChildren();
  const q=$('search').value.trim().toLocaleLowerCase(),month=$('month').value;
  const shown=entries.filter(e=>(!month||e.date.startsWith(month))&&`${e.title} ${e.body}`.toLocaleLowerCase().includes(q));
  if(!shown.length){const p=document.createElement('p');p.className='empty';p.textContent=entries.length?'검색에 맞는 기록이 없어요.':'아직 기록이 없어요.\n첫 번째 하루를 남겨보세요.';$('list').append(p);}
  for(const e of shown){const button=document.createElement('button');button.type='button';button.className=`entry${e.id===selected?' active':''}`;button.setAttribute('aria-pressed',e.id===selected);for(const [tag,text] of [['small',`${e.date} · ${e.mood}`],['strong',e.title],['p',e.body.slice(0,70)]]){const item=document.createElement(tag);item.textContent=text;button.append(item);}button.onclick=()=>{if(canLeave())load(e);};$('list').append(button);}
}
function load(entry){selected=entry?.id??null;$('date').value=entry?.date??today();$('mood').value=entry?.mood??'평온';$('title').value=entry?.title??'';$('body').value=entry?.body??'';$('delete').hidden=!entry;$('mode').textContent=entry?'기록한 하루':'새로운 하루';$('saved').textContent=entry?`저장됨 · ${new Date(entry.updated_at).toLocaleString('ko-KR')}`:'아직 저장하지 않았어요';dirty=false;$('chars').textContent=`${$('body').value.length.toLocaleString()}자`;render();}
function lock(value){busy=value;for(const el of document.querySelectorAll('#editor input,#editor textarea,#editor select,#editor button,#new'))el.disabled=value;}
$('editor').addEventListener('input',()=>{dirty=true;$('saved').textContent='저장하지 않은 변경사항';$('chars').textContent=`${$('body').value.length.toLocaleString()}자`;});
$('editor').onsubmit=async event=>{event.preventDefault();if(busy)return;lock(true);try{const entry=await api(`/api/diary${selected?`/${selected}`:''}`,{method:selected?'PUT':'POST',body:JSON.stringify({date:$('date').value,title:$('title').value,body:$('body').value,mood:$('mood').value})});entries=entries.filter(e=>e.id!==entry.id);entries.push(entry);entries.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);load(entry);status('일기를 이 컴퓨터에 저장했습니다.');}catch(error){status(error.message);}finally{lock(false);}};
$('delete').onclick=async()=>{if(busy||!selected||!confirm('이 일기를 삭제할까요? 삭제한 기록은 복구할 수 없습니다.'))return;lock(true);try{await api(`/api/diary/${selected}`,{method:'DELETE'});entries=entries.filter(e=>e.id!==selected);load(null);status('일기를 삭제했습니다.');}catch(error){status(error.message);}finally{lock(false);}};
$('new').onclick=()=>{if(canLeave()){load(null);$('title').focus();status('새로운 하루를 기록해 보세요.');}};
$('home').onclick=e=>{if(!canLeave())e.preventDefault();};
$('search').oninput=render;$('month').oninput=render;$('reset').onclick=()=>{$('search').value='';$('month').value='';render();};
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
lock(true);try{entries=await api('/api/diary');load(null);status('로컬 저장소에 연결했습니다.');lock(false);}catch(error){status(`${error.message} 서버를 다시 실행한 뒤 새로고침해 주세요.`);}
