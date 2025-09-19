let achievements = [];
let allTags = [];
let includeTags = new Set();
let excludeTags = new Set();
let ownedFilter = "all"; // all | owned | unowned

async function loadData(){
  const res = await fetch("./achievements.json");
  achievements = await res.json();

  // 所持状況を復元
  achievements.forEach(a=>{
    const saved = localStorage.getItem("achv_"+a.id);
    if(saved!==null) a.owned = (saved==="true");
  });

  buildTagLists();
  bindFilterEvents();
  render();
}

function buildTagLists(){
  // タグを収集（"null"や空は除外）
  const set = new Set();
  achievements.forEach(a => (a.tags||[]).forEach(t=>{
    if(!t) return;
    const s = String(t).trim();
    if(s && s.toLowerCase()!=="null") set.add(s);
  }));
  allTags = Array.from(set).sort();

  // チェックボックスを生成
  const inc = document.getElementById("includeBox");
  const exc = document.getElementById("excludeBox");
  inc.innerHTML = ""; exc.innerHTML = "";

  allTags.forEach(tag=>{
    const mk = (boxId, bucket)=>{
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
      document.getElementById(boxId).appendChild(label);
    };
    mk("includeBox", includeTags);
    mk("excludeBox", excludeTags);
  });
}

function bindFilterEvents(){
  // 所持ステータス
  document.querySelectorAll('input[name="ownedFilter"]').forEach(r=>{
    r.addEventListener("change", e=>{
      ownedFilter = e.target.value;
      render();
    });
  });

  // リセット
  document.getElementById("resetFilter").addEventListener("click", ()=>{
    includeTags.clear();
    excludeTags.clear();
    document.querySelectorAll("#includeBox input[type=checkbox], #excludeBox input[type=checkbox]")
      .forEach(cb => cb.checked = false);
    ownedFilter = "all";
    document.querySelector('input[name="ownedFilter"][value="all"]').checked = true;
    render();
  });
}

function filterItem(a){
  // 所持ステータス
  if(ownedFilter==="owned" && !a.owned) return false;
  if(ownedFilter==="unowned" && a.owned) return false;

  const tags = a.tags || [];

  // 含める（AND）: すべて含んでいるか
  for(const t of includeTags){
    if(!tags.includes(t)) return false;
  }

  // 除外（OR）: どれか1つでも含んでいたら除外
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

    // 画像枠（固定サイズ）
    const wrap = document.createElement("div");
    wrap.className = "imgwrap";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = a.image && a.image.trim()!=="" ? a.image : "./images/placeholder.png";
    img.alt = a.title;
    img.onerror = () => { img.src = "./images/placeholder.png"; };

    // クリックで所持切替
    img.addEventListener("click", ()=>{
      a.owned = !a.owned;
      localStorage.setItem("achv_"+a.id, a.owned);
      // クラスだけ更新して再描画最小化
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

document.addEventListener("DOMContentLoaded", loadData);
