import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, listDocuments, createDocument, getDocument, updateDocument, shareDocument, canWrite } from './db.js';

const root=fileURLToPath(new URL('./public/',import.meta.url));
const db=openDatabase();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const MAX_BODY=1024*1024;
function respond(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
function user(req){const id=req.headers['x-demo-user'];return id==='alex'||id==='sam'?id:null;}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){const e=new Error('Request exceeds 1 MB');e.status=413;throw e;}chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{const e=new Error('Invalid JSON');e.status=400;throw e;}}
function validateTitle(v){return typeof v==='string'&&v.trim().length>0&&v.trim().length<=120;}
function validateHtml(v){return typeof v==='string'&&Buffer.byteLength(v,'utf8')<=500000;}
function cleanHtml(input){
  // Defense in depth: allowlist rich-text HTML. Client-side sanitization is not a security boundary.
  let html=input.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|link|meta)[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|link|meta)\b[^>]*\/?\s*>/gi,'');
  html=html.replace(/<\/?([a-z][a-z0-9:-]*)\b([^>]*)>/gi,(full,tag,attrs)=>{
    tag=tag.toLowerCase();const allowed=new Set(['p','div','br','strong','b','em','i','u','h1','h2','h3','ul','ol','li','blockquote']);
    if(!allowed.has(tag))return '';
    return full.startsWith('</')?`</${tag}>`:`<${tag}>`;
  });
  return html;
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');const path=url.pathname;
    if(path.startsWith('/api/')){
      const current=user(req);if(!current)return respond(res,401,{error:'Choose a valid demo user'});
      if(path==='/api/users'&&req.method==='GET')return respond(res,200,{users:[{id:'alex',name:'Alex Morgan'},{id:'sam',name:'Sam Rivera'}],current});
      if(path==='/api/documents'&&req.method==='GET')return respond(res,200,{documents:listDocuments(db,current)});
      if(path==='/api/documents'&&req.method==='POST'){
        const data=await body(req);if(data.title!==undefined&&!validateTitle(data.title))return respond(res,400,{error:'Title must be 1–120 characters'});
        if(data.html!==undefined&&!validateHtml(data.html))return respond(res,400,{error:'Document content too large'});
        const id=createDocument(db,current,data.title?.trim()||'Untitled document',cleanHtml(data.html||''));return respond(res,201,{document:getDocument(db,id,current)});
      }
      const match=path.match(/^\/api\/documents\/([a-f0-9-]{36})(?:\/(share|unshare))?$/);
      if(match){const [,id,action]=match;
        if(req.method==='GET'&&!action){const doc=getDocument(db,id,current);return doc?respond(res,200,{document:doc}):respond(res,404,{error:'Document not found or not shared with you'});}
        if(req.method==='PUT'&&!action){if(!canWrite(db,id,current))return respond(res,403,{error:'Only the owner can edit this document'});const data=await body(req);
          if(data.title!==undefined&&!validateTitle(data.title))return respond(res,400,{error:'Title must be 1–120 characters'});
          if(data.html!==undefined&&!validateHtml(data.html))return respond(res,400,{error:'Document content too large'});
          updateDocument(db,id,current,{title:data.title?.trim(),html:data.html===undefined?undefined:cleanHtml(data.html)});return respond(res,200,{document:getDocument(db,id,current)});
        }
        if(req.method==='DELETE'&&!action){if(!canWrite(db,id,current))return respond(res,403,{error:'Only the owner can delete'});db.prepare('DELETE FROM documents WHERE id=?').run(id);return respond(res,200,{ok:true});}
        if(req.method==='POST'&&action==='share'){const data=await body(req);const result=shareDocument(db,id,current,data.userId);return result==='ok'?respond(res,200,{document:getDocument(db,id,current)}):respond(res,result==='forbidden'?403:400,{error:result});}
        if(req.method==='POST'&&action==='unshare'){if(!canWrite(db,id,current))return respond(res,403,{error:'Only the owner can revoke access'});const data=await body(req);db.prepare('DELETE FROM shares WHERE document_id=? AND user_id=?').run(id,data.userId);return respond(res,200,{document:getDocument(db,id,current)});}
      }
      return respond(res,404,{error:'API endpoint not found'});
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,{error:'Method not allowed'});
    const target=path==='/'?'index.html':decodeURIComponent(path.slice(1));
    const normalized=normalize(target);if(normalized.startsWith('..')||normalized.startsWith('/')||normalized.includes('\\'))return respond(res,403,{error:'Forbidden'});
    const filepath=join(root,normalized);const file=await readFile(filepath);res.writeHead(200,{'content-type':mime[extname(filepath)]||'application/octet-stream','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:file);
  }catch(e){if(e.code==='ENOENT')return respond(res,404,{error:'Not found'});console.error(e);return respond(res,e.status||500,{error:e.status?e.message:'Internal server error'});}
});
const port=Number(process.env.PORT||3000);
server.listen(port,'0.0.0.0',()=>console.log(`Ajaia Docs running at http://localhost:${port}`));
