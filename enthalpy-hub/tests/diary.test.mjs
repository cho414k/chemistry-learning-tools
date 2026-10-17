import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openDiary} from '../diary-store.mjs';
test('일기 생성·재시작 후 읽기·수정·삭제 및 날짜 검증',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'diary-test-'));
  let store=openDiary(path.join(dir,'diary.sqlite'));
  try{
    const input={date:'2026-10-17',title:'한글 일기 🌙',body:'오늘의 기록\n두 번째 줄',mood:'평온'};
    const entry=store.save(input);store.close();store=openDiary(path.join(dir,'diary.sqlite'));
    assert.equal(store.list()[0].body,input.body);
    store.save({...input,title:'수정한 제목'},entry.id);assert.equal(store.list()[0].title,'수정한 제목');
    assert.throws(()=>store.save({...input,date:'2026-02-30'}),/날짜/);
    assert.throws(()=>store.save({...input,title:' '}),/제목/);
    assert.throws(()=>store.save({...input,mood:'invalid'}),/기분/);
    assert.equal(store.remove(entry.id),true);assert.equal(store.list().length,0);
    assert.throws(()=>store.save(input,entry.id),/찾을 수/);
  }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
