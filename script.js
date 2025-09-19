const dbg = (m)=>{ const el=document.getElementById('debug'); if(el){ el.textContent += m + "\n"; } };

let achievements = [];
dbg("JS booted");

async function loadData(){
  try{
    dbg("fetch start: ./achievements.json");
    const res = await fetch("./achievements.json?ts="+Date.now());
    dbg("fetch status: " + res.status);
    if(!res.ok) throw new Error(`fetch失敗 ${res.status} ${res.statusText}`);
    const txt = await res.text();
    dbg("json bytes: " + txt.length);
    achievements = JSON.parse(txt);
  }catch(e){
    dbg("loadData error: " + e);
    document.getElementById("grid").textContent = "データの読み込みに失敗しました。";
    return;
  }

  // localStorage反映
  achievements.forEach(a=>{
    const saved = localStorage.getItem("achv_"+a.id);
    if(saved!==null) a.owned = (saved==="true");
  });

  render();
}

function render(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  achievements.forEach(a=>{
    const cell = document.createElement("div");
    cell.className = `cell ${a.owned ? "owned" : "unowned"}`;

    const img = document.createElement("img");
    img.src = (a.image && a.image.trim()!=="") ? a.image : "./images/placeholder.png";
    img.alt = a.title;
    img.addEventListener("click", ()=>{
      a.owned = !a.owned;
      localStorage.setItem("achv_"+a.id, a.owned);
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

loadData();
