let achievements = [];
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

  render();
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

      // ツールチップ
      const tip = document.createElement("div");
      tip.className = "tooltip";
      tip.textContent = a.condition;

      // タイトル
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

  // 含めるタグ: すべて含まれているか
  for (const t of includeTags) {
    if (!tags.includes(t)) return false;
  }

  // 除外タグ: 一つでも含まれていたらNG
  for (const t of excludeTags) {
    if (tags.includes(t)) return false;
  }

  return true;
}

function applyFilter() {
  includeTags = document.getElementById("includeTags").value
    .split(/[ ,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  excludeTags = document.getElementById("excludeTags").value
    .split(/[ ,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  render();
}

function resetFilter() {
  document.getElementById("includeTags").value = "";
  document.getElementById("excludeTags").value = "";
  includeTags = [];
  excludeTags = [];
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("applyFilter").addEventListener("click", applyFilter);
  document.getElementById("resetFilter").addEventListener("click", resetFilter);
});
