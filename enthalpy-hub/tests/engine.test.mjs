import test from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../data.js';
import {validateQuestions,submitAnswer,scoreOf} from '../engine.js';
test('five valid questions; invalid answer references and duplicate IDs rejected',()=>{assert.equal(validateQuestions(questions),true);const bad=structuredClone(questions);bad[0].correctOptionId='missing';assert.throws(()=>validateQuestions(bad));bad[0]=structuredClone(questions[0]);bad[1].id=bad[0].id;assert.throws(()=>validateQuestions(bad));assert.throws(()=>validateQuestions([]));});
test('unselected answers rejected without mutating state',()=>{const a=[];assert.throws(()=>submitAnswer(a,questions[0],null));assert.deepEqual(a,[]);});
test('duplicate submission cannot change answer or score',()=>{const q=questions[0],a=submitAnswer([],q,q.correctOptionId);const b=submitAnswer(a,q,q.options.find(o=>o.id!==q.correctOptionId).id);assert.equal(a,b);assert.equal(scoreOf(b),1);assert.equal(b.length,1);});
test('all correct, all incorrect, and mixed runs produce exact scores',()=>{for(const count of [0,2,5]){let answers=[];questions.forEach((q,i)=>{answers=submitAnswer(answers,q,i<count?q.correctOptionId:q.options.find(o=>o.id!==q.correctOptionId).id);});assert.equal(answers.length,5);assert.equal(scoreOf(answers),count);}});
test('energy diagrams match the sign of their correct option',()=>{for(const q of questions.filter(q=>q.diagram)){assert.equal(q.diagram.productLevel>q.diagram.reactantLevel,q.correctOptionId==='endo-positive');}});
