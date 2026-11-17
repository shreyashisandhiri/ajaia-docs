import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase,createDocument,getDocument,listDocuments,canWrite,updateDocument,shareDocument} from '../db.js';

test('owner can create and edit; other user cannot read before sharing',()=>{
  const db=openDatabase(':memory:');try{
    const id=createDocument(db,'alex','Planning notes','<p>Hello</p>');
    assert.equal(getDocument(db,id,'alex').title,'Planning notes');
    assert.equal(getDocument(db,id,'sam'),null);
    assert.equal(canWrite(db,id,'sam'),false);
    assert.equal(updateDocument(db,id,'sam',{title:'Hacked'}),false);
    assert.equal(getDocument(db,id,'alex').title,'Planning notes');
  }finally{db.close();}
});
test('sharing grants read-only access and prevents non-owner sharing',()=>{
  const db=openDatabase(':memory:');try{
    const id=createDocument(db,'alex','Roadmap','<h1>Roadmap</h1>');
    assert.equal(shareDocument(db,id,'sam','alex'),'forbidden');
    assert.equal(shareDocument(db,id,'alex','sam'),'ok');
    assert.equal(getDocument(db,id,'sam').html,'<h1>Roadmap</h1>');
    assert.equal(canWrite(db,id,'sam'),false);
    assert.equal(listDocuments(db,'sam')[0].access,'shared');
    assert.equal(listDocuments(db,'alex')[0].access,'owned');
  }finally{db.close();}
});
test('invalid recipient cannot be shared',()=>{const db=openDatabase(':memory:');try{const id=createDocument(db,'alex');assert.equal(shareDocument(db,id,'alex','unknown'),'unknown_user');}finally{db.close();}});
