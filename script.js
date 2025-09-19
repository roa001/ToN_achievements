let achievements = [];
let allTags = [];
let includeTags = [];
let excludeTags = [];

async function loadData() {
  const res = await fetch("./achievements.json");
  achievements = await res.json();

  // localStorage反映
  achievements.forEach(a => {
    const saved = localStorage.getItem("achv_" + a.id);
    if (saved !== null) a.owned = saved === "true";
  });

  // タグ一覧を抽出してUI生成
  buildTagOptions();

  render();
}

function buildTagOptions() {
  const tagSet = new Set();

  achievements.forEach(a => {
    (a.tags || []).forEach(t => {
      if (t && t.toLowerCase() !== "null") tagSet.add(t);
    });
  });

  allTags = Array.from(tagSet).sort();

  const includeSel = document.getElementById("includeTags");
  const excludeSel = document.getElementById("excludeTags");

  includeSel.innerHTML = "";
  excludeSel.innerHTML = "";

  allTags.forEach(tag => {
    const opt1 = document.createElement("option");
    opt1.value = tag;
    opt1.textContent = tag;
    includeSel.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = tag;
    opt2.textContent = tag;
    excludeSel.appendChild(opt2);
  });
}

function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  achievements
    .filter(a => filterByTags(a))
    .forEach(a => {
      const cell = document.createElement("div");
      cell.className = `cell ${a.owned ? "owned" : "unowned"}`;

      const img = document.createElement("img");
      img.src = a.image && a.image.trim() !== "" ? a.image : "./images/placeholder.png";
      img.alt = a.title;
      img.onerror = () => { img.src = "./images/placeholder.png"; };

      // クリックで所持切替
      img.addEventListener("click", () => {
        a.owned = !a.owned;
        localStorage.setItem("achv_" + a.id, a.owned);
        render();
      });

      const tip = document.createElement("div");
      tip.className = "tooltip";
      tip.textContent = a.condition;

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = a.title;

      cell.appendChild(img);
      cell.appendChild(tip);
      cell.appendChild(title);
      grid.appendChild(cell);
    });
}

function filterByTags(a) {
  const tags = a.tags || [];

  // 含めるタグ: すべて含んでいるか
  for (const t of includeTags) {
    if (!tags.includes(t)) return false;
  }

  // 除外タグ: 1つでも含んでいればNG
  for (const t of excludeTags) {
    if (tags.includes(t)) return false;
  }

  return true;
}

function applyFilter() {
  const includeSel = document.getElementById("includeTags");
  const excludeSel = document.getElementById("excludeTags");

  includeTags = Array.from(includeSel.selectedOptions).map(o => o.value);
  excludeTags = Array.from(excludeSel.selectedOptions).map(o => o.value);

  render();
}

function resetFilter() {
  document.getElementById("includeTags").selectedIndex = -1;
  document.getElementById("excludeTags").selectedIndex = -1;
  includeTags = [];
  excludeTags = [];
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("applyFilter").addEventListener("click", applyFilter);
  document.getElementById("resetFilter").addEventListener("click", resetFilter);
});
