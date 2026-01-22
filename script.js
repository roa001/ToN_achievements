// データを3分割
let mainAch = [];     // achievements.json（通常）
let fesAch = [];      // fes.json
let legacyAch = [];   // legacy.json

// フィルタ状態（通常のみ対象）
let allTags = [];
let includeTags = new Set();   // AND
let excludeTags = new Set();   // OR
let ownedFilter = "all";       // all | owned | unowned

document.addEventListener("DOMContentLoaded", init);

async function init(){
  try{
    const [m,f,l] = await Promise.all([
      fetch("./achievements.json?ts="+Date.now()).then(r=>r.json()),
      fetch("./fes_achievements.json?ts="+Date.now()).then(r=> r.ok ? r.json() : []),
      fetch("./legacy_achievements.json?ts="+Date.now()).then(r=> r.ok ? r.json() : []),
    ]);
    mainAch   = m;
    fesAch    = f;
    legacyAch = l;
  }catch(e){
    console.error(e);
    document.getElementById("gridMain").textContent = "データ読込エラー";
    return;
  }

  // 所持状況を復元（データセットごとに別キー）
  restoreOwned(mainAch,   "main");
  restoreOwned(fesAch,    "fes");
  restoreOwned(legacyAch, "legacy");

  // タグ一覧は通常データから生成
  buildTagListsFrom(mainAch);

  bindFilterEvents();
  bindDatasetToggles();

  renderAll();
}

function restoreOwned(list, ns){
  list.forEach(a=>{
    const saved = localStorage.getItem(`achv_${ns}_` + a.id);
    if(saved!==null) a.owned = (saved==="true");
  });
}
function persistOwned(ns, a){
  localStorage.setItem(`achv_${ns}_` + a.id, a.owned);
}

function buildTagListsFrom(list){
  const set = new Set();
  list.forEach(a => (a.tags||[]).forEach(t=>{
    if(!t) return;
    const s = String(t).trim();
    if(s && s.toLowerCase()!=="null") set.add(s); // "null" 文字列は無視
  }));
  // ここで好きな順番を定義（この順で表示される）
const TAG_ORDER = [
  "生存",
  "死亡",
  "霧",
  "ブラッドパス",
  "パニッシュ",
  "狂気",
  "オルタネイト",
  "ミッドナイト",
  "サボタージュ",
  "マーダー",
  "アンバウンド",
  "ゴースト",
  "8ページ",
  "Run",
  "ムーン",
  "アイテム解放",
  "特定アイテム所持",
  "特定テラー",
  "特定マップ",
  "遭遇",
  "スタン",
  "UFOキャッチャー",
  "居続ける",
  "コンプリート",
  "コラボ",
  "その他",
];

// TAG_ORDER に入ってないタグは最後に回す（最後は50音順で整理）
function sortTagsCustom(tags){
  const orderIndex = new Map(TAG_ORDER.map((t, i) => [t, i]));

  return tags.sort((a, b) => {
    const ia = orderIndex.has(a) ? orderIndex.get(a) : 9999;
    const ib = orderIndex.has(b) ? orderIndex.get(b) : 9999;

    // どちらも定義済みなら順番通り
    if (ia !== 9999 || ib !== 9999) return ia - ib;

    // どちらも未定義なら50音順（日本語対応）
    return a.localeCompare(b, "ja");
  });
}

  allTags = sortTagsCustom(Array.from(set));


  const inc = document.getElementById("includeBox");
  const exc = document.getElementById("excludeBox");
  inc.innerHTML = ""; exc.innerHTML = "";

  allTags.forEach(tag=>{
    const mk = (parent, bucket)=>{
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = tag;
      cb.addEventListener("change", ()=>{
        if(cb.checked) bucket.add(tag); else bucket.delete(tag);
        renderMain();
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
      renderMain();
    });
  });

  document.getElementById("resetFilter").addEventListener("click", ()=>{
    includeTags.clear(); excludeTags.clear();
    document.querySelectorAll("#includeBox input[type=checkbox], #excludeBox input[type=checkbox]")
      .forEach(cb=>cb.checked=false);
    ownedFilter = "all";
    document.querySelector('input[name="ownedFilter"][value="all"]').checked = true;
    renderMain();
  });
}

function bindDatasetToggles(){
  const tgF = document.getElementById("toggleFes");
  const tgL = document.getElementById("toggleLegacy");
  tgF.addEventListener("change", renderBottom);
  tgL.addEventListener("change", renderBottom);
}

function filterItem(a){
  if(ownedFilter==="owned" && !a.owned)  return false;
  if(ownedFilter==="unowned" && a.owned) return false;

  const tags = a.tags || [];
  for(const t of includeTags){ if(!tags.includes(t)) return false; }
  for(const t of excludeTags){ if(tags.includes(t)) return false; }
  return true;
}

function renderAll(){ renderMain(); renderBottom(); }

// 通常（カウント対象）
function renderMain(){
  const grid = document.getElementById("gridMain");
  grid.innerHTML = "";

  const shown = mainAch.filter(filterItem);
  shown.forEach(a => grid.appendChild(makeCell("main", a)));

  updateCount();
}

// Fes / Legacy（フィルタ対象外・カウント外）
function renderBottom(){
  const showFes    = document.getElementById("toggleFes").checked;
  const showLegacy = document.getElementById("toggleLegacy").checked;

  const gf = document.getElementById("gridFes");
  const gl = document.getElementById("gridLegacy");

  gf.previousElementSibling.style.display = showFes ? "" : "none";
  gl.previousElementSibling.style.display = showLegacy ? "" : "none";
  gf.style.display = showFes ? "grid" : "none";
  gl.style.display = showLegacy ? "grid" : "none";

  if(showFes){
    gf.innerHTML = "";
    fesAch.forEach(a => gf.appendChild(makeCell("fes", a)));
  }
  if(showLegacy){
    gl.innerHTML = "";
    legacyAch.forEach(a => gl.appendChild(makeCell("legacy", a)));
  }
}

function updateCount(){
  const total = mainAch.length;
  const filtered = document.querySelectorAll("#gridMain .cell").length;
  const ownedCount = mainAch.filter(a=>a.owned).length;
  document.getElementById("count").textContent =
    `表示: ${filtered} / 全 ${total}（所持 ${ownedCount}）`;
}

function makeCell(namespace, a){
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
    persistOwned(namespace, a);
    cell.className = `cell ${a.owned ? "owned" : "unowned"}`;
    if(namespace==="main") updateCount();
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
  return cell;
}
