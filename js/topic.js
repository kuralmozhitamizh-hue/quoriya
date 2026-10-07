const params = new URLSearchParams(location.search);
const id = params.get('id');
const reader = document.getElementById('reader');
const saved = new Set(JSON.parse(localStorage.getItem('quoriya-saved') || '[]'));

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const saveState = () => localStorage.setItem('quoriya-saved', JSON.stringify([...saved]));

function setupCommonUI(){
  document.getElementById('year').textContent = new Date().getFullYear();
  const input = document.getElementById('searchInput');
  document.getElementById('searchForm').addEventListener('submit', e => { e.preventDefault(); if(input.value.trim()) location.href = `index.html?search=${encodeURIComponent(input.value.trim())}#explore`; });
  document.addEventListener('keydown', e => { if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault();input.focus();} });
  document.getElementById('themeToggle').onclick = () => { document.body.classList.toggle('dark'); localStorage.setItem('quoriya-theme', document.body.classList.contains('dark')?'dark':'light'); };
  if(localStorage.getItem('quoriya-theme')==='dark') document.body.classList.add('dark');
  document.getElementById('menuToggle').onclick = () => document.getElementById('mobileMenu').classList.toggle('open');
}

function sectionId(text,index){return `${String(text).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${index}`;}
function blockHtml(block,index,topic){
  const type = block.type;
  if(type==='text') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2>${(block.paragraphs||[]).map(p=>`<p>${escapeHtml(p)}</p>`).join('')}</section>`;
  if(type==='formula') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2><div class="callout formula-card"><code>${escapeHtml(block.formula)}</code></div>${block.explanation?`<p>${escapeHtml(block.explanation)}</p>`:''}</section>`;
  if(type==='note') return `<section class="reader-section" id="${sectionId(block.title,index)}"><div class="callout note"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.text)}</p></div></section>`;
  if(type==='story') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2><div class="callout">${(block.steps||[]).map((s,i)=>`<p><strong>${i+1}. ${escapeHtml(s.title)}</strong><br>${escapeHtml(s.text)}</p>`).join('')}</div></section>`;
  if(type==='problem') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2><div class="problem"><p><strong>Problem</strong></p><p>${escapeHtml(block.question)}</p>${block.hint?`<details class="hint"><summary>Show hint</summary><p>${escapeHtml(block.hint)}</p></details>`:''}${block.solution?`<details class="hint solution"><summary>Show solution</summary><p>${escapeHtml(block.solution)}</p></details>`:''}</div></section>`;
  if(type==='gallery') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2><div class="carousel" data-carousel><div class="carousel-track">${(block.items||[]).map(item=>`<div class="slide"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt||'')}"><div class="slide-caption">${escapeHtml(item.caption||'')}</div></div>`).join('')}</div><div class="carousel-controls"><button class="btn btn-ghost prev" type="button">← Previous</button><span class="slide-count">1 / ${(block.items||[]).length}</span><button class="btn btn-ghost next" type="button">Next →</button></div></div></section>`;
  if(type==='media') return `<section class="reader-section" id="${sectionId(block.title,index)}"><h2>${escapeHtml(block.title)}</h2><div class="media-card">${block.kind==='video' && block.src ? `<video controls preload="metadata" src="${escapeHtml(block.src)}"></video>` : block.kind==='audio' && block.src ? `<audio controls preload="metadata" src="${escapeHtml(block.src)}"></audio>` : `<div class="media-placeholder">Add a ${escapeHtml(block.kind||'media')} file in your content data.</div>`}${block.caption?`<p>${escapeHtml(block.caption)}</p>`:''}</div></section>`;
  return '';
}

function setupCarousels(){document.querySelectorAll('[data-carousel]').forEach(carousel=>{const track=carousel.querySelector('.carousel-track');const slides=carousel.querySelectorAll('.slide');let index=0;const count=carousel.querySelector('.slide-count');const update=()=>{track.style.transform=`translateX(-${index*100}%)`;count.textContent=`${index+1} / ${slides.length}`};carousel.querySelector('.prev').onclick=()=>{index=(index-1+slides.length)%slides.length;update()};carousel.querySelector('.next').onclick=()=>{index=(index+1)%slides.length;update()};});}

function render(topic, allTopics){
  document.title = `${topic.title} — Quoriya`;
  const isSaved = saved.has(topic.id);
  const blocks = topic.blocks || [];
  const toc = blocks.map((b,i)=>`<a href="#${sectionId(b.title,i)}">${escapeHtml(b.title)}</a>`).join('');
  const related = (topic.related || []).map(rid=>allTopics.find(t=>t.id===rid)).filter(Boolean);
  reader.innerHTML = `
    <div class="reader-top"><a class="back-link" href="index.html#explore">← Back to Explore</a><button class="btn btn-ghost" id="saveTopic">${isSaved?'★ Saved':'☆ Save topic'}</button></div>
    <section class="reader-hero"><div class="reader-kicker">${escapeHtml(topic.category)} · ${escapeHtml(topic.type)} · ${escapeHtml(topic.readTime)}</div><h1 class="reader-title">${escapeHtml(topic.title)}</h1><p class="reader-summary">${escapeHtml(topic.description)}</p><div class="reader-actions"><a class="btn btn-primary" href="#${blocks.length?sectionId(blocks[0].title,0):''}">Start learning →</a></div></section>
    <div class="reader-layout"><aside class="toc"><strong>On this page</strong>${toc || '<span class="muted">Content coming soon.</span>'}</aside><div class="content-stack">${blocks.map((b,i)=>blockHtml(b,i,topic)).join('')}${related.length?`<section class="reader-section"><h2>Related topics</h2><div class="related-grid">${related.map(t=>`<a class="related-card" href="topic.html?id=${encodeURIComponent(t.id)}"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.category)} · ${escapeHtml(t.type)}</span></a>`).join('')}</div></section>`:''}</div></div>`;
  document.getElementById('saveTopic').onclick=()=>{if(saved.has(topic.id))saved.delete(topic.id);else saved.add(topic.id);saveState();document.getElementById('saveTopic').textContent=saved.has(topic.id)?'★ Saved':'☆ Save topic';};
  setupCarousels();
}

async function init(){
  setupCommonUI();
  try{
    const response=await fetch('data/topics.json');
    if(!response.ok) throw new Error('Content file unavailable');
    const data=await response.json();
    const topic=data.topics.find(t=>t.id===id);
    if(!topic){reader.innerHTML=`<div class="reader-error"><h1>Topic not found</h1><p>The requested topic does not exist in Quoriya yet.</p><a class="btn btn-primary" href="index.html#explore">Back to Explore</a></div>`;return;}
    render(topic,data.topics);
  }catch(error){console.error(error);reader.innerHTML='<div class="reader-error"><h1>Could not load this topic</h1><p>Check that data/topics.json is published correctly.</p></div>';}
}
init();
