import {getDocument,GlobalWorkerOptions} from './vendor/pdf.mjs';
import {countText,pageText} from './count.js';
GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
const $=id=>document.getElementById(id);
let generation=0, task=null;
function clear(){generation++;if(task){task.destroy().catch(()=>{});task=null;}$('file').value='';$('text').textContent='';$('rows').replaceChildren();$('filename').textContent='';$('result').hidden=true;$('progress').hidden=true;$('status').textContent='파일을 선택하면 자동으로 분석합니다.';}
$('clear').onclick=clear;
async function analyze(file){
  clear();if(!file)return;const run=generation;
  if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'){$('status').textContent='PDF 파일을 선택해 주세요.';return;}
  if(file.size>50*1024*1024){$('status').textContent='50 MB 이하의 PDF를 선택해 주세요.';return;}
  let ownTask;
  try{
    $('status').textContent='파일을 읽는 중입니다…';
    const bytes=new Uint8Array(await file.arrayBuffer());if(run!==generation)return;
    ownTask=getDocument({data:bytes,cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href,isEvalSupported:false,disableFontFace:true,useWorkerFetch:false,verbosity:0});task=ownTask;
    const pdf=await ownTask.promise;if(run!==generation)return;
    $('progress').hidden=false;$('progress').max=pdf.numPages;$('progress').value=0;
    const rows=[],texts=[];let total=0,noSpaces=0,empty=0;
    for(let n=1;n<=pdf.numPages;n++){
      if(run!==generation)return;
      $('status').textContent=`${n} / ${pdf.numPages}페이지 분석 중…`;
      const page=await pdf.getPage(n);const content=await page.getTextContent();if(run!==generation)return;
      const text=pageText(content.items), counts=countText(text);texts.push(text);rows.push(counts);total+=counts.withSpaces;noSpaces+=counts.withoutSpaces;if(!counts.withoutSpaces)empty++;page.cleanup();$('progress').value=n;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(run!==generation)return;
    $('filename').textContent=file.name;$('with').textContent=total.toLocaleString('ko');$('without').textContent=noSpaces.toLocaleString('ko');$('pages').textContent=pdf.numPages;
    const fragment=document.createDocumentFragment();rows.forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.withSpaces,r.withoutSpaces].forEach(v=>{const td=document.createElement('td');td.textContent=v.toLocaleString('ko');tr.append(td);});fragment.append(tr);});$('rows').append(fragment);
    $('text').textContent=texts.map((t,i)=>`[${i+1}페이지]\n${t}`).join('\n\n');
    $('warning').textContent=empty?`${empty}개 페이지에서 텍스트를 찾지 못했습니다. 빈 페이지 또는 스캔 이미지일 수 있습니다. OCR은 지원하지 않습니다.`:'추출된 텍스트 기준입니다. 아래에서 원문과 비교해 확인하세요.';
    $('result').hidden=false;$('status').textContent='분석 완료 · 파일과 결과는 외부로 전송되지 않았습니다.';
  }catch(error){if(run!==generation)return;$('status').textContent=error.name==='PasswordException'?'암호가 걸린 PDF입니다. 컴퓨터에서 암호를 해제한 사본을 선택해 주세요.':'PDF를 읽지 못했습니다. 손상 여부와 PDF 형식을 확인해 주세요.';}
  finally{if(run===generation){$('progress').hidden=true;task=null;}if(ownTask)await ownTask.destroy().catch(()=>{});}
}
$('file').onchange=e=>analyze(e.target.files[0]);
for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.add('drag');});
$('drop').addEventListener('dragleave',()=>$('drop').classList.remove('drag'));
$('drop').addEventListener('drop',e=>{e.preventDefault();$('drop').classList.remove('drag');if(e.dataTransfer.files.length!==1){$('status').textContent='PDF 한 개씩 선택해 주세요.';return;}analyze(e.dataTransfer.files[0]);});
window.addEventListener('pagehide',clear);
