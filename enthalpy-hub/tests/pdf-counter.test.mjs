import test from 'node:test';
import assert from 'node:assert/strict';
import {countText,pageText} from '../pdf-counter/count.js';
test('Korean, whitespace, line breaks and graphemes',()=>{
  assert.deepEqual(countText('한글 A\nB\t👨‍👩‍👧‍👦'),{withSpaces:7,withoutSpaces:5});
  assert.deepEqual(countText('한e\u0301'),{withSpaces:2,withoutSpaces:2});
  assert.deepEqual(countText(''),{withSpaces:0,withoutSpaces:0});
});
test('PDF item boundaries do not invent spaces',()=>{
  assert.equal(pageText([{str:'Hello'},{str:' '},{str:'PDF',hasEOL:true},{str:'next'},{type:'beginMarkedContent'}]),'Hello PDF\nnext');
});
test('bundled PDF.js extracts a real generated PDF',async()=>{
  // Text-only extraction never calls matrix operations; Node lacks this browser global.
  globalThis.DOMMatrix ??= class DOMMatrix {};
  const {getDocument}=await import('../pdf-counter/vendor/pdf.mjs');
  const stream='BT /F1 12 Tf 72 720 Td (Hello PDF) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let source='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(source.length);source+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
  const xref=source.length;source+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const task=getDocument({data:new TextEncoder().encode(source),isEvalSupported:false,verbosity:0});
  try{const pdf=await task.promise;assert.equal(pdf.numPages,1);const page=await pdf.getPage(1);assert.deepEqual(countText(pageText((await page.getTextContent()).items)),{withSpaces:9,withoutSpaces:8});}finally{await task.destroy();}
});
