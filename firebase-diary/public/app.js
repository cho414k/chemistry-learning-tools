import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,setPersistence,browserSessionPersistence,onAuthStateChanged,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,collection,doc,query,orderBy,limit,startAfter,getDocsFromServer,getDocFromServer,runTransaction,deleteDoc,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
let user=null,entries=[],selected=null,draftId=null,dirty=false,busy=false,lastSnapshot=null,moreAvailable=false,loading=false;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const status=text=>{$('status').textContent=text;};
const pathFor=uid=>collection(db,'users',uid,'entries');
const entryFrom=snapshot=>({id:snapshot.id,...snapshot.data()});
function lock(value){busy=value;$('editor-fields').disabled=value||!user;$('new').disabled=value||!user;$('logout').disabled=value;$('more').disabled=value||loading;}
function canLeave(){return !busy&&(!dirty||confirm('저장하지 않은 내용이 있습니다. 계속 이동할까요?'));}
function render(){
 $('count').textContent=`${entries.length}편 불러옴`;$('list').replaceChildren();
 const q=$('search').value.trim().toLocaleLowerCase(),month=$('month').value;
 const shown=entries.filter(e=>(!month||e.date.startsWith(month))&&`${e.title} ${e.body}`.toLocaleLowerCase().includes(q));
 if(!shown.length){const p=document.createElement('p');p.className='empty';p.textContent=!user?'로그인하면 나의 일기가 표시됩니다.':entries.length?'불러온 기록에 검색 결과가 없어요.':'아직 기록이 없어요. 첫 번째 하루를 남겨보세요.';$('list').append(p);}
 for(const e of shown){const button=document.createElement('button');button.type='button';button.className=`entry${e.id===selected?' active':''}`;button.setAttribute('aria-pressed',e.id===selected);for(const [tag,text] of [['small',`${e.date} · ${e.mood}`],['strong',e.title],['p',e.body.slice(0,70)]]){const item=document.createElement(tag);item.textContent=text;button.append(item);}button.onclick=()=>{if(canLeave())load(e);};$('list').append(button);}
 $('more').hidden=!moreAvailable;
}
function load(entry){selected=entry?.id??null;draftId=selected??(user?doc(pathFor(user.uid)).id:null);$('date').value=entry?.date??today();$('mood').value=entry?.mood??'평온';$('title').value=entry?.title??'';$('body').value=entry?.body??'';$('delete').hidden=!entry;$('mode').textContent=entry?'기록한 하루':'새로운 하루';$('saved').textContent=entry?`저장됨 · ${entry.updated_at?.toDate().toLocaleString('ko-KR')??''}`:'아직 저장하지 않았어요';dirty=false;$('chars').textContent=`${$('body').value.length.toLocaleString()}자`;render();}
async function fetchEntries(append=false){
 if(!user||loading)return;loading=true;$('more').disabled=true;const uid=user.uid;
 try{const constraints=[orderBy('date','desc')];if(append&&lastSnapshot)constraints.push(startAfter(lastSnapshot));constraints.push(limit(50));const result=await getDocsFromServer(query(pathFor(uid),...constraints));if(user?.uid!==uid)return;
 const incoming=result.docs.map(entryFrom);entries=append?[...new Map([...entries,...incoming].map(e=>[e.id,e])).values()]:incoming;lastSnapshot=result.docs.at(-1)??lastSnapshot;moreAvailable=result.size===50;render();status(`${entries.length}편의 기록을 불러왔습니다.`);
 }catch{if(user?.uid===uid)status('일기를 불러오지 못했습니다. 연결을 확인하고 다시 로그인해 주세요.');}finally{loading=false;$('more').disabled=busy;}
}
$('editor').addEventListener('input',()=>{dirty=true;$('saved').textContent='저장하지 않은 변경사항';$('chars').textContent=`${$('body').value.length.toLocaleString()}자`;});
$('editor').onsubmit=async event=>{
 event.preventDefault();if(busy||!user)return;const uid=user.uid,ref=doc(pathFor(uid),draftId);const date=$('date').value,day=new Date(date+'T00:00:00Z');
 const input={date,day:Timestamp.fromDate(day),mood:$('mood').value,title:$('title').value.trim(),body:$('body').value.trim()};
 if(!input.title||!input.body||!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==date){status('날짜·제목·내용을 확인해 주세요.');return;}
 lock(true);try{await runTransaction(db,async tx=>{const old=await tx.get(ref);tx.set(ref,{...input,created_at:old.exists()?old.data().created_at:serverTimestamp(),updated_at:serverTimestamp()});});const saved=await getDocFromServer(ref);if(user?.uid!==uid)return;const entry=entryFrom(saved);entries=entries.filter(e=>e.id!==entry.id);entries.push(entry);entries.sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));load(entry);status('나의 계정에 일기를 저장했습니다.');}catch{status('저장하지 못했습니다. 연결을 확인하고 다시 시도하세요. 입력 내용은 이 창에 남아 있습니다.');}finally{lock(false);}
};
$('delete').onclick=async()=>{if(busy||!user||!selected||!confirm('이 일기를 삭제할까요? 삭제한 기록은 복구할 수 없습니다.'))return;lock(true);try{await deleteDoc(doc(pathFor(user.uid),selected));entries=entries.filter(e=>e.id!==selected);load(null);status('일기를 삭제했습니다.');}catch{status('삭제하지 못했습니다. 다시 시도하세요.');}finally{lock(false);}};
$('new').onclick=()=>{if(canLeave()){load(null);$('title').focus();}};
$('more').onclick=()=>fetchEntries(true);
$('search').oninput=render;$('month').oninput=render;$('reset').onclick=()=>{$('search').value='';$('month').value='';render();};
$('home').onclick=event=>{if(!canLeave())event.preventDefault();};
$('login').onclick=async()=>{$('login').disabled=true;try{await setPersistence(auth,browserSessionPersistence);await signInWithPopup(auth,new GoogleAuthProvider());}catch(error){status(error.code==='auth/popup-blocked'?'팝업이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 로그인하세요.':'로그인을 완료하지 못했습니다. 다시 시도하세요.');}finally{$('login').disabled=false;}};
$('logout').onclick=async()=>{if(!canLeave())return;try{await signOut(auth);}catch{status('로그아웃하지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.');}};
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
onAuthStateChanged(auth,current=>{user=current;entries=[];lastSnapshot=null;moreAvailable=false;$('account').textContent=current?`${current.displayName||'사용자'} 님`:'';$('login').hidden=!!current;$('logout').hidden=!current;$('search').value='';$('month').value='';load(null);lock(false);if(current)fetchEntries();else status('Google 계정으로 로그인하면 일기를 쓸 수 있습니다.');});
