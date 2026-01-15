let transactions=JSON.parse(localStorage.getItem("transactions"))||[];
let currency=localStorage.getItem("currency")||"₪";
let theme=localStorage.getItem("theme")||"light";
document.body.classList.toggle("dark",theme==="dark");
document.getElementById("currencyButton").textContent=currency;

const summaryEl=document.getElementById("summary");
const transactionsEl=document.getElementById("transactions");
const chartCtx=document.getElementById("chart").getContext("2d");
const modal=document.getElementById("modal");
const editModal=document.getElementById("editModal");
const resetModal=document.getElementById("resetModal");
const deleteModal=document.getElementById("deleteModal");
let action=null,editIndex=null,deleteIndex=null;

/* --- Modal Controls --- */
function openModal(type){
  action=type;
  document.getElementById("modalTitle").textContent=type==="add"?"Add Money":"Spend Money";
  document.getElementById("amountInput").value="";
  document.getElementById("reasonInput").value="";
  modal.classList.add("show");
}
function closeModal(){modal.classList.remove("show");}
function openEditModal(i){
  editIndex=i;
  const tx=transactions[i];
  document.getElementById("editAmount").value=tx.amount;
  document.getElementById("editReason").value=tx.reason||"";
  editModal.classList.add("show");
}
function closeEditModal(){editModal.classList.remove("show");}
function openResetModal(){resetModal.classList.add("show");}
function closeResetModal(){resetModal.classList.remove("show");}
function openDeleteModal(i){deleteIndex=i;deleteModal.classList.add("show");}
function closeDeleteModal(){deleteModal.classList.remove("show");deleteIndex=null;}

/* --- Data & Rendering --- */
function save(){localStorage.setItem("transactions",JSON.stringify(transactions));}
function render(){
  const income=transactions.filter(t=>t.type==="add").reduce((a,b)=>a+b.amount,0);
  const spent=transactions.filter(t=>t.type==="spent").reduce((a,b)=>a+b.amount,0);
  const balance=income-spent;
  summaryEl.textContent=`Balance: ${currency}${balance.toFixed(2)} | Income: ${currency}${income.toFixed(2)} | Spent: ${currency}${spent.toFixed(2)}`;
  transactionsEl.innerHTML="";
  transactions.forEach((t,i)=>{
    const div=document.createElement("div");
    div.className="transaction";
    div.innerHTML=`<span>${t.type==="add"?"+":"-"}${currency}${t.amount.toFixed(2)} ${t.reason?`for ${t.reason}`:""} (${t.time})</span>
      <span><button onclick="openEditModal(${i})">✏️</button> <button onclick="openDeleteModal(${i})">🗑️</button></span>`;
    transactionsEl.appendChild(div);
  });
  drawChart();save();
}
function drawChart(){
  const cats={};
  transactions.filter(t=>t.type==="spent").forEach(t=>cats[t.reason||"Other"]=(cats[t.reason||"Other"]||0)+t.amount);
  const data={labels:Object.keys(cats),datasets:[{data:Object.values(cats),
    backgroundColor:['#f88','#8f8','#88f','#ff8','#8ff','#f8f']} ]};
  if(window.chartInstance){window.chartInstance.data=data;window.chartInstance.update();}
  else window.chartInstance=new Chart(chartCtx,{type:'pie',data});
}

/* --- Event Bindings --- */
document.getElementById("addBtn").onclick=()=>openModal("add");
document.getElementById("spentBtn").onclick=()=>openModal("spent");
document.getElementById("cancelBtn").onclick=closeModal;
document.getElementById("okBtn").onclick=()=>{
  const amount=parseFloat(document.getElementById("amountInput").value);
  const reason=document.getElementById("reasonInput").value.trim();
  if(isNaN(amount)||amount<=0)return;
  const time=new Date().toLocaleString();
  transactions.push({type:action,amount,reason,time});
  closeModal();render();
};
document.getElementById("resetBtn").onclick=openResetModal;
document.getElementById("resetCancelBtn").onclick=closeResetModal;
document.getElementById("resetConfirmBtn").onclick=()=>{transactions=[];render();closeResetModal();};
document.getElementById("editCancelBtn").onclick=closeEditModal;
document.getElementById("editSaveBtn").onclick=()=>{
  const amt=parseFloat(document.getElementById("editAmount").value);
  const reason=document.getElementById("editReason").value.trim();
  if(editIndex!==null&&!isNaN(amt)&&amt>0){
    transactions[editIndex].amount=amt;
    transactions[editIndex].reason=reason;
    render();
  }
  closeEditModal();
};
document.getElementById("deleteCancelBtn").onclick=closeDeleteModal;
document.getElementById("deleteConfirmBtn").onclick=()=>{
  if(deleteIndex!==null){transactions.splice(deleteIndex,1);render();}
  closeDeleteModal();
};

/* --- Theme & Currency --- */
document.getElementById("themeToggle").onclick=()=>{
  document.body.classList.toggle("dark");
  theme=document.body.classList.contains("dark")?"dark":"light";
  localStorage.setItem("theme",theme);
};
const currencies=["₪","$","€","₹"];
let idx=currencies.indexOf(currency);
const currencyBtn=document.getElementById("currencyButton");
currencyBtn.onclick=()=>{
  idx=(idx+1)%currencies.length;
  currency=currencies[idx];
  currencyBtn.textContent=currency;
  localStorage.setItem("currency",currency);
  render();
};

/* --- Export --- */
document.getElementById("exportBtn").onclick=()=>{
  if(!transactions.length)return;
  const lines=transactions.map((t,i)=>`#${i+1} | ${t.time} | ${t.reason||"-"} | ${currency}${t.amount.toFixed(2)} (${t.type})`).join("\n");
  const blob=new Blob([lines],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="transactions.txt";a.click();
  URL.revokeObjectURL(url);
};

/* --- Init --- */
render();