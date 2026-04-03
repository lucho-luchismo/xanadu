
let items = JSON.parse(localStorage.getItem("xanadu_v2")||"[]");

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const count = document.getElementById("count");

function render(){
  grid.innerHTML="";
  if(items.length===0){
    empty.style.display="block";
  } else {
    empty.style.display="none";
  }

  items.forEach(it=>{
    const el=document.createElement("div");
    el.className="card";
    el.innerHTML=`<b>${it.t}</b><br>${it.a}`;
    grid.appendChild(el);
  });

  count.textContent=items.length;
}

render();

document.getElementById("add").onclick=()=>{
  document.getElementById("form").classList.remove("hidden");
};

document.getElementById("save").onclick=()=>{
  const t=document.getElementById("t").value;
  const a=document.getElementById("a").value;

  if(!t) return;

  items.unshift({t,a});
  localStorage.setItem("xanadu_v2",JSON.stringify(items));
  document.getElementById("form").classList.add("hidden");
  render();
};
