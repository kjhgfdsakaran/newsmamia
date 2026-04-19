// ===== STATE =====
let DATA = [], page = 1;
const PER_PAGE = 6;
let mode = 'All';

// ===== STORAGE =====
const getLikes = () => JSON.parse(localStorage.nm_likes || '{}');
const setLikes = o => localStorage.nm_likes = JSON.stringify(o);
const getBms = () => JSON.parse(localStorage.nm_bms || '[]');
const setBms = a => localStorage.nm_bms = JSON.stringify(a);

// ===== DARK MODE =====
document.body.classList.toggle('dark', localStorage.nm_dark === 'true');
function toggleDarkMode(){
  document.body.classList.toggle('dark');
  localStorage.nm_dark = document.body.classList.contains('dark');
}

// ===== TOAST =====
function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(()=>t.remove(), 2000);
}

// ===== LOAD NEWS =====
function loadNews(m='All', q=null){
  mode = m;
  const grid = document.getElementById('news-grid');
  if(!grid) return;

  grid.innerHTML = '<div class="loader">Loading...</div>';

  let url = '/api/news?category=All';
  if(m==='search') url = `/api/search?q=${encodeURIComponent(q)}`;
  else if(m!=='All') url = `/api/news?category=${m}`;

  // bookmarks mode
  if(m==='bookmarks'){
    fetch('/api/news?category=All')
    .then(r=>r.json())
    .then(d=>{
      const b = getBms();
      DATA = d.articles.filter(a => b.includes(String(a.id)));
      page=1;
      render();
    });
    return;
  }

  fetch(url)
    .then(r=>r.json())
    .then(d=>{
      DATA = d.articles || [];
      page = 1;
      render();
    })
    .catch(()=> grid.innerHTML = '<div class="loader">Error loading news</div>');
}

// ===== ACTIONS =====
function toggleLike(id){
  const l = getLikes();
  l[id] ? delete l[id] : l[id] = 1;
  setLikes(l);
  render();
}

function toggleBookmark(id){
  let b = getBms();
  b.includes(id) ? b = b.filter(x=>x!==id) : b.push(id);
  setBms(b);
  render();
  toast(b.includes(id) ? '🔖 Saved' : 'Removed');
}

// ===== RENDER =====
function render(){
  const grid = document.getElementById('news-grid');
  const pager = document.getElementById('pagination-container');
  if(!grid) return;

  const likes = getLikes();
  const bms = getBms();

  const total = Math.ceil(DATA.length / PER_PAGE);
  const items = DATA.slice((page-1)*PER_PAGE, page*PER_PAGE);

  if(!items.length){
    grid.innerHTML = '<div class="loader">No articles found</div>';
    return;
  }

  grid.innerHTML = items.map(a=>{
    const id = String(a.id);
    const liked = likes[id];
    const saved = bms.includes(id);

    return `
    <div class="card">

      ${a.img ? `<img class="card-img" src="${a.img}" onerror="this.style.display='none'">` : ''}

      <div class="card-body">
        <span class="badge">${a.category}</span>
        <h3><a href="${a.url || '#'}" target="_blank">${a.title}</a></h3>
        <p class="summ">${a.summary}</p>

        <div class="meta">
          <span>${a.source}</span>
          <span>${a.date}</span>
        </div>
      </div>

      <div class="acts">
        <button class="abtn ${liked?'liked':''}" onclick="toggleLike('${id}')">
          ${liked ? '❤️' : '👍'}
        </button>

        <button class="abtn ${saved?'saved':''}" onclick="toggleBookmark('${id}')">
          ${saved ? '🔖' : '📑'}
        </button>
      </div>

    </div>`;
  }).join('');

  // ===== PAGINATION =====
  pager.innerHTML = total > 1
    ? Array.from({length: total}, (_,i)=>
        `<button class="pbtn ${page===i+1?'on':''}" onclick="page=${i+1};render();window.scrollTo(0,0)">${i+1}</button>`
      ).join('')
    : '';
}

// ===== SEARCH =====
function globalSearch(){
  const q = document.getElementById('global-search').value.trim();
  if(q) location.href = '/search?q=' + encodeURIComponent(q);
}

// ===== CATEGORY =====
function filterByCategory(c){
  location.href = c==='All' ? '/' : `/category/${c}`;
}