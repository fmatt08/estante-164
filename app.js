const DB='catalogo164', STORE='items';
let items=[], currentView='shelf', editing=null, photoData=null;
const $=id=>document.getElementById(id);
const fmtMoney=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function uid(){return 'M'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase()}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function all(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function put(x){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(x);r.onsuccess=res;r.onerror=()=>rej(r.error)})}
async function del(id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);r.onsuccess=res;r.onerror=()=>rej(r.error)})}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
function filtered(){let q=$('search').value.toLowerCase().trim();return items.filter(x=>{
 const text=[x.manufacturer,x.model,x.scale,x.color,x.condition,x.year,x.material,x.shelf,x.row,x.position,x.notes].join(' ').toLowerCase();
 return (!q||text.includes(q))&&(!$('filterManufacturer').value||x.manufacturer===$('filterManufacturer').value)&&(!$('filterYear').value||String(x.year)===$('filterYear').value)&&(!$('filterCondition').value||x.condition===$('filterCondition').value)&&(!$('filterMaterial').value||x.material===$('filterMaterial').value)&&(!$('filterShelf').value||String(x.shelf)===$('filterShelf').value)
})}
function refreshFilters(){const fill=(id,vals,label)=>{const el=$(id),old=el.value;el.innerHTML=`<option value="">${label}</option>`;[...new Set(vals.filter(Boolean).map(String))].sort().forEach(v=>el.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));el.value=old};fill('filterManufacturer',items.map(x=>x.manufacturer),'Fabricante');fill('filterYear',items.map(x=>x.year),'Ano');fill('filterCondition',items.map(x=>x.condition),'Conservação');fill('filterMaterial',items.map(x=>x.material),'Material');fill('filterShelf',items.map(x=>x.shelf),'Estante')}
function renderQuick(){const total=items.length,sum=items.reduce((a,x)=>a+Number(x.value||0),0);$('quickStats').innerHTML=`<div class="stat"><b>${total}</b><small>miniaturas</small></div><div class="stat"><b>${fmtMoney(sum)}</b><small>valor investido</small></div><div class="stat"><b>${total?fmtMoney(sum/total):fmtMoney(0)}</b><small>média por peça</small></div>`}
function img(x){return x.photo?`<img src="${x.photo}" alt="">`:`<div class="noimg">🏎️</div>`}
function renderShelf(){const data=filtered();if(!data.length){$('shelfView').innerHTML='<div class="empty">🗄️<h3>Sua estante está vazia</h3><p>Adicione a primeira miniatura para começar sua coleção.</p><button class="primary" onclick="openNew()">＋ Adicionar miniatura</button></div>';return}const groups={};data.forEach(x=>{const s=x.shelf||1;groups[s]??={};const r=x.row||1;groups[s][r]??=[];groups[s][r].push(x)});$('shelfView').innerHTML=Object.entries(groups).sort((a,b)=>a[0]-b[0]).map(([s,rows])=>`<div class="shelf"><div class="shelfTitle"><h3>Estante ${esc(s)}</h3><small>${Object.values(rows).flat().length} peças</small></div>${Object.entries(rows).sort((a,b)=>a[0]-b[0]).map(([r,arr])=>`<div><div class="shelfTitle"><small>Prateleira ${esc(r)}</small></div><div class="shelfrow">${arr.sort((a,b)=>(a.position||999)-(b.position||999)).map(x=>`<button class="card" onclick="openEdit('${x.id}')">${img(x)}<div class="cardbody"><b>${esc(x.model)}</b><span>${esc(x.manufacturer)}</span></div></button>`).join('')}</div></div>`).join('')}</div>`).join('')}
function renderList(){const data=filtered();$('listView').innerHTML=data.length?data.map(x=>`<button class="listitem" onclick="openEdit('${x.id}')">${x.photo?`<img src="${x.photo}" alt="">`:'<div class="listthumb noimg">🏎️</div>'}<div class="listinfo"><b>${esc(x.model)}</b><span>${esc(x.manufacturer)} · ${esc(x.color)} · ${esc(x.year||'')}</span><span>${esc(x.condition)} · Estante ${esc(x.shelf||'-')}/${esc(x.row||'-')}/${esc(x.position||'-')}</span></div><div class="price">${fmtMoney(x.value)}</div></button>`).join(''):'<div class="empty">Nenhum registro encontrado.</div>'}
function renderStats(){const count=(field)=>{const o={};items.forEach(x=>{const k=x[field]||'Não informado';o[k]=(o[k]||0)+1});return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,8)};const bars=(title,field)=>{const d=count(field),max=d[0]?.[1]||1;return `<div class="chart"><h3>${title}</h3>${d.map(([k,v])=>`<div class="barrow"><span>${esc(k)}</span><div><div class="bar" style="width:${Math.max(4,v/max*100)}%"></div></div><b>${v}</b></div>`).join('')}</div>`};$('statsView').innerHTML=`<div class="chart"><h3>Resumo</h3><p>Total: <b>${items.length}</b></p><p>Investimento: <b>${fmtMoney(items.reduce((a,x)=>a+Number(x.value||0),0))}</b></p><p>Fabricantes: <b>${new Set(items.map(x=>x.manufacturer).filter(Boolean)).size}</b></p><p>Anos representados: <b>${new Set(items.map(x=>x.year).filter(Boolean)).size}</b></p></div>${bars('Por fabricante','manufacturer')}${bars('Por conservação','condition')}${bars('Por material','material')}${bars('Por ano','year')}`}
function render(){renderQuick();refreshFilters();renderShelf();renderList();renderStats();setView(currentView)}
function setView(v){currentView=v;['shelf','list','stats'].forEach(k=>$(k+'View').classList.toggle('hidden',k!==v));document.querySelectorAll('.tab,.navitem').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}
function openNew(){editing=null;photoData=null;$('itemForm').reset();$('itemId').value='';$('scale').value='1:64';$('formTitle').textContent='Nova miniatura';$('deleteItem').classList.add('hidden');updatePhoto();$('editor').showModal()}
function openEdit(id){const x=items.find(i=>i.id===id);if(!x)return;editing=x;photoData=x.photo||null;[['itemId','id'],['manufacturer','manufacturer'],['model','model'],['scale','scale'],['color','color'],['condition','condition'],['year','year'],['value','value'],['material','material'],['acquired','acquired'],['shelf','shelf'],['row','row'],['position','position'],['notes','notes']].forEach(([a,b])=>$(a).value=x[b]??'');$('formTitle').textContent='Editar miniatura';$('deleteItem').classList.remove('hidden');updatePhoto();$('editor').showModal()}
function updatePhoto(){if(photoData){$('photoPreview').src=photoData;$('photoPreview').classList.remove('hidden');$('photoEmpty').classList.add('hidden')}else{$('photoPreview').classList.add('hidden');$('photoEmpty').classList.remove('hidden')}}
function readPhoto(file){if(!file)return;const fr=new FileReader();fr.onload=()=>{photoData=fr.result;updatePhoto()};fr.readAsDataURL(file)}
async function saveForm(e){e.preventDefault();const x={id:$('itemId').value||uid(),manufacturer:$('manufacturer').value.trim(),model:$('model').value.trim(),scale:$('scale').value.trim()||'1:64',color:$('color').value.trim(),condition:$('condition').value,year:$('year').value?Number($('year').value):'',value:$('value').value?Number($('value').value):0,material:$('material').value.trim(),acquired:$('acquired').value,shelf:$('shelf').value?Number($('shelf').value):1,row:$('row').value?Number($('row').value):1,position:$('position').value?Number($('position').value):items.length+1,notes:$('notes').value.trim(),photo:photoData||''};await put(x);items=await all();$('editor').close();render();toast('Miniatura salva!')}
function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`}
function exportCSV(){const cols=['ID','Fabricante','Modelo','Escala','Visual - Cor','Conservação','Ano','Valor','Material','Data de aquisição','Estante','Prateleira','Posição','Observações','Foto'];const rows=[cols,...items.map(x=>[x.id,x.manufacturer,x.model,x.scale,x.color,x.condition,x.year,x.value,x.material,x.acquired,x.shelf,x.row,x.position,x.notes,x.photo?'foto-'+x.id+'.jpg':''])];const csv='\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');download('catalogo_1-64.csv',new Blob([csv],{type:'text/csv;charset=utf-8'}))}
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function cat(...parts){let n=parts.reduce((s,p)=>s+p.length,0),o=new Uint8Array(n),i=0;for(const p of parts){o.set(p,i);i+=p.length}return o}
const te=new TextEncoder(),td=new TextDecoder();
function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
async function makeBackupZip(){
  const meta={version:2,createdAt:new Date().toISOString(),app:'Estante 1:64',items:items.map(x=>({...x,photo: x.photo ? `fotos/${x.id}.jpg` : ''}))};
  const files=[['catalogo.json',te.encode(JSON.stringify(meta))]];
  for(const x of items) if(x.photo){
    const comma=x.photo.indexOf(',');
    const raw=atob(comma>=0?x.photo.slice(comma+1):x.photo);
    const b=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);
    files.push([`fotos/${x.id}.jpg`,b]);
  }
  const local=[],central=[];let offset=0;
  const now=new Date(), dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|Math.floor(now.getSeconds()/2);
  const dosDate=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  for(const [name,data] of files){
    const nb=te.encode(name),crc=crc32(data);
    const h=cat(te.encode('PK\x03\x04'),u16(20),u16(0),u16(0),u16(dosTime),u16(dosDate),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),nb);
    local.push(h,data);
    const ch=cat(te.encode('PK\x01\x02'),u16(20),u16(20),u16(0),u16(0),u16(dosTime),u16(dosDate),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb);
    central.push(ch);offset+=h.length+data.length;
  }
  const centralBytes=cat(...central),end=cat(te.encode('PK\x05\x06'),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBytes.length),u32(offset),u16(0));
  const blob=new Blob([...local,centralBytes,end],{type:'application/zip'});
  download('backup_estante_164.zip',blob);toast('Backup ZIP criado com dados e fotos');
}
function rd16(a,o){return a[o]|(a[o+1]<<8)}
function rd32(a,o){return (a[o]|(a[o+1]<<8)|(a[o+2]<<16)|(a[o+3]<<24)>>>0)}
async function restoreZip(file){
  try{
    const a=new Uint8Array(await file.arrayBuffer()), entries=[];
    let p=0;
    while(p+4<=a.length){
      const sig=rd32(a,p)>>>0;
      if(sig===0x04034b50){
        const method=rd16(a,p+8),cs=rd32(a,p+18)>>>0,ns=rd16(a,p+26),es=rd16(a,p+28);
        const name=td.decode(a.slice(p+30,p+30+ns)),start=p+30+ns+es;
        if(method!==0) throw Error('ZIP comprimido não suportado');
        entries.push([name,a.slice(start,start+cs)]);p=start+cs;
      }else break;
    }
    const metaEntry=entries.find(e=>e[0]==='catalogo.json');if(!metaEntry)throw Error();
    const meta=JSON.parse(td.decode(metaEntry[1]));if(!Array.isArray(meta.items))throw Error();
    const byName=new Map(entries);
    for(const x of meta.items){
      const copy={...x};const path=copy.photo;
      if(path&&byName.has(path)){
        const b=byName.get(path);let bin='';const step=0x8000;
        for(let i=0;i<b.length;i+=step)bin+=String.fromCharCode(...b.subarray(i,i+step));
        copy.photo='data:image/jpeg;base64,'+btoa(bin);
      } else copy.photo='';
      await put(copy);
    }
    items=await all();render();toast(`${meta.items.length} registros restaurados`);
  }catch(e){console.error(e);toast('Não foi possível restaurar este ZIP')}
}

function printCatalog(){const w=open('','_blank');const html=`<!doctype html><html><head><meta charset="utf-8"><title>Catálogo 1:64</title><style>body{font:13px Arial;margin:20px}.sheet{display:grid;grid-template-columns:1fr 1fr;gap:14px}.item{border:1px solid #aaa;padding:12px;break-inside:avoid}.item img{width:100%;height:180px;object-fit:contain}.item h2{margin:5px 0;font-size:16px}.item p{margin:3px 0}</style></head><body><h1>Catálogo de Miniaturas 1:64</h1><div class="sheet">${items.map(x=>`<article class="item">${x.photo?`<img src="${x.photo}">`:''}<h2>${esc(x.model)}</h2><p><b>Fabricante:</b> ${esc(x.manufacturer)}</p><p><b>Escala:</b> ${esc(x.scale)} · <b>Ano:</b> ${esc(x.year)}</p><p><b>Cor:</b> ${esc(x.color)} · <b>Material:</b> ${esc(x.material)}</p><p><b>Conservação:</b> ${esc(x.condition)} · <b>Valor:</b> ${fmtMoney(x.value)}</p><p><b>Local:</b> Estante ${esc(x.shelf)}/${esc(x.row)}/${esc(x.position)}</p><p><b>ID:</b> ${esc(x.id)}</p><p>${esc(x.notes)}</p></article>`).join('')}</div><script>window.onload=()=>setTimeout(()=>print(),500)<\/script></body></html>`;w.document.write(html);w.document.close()}
function parseCSV(text){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(!lines.length)return[];const parse=l=>{let a=[],cur='',q=false;for(let i=0;i<l.length;i++){let c=l[i];if(c=='"'){if(q&&l[i+1]=='"'){cur+='"';i++}else q=!q}else if((c==';'||c==',')&&!q){a.push(cur);cur=''}else cur+=c}a.push(cur);return a};const h=parse(lines[0]).map(x=>x.trim().toLowerCase());return lines.slice(1).map(l=>{const a=parse(l),g=n=>a[h.indexOf(n)]||'';return{id:g('id')||uid(),manufacturer:g('fabricante'),model:g('modelo'),scale:g('escala')||'1:64',color:g('visual - cor'),condition:g('conservação'),year:g('ano'),value:(g('valor')||'').replace(',','.'),material:g('material'),'acquired':g('data de aquisição'),shelf:g('estante')||1,row:g('prateleira')||1,position:g('posição'),notes:g('observações'),photo:''}})}
$('itemForm').addEventListener('submit',saveForm);$('cameraInput').addEventListener('change',e=>readPhoto(e.target.files[0]));$('galleryInput').addEventListener('change',e=>readPhoto(e.target.files[0]));$('removePhoto').onclick=()=>{photoData=null;updatePhoto()};$('deleteItem').onclick=async()=>{if(editing&&confirm('Excluir esta miniatura?')){await del(editing.id);items=await all();$('editor').close();render();toast('Miniatura excluída')}};$('addTop').onclick=openNew;$('filtersBtn').onclick=()=>$('filters').classList.toggle('hidden');$('clearFilters').onclick=()=>{['search','filterManufacturer','filterYear','filterCondition','filterMaterial','filterShelf'].forEach(id=>$(id).value='');render()};$('search').oninput=render;['filterManufacturer','filterYear','filterCondition','filterMaterial','filterShelf'].forEach(id=>$(id).onchange=render);document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('toolsBtn').onclick=()=>$('tools').showModal();$('exportCsv').onclick=exportCSV;$('backup').onclick=makeBackupZip;$('printAll').onclick=printCatalog;$('restoreInput').onchange=e=>e.target.files[0]&&restoreZip(e.target.files[0]);$('importCsv').onclick=()=>$('csvInput').click();$('csvInput').onchange=async e=>{if(!e.target.files[0])return;const arr=parseCSV(await e.target.files[0].text());for(const x of arr)await put(x);items=await all();render();toast(`${arr.length} registros importados`)};window.openNew=openNew;window.openEdit=openEdit;
(async()=>{items=await all();render();if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})})();
