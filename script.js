let achievements = [];

async function loadData() {
  const res = await fetch("achievements.json");
  achievements = await res.json();

  // localStorageから所持状況を復元
  achievements.forEach(a => {
    const saved = localStorage.getItem("achv_" + a.id);
    if (saved !== null) a.owned = saved === "true";
  });

  render();
}

function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = `cell ${a.owned ? "owned" : "unowned"}`;

    // 画像（無ければプレースホルダー）
    const img = document.createElement("img");
    img.src = a.image && a.image.trim() !== "" ? a.image : "images/placeholder.png";
    img.alt = a.title;

    // クリックで所持状況を切替
    img.addEventListener("click", () => {
      a.owned = !a.owned;
      localStorage.setItem("achv_" + a.id, a.owned);
      render();
    });

    // ツールチップ
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = a.condition;

    // タイトル
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = a.title;

    div.appendChild(img);
    div.appendChild(tooltip);
    div.appendChild(title);
    grid.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", loadData);
