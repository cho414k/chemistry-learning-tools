import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

export function openDiary(filename){
  mkdirSync(path.dirname(filename),{recursive:true});
  const db=new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, mood TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  return {
    list(){return db.prepare('SELECT * FROM entries ORDER BY date DESC, id DESC').all();},
    save(input,id){
      const {date,title,body,mood}=input;
      if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||typeof title!=='string'||!title.trim()||title.length>120||typeof body!=='string'||!body.trim()||body.length>100000||!['좋음','평온','보통','속상','피곤'].includes(mood)){
        throw Object.assign(new Error('날짜, 제목(120자 이내), 내용(100,000자 이내), 기분을 확인해 주세요.'),{status:400});
      }
      const now=new Date().toISOString();
      if(id){
        if(!db.prepare('UPDATE entries SET date=?,title=?,body=?,mood=?,updated_at=? WHERE id=?').run(date,title.trim(),body,mood,now,id).changes)throw Object.assign(new Error('일기를 찾을 수 없습니다.'),{status:404});
      }else id=Number(db.prepare('INSERT INTO entries(date,title,body,mood,updated_at) VALUES(?,?,?,?,?)').run(date,title.trim(),body,mood,now).lastInsertRowid);
      return db.prepare('SELECT * FROM entries WHERE id=?').get(id);
    },
    remove(id){return Boolean(db.prepare('DELETE FROM entries WHERE id=?').run(id).changes);},
    close(){db.close();}
  };
}
