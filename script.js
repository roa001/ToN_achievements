let achievements = [];
let allTags = [];
let includeTags = new Set();   // AND
let excludeTags = new Set();   // OR
let ownedFilter = "all";       // all | owned | unowned

document.addEventListener("DOMContentLoaded", init);

async function init(){
  try{
    // キャッシュ回避つき（Pagesの強キャッシュ対策）
    const res = await fetch("./achievements.json?ts="+Date.now());
    if(!res.ok) throw new Error("JSON fetch failed: " + res.status);
    achievements = await res.json();
  }catch(e){
    console.error(e);
    document.getElementById("grid").textContent = "データの読み込みに失敗しました。";
    return;
  }

  // 所持状況を復元
  achievements.forEach(a=>{
    const saved = localStorage.getItem("achv_"+a.id);
    if(saved!==null) a.owned = (saved==="true");
  });

  buildTagLists();   // ← JSONから動的にタグ一覧を生成
  bindFilterEvents();
  render();
}

function buildTagLists(){
  const set = new Set();
  achievements.forEach(a => (a.tags||[]).forEach(t=>{
    if(!t) return;
    const s = String(t).trim();
    if(s && s.toLowerCase()!=="null") set.add(s);   // "null" という文字列は除外 :contentReference[oaicite:0]{index=0}
  }));
  allTags = Array.from(set).sort();

  const inc = document.getElementById("includeBox");
  const exc = document.getElementById("excludeBox");
  inc.innerHTML = ""; exc.innerHTML = "";

  // タグが一つも無いなら「タグなし」と表示（UX向上）
  if(allTags.length===0){
    inc.textContent = "（タグなし）";
    exc.textContent = "（タグなし）";
    return;
  }

  allTags.forEach(tag=>{
    const mk = (parent, bucket)=>{
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = tag;
      cb.addEventListener("change", ()=>{
        if(cb.checked) bucket.add(tag); else bucket.delete(tag);
        render();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(tag));
      parent.appendChild(label);
    };
    mk(inc, includeTags);
    mk(exc, excludeTags);
  });
}

function bindFilterEvents(){
  document.querySelectorAll('input[name="ownedFilter"]').forEach(r=>{
    r.addEventListener("change", e=>{
      ownedFilter = e.target.value;
      render();
    });
  });

  document.getElementById("resetFilter").addEventListener("click", ()=>{
    includeTags.clear(); excludeTags.clear();
    document.querySelectorAll("#includeBox input[type=checkbox], #excludeBox input[type=checkbox]")
      .forEach(cb=>cb.checked=false);
    ownedFilter = "all";
    document.querySelector('input[name="ownedFilter"][value="all"]').checked = true;
    render();
  });
}

function filterItem(a){
  if(ownedFilter==="owned" && !a.owned)  return false;
  if(ownedFilter==="unowned" && a.owned) return false;

  const tags = a.tags || [];

  // 含める（AND）
  for(const t of includeTags){
    if(!tags.includes(t)) return false;
  }
  // 除外（OR）
  for(const t of excludeTags){
    if(tags.includes(t)) return false;
  }
  return true;
}

function render(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const shown = achievements.filter(filterItem);

  shown.forEach(a=>{
    const cell = document.createElement("div");
    cell.className = `cell ${a.owned ? "owned" : "unowned"}`;

    const wrap = document.createElement("div");
    wrap.className = "imgwrap";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = a.image && a.image.trim()!=="" ? a.image : "./images/placeholder.png";
    img.alt = a.title;
    img.onerror = ()=>{ img.src = "./images/placeholder.png"; };

    img.addEventListener("click", ()=>{
      a.owned = !a.owned;
      localStorage.setItem("achv_"+a.id, a.owned);
      cell.className = `cell ${a.owned ? "owned" : "unowned"}`;
      updateCount();
    });

    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.textContent = a.condition;

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = a.title;

    wrap.appendChild(img);
    cell.appendChild(wrap);
    cell.appendChild(tip);
    cell.appendChild(title);
    grid.appendChild(cell);
  });

  updateCount();
}

function updateCount(){
  const total = achievements.length;
  const filtered = document.querySelectorAll("#grid .cell").length;
  const ownedCount = achievements.filter(a=>a.owned).length;
  document.getElementById("count").textContent =
    `表示: ${filtered} / 全 ${total}（所持 ${ownedCount}）`;
}
