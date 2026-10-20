const params=new URLSearchParams(location.search),roomCode=params.get("room")?.toUpperCase(),user=JSON.parse(localStorage.getItem("cartshare_user")||"null");
if(!roomCode||!user) location.href="/";
const socket=io();socket.emit("room:join",roomCode);
let room=null;
const products=[
["Milk","Grocery",65,"🥛","https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"],
["Bread","Bakery",45,"🍞","https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"],
["Eggs","Grocery",72,"🥚","https://images.unsplash.com/photo-1582722872445-44dc5e7d3f8a?auto=format&fit=crop&w=600&q=80"],
["Rice 5kg","Grocery",420,"🍚","https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"],
["Maggi","Snacks",70,"🍜","https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"],
["Potato Chips","Snacks",40,"🥔","https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80"],
["Soap","Personal Care",55,"🧼","https://images.unsplash.com/photo-1607006344380-b6775a0824d7?auto=format&fit=crop&w=600&q=80"],
["Shampoo","Personal Care",180,"🧴","https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"],
["Coffee","Beverages",220,"☕","https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80"],
["Biscuits","Snacks",60,"🍪","https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"],
["Apples","Fruits",160,"🍎","https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"],
["Bananas","Fruits",70,"🍌","https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80"]
].map((p,i)=>({id:String(i+1),name:p[0],category:p[1],price:p[2],emoji:p[3],image:p[4]}));
const $=id=>document.getElementById(id), money=n=>"₹"+Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
$("roomCodeDisplay").textContent=roomCode;$("userBadge").textContent=user.name;
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json"},...opt});const d=await r.json();if(!r.ok)throw Error(d.message||"Request failed");return d}
async function load(){room=await api(`/api/rooms/${roomCode}`);render()}
function render(){renderProducts();renderMembers();renderCart();renderActivity();summary()}
function renderProducts(){const q=$("searchProducts").value.toLowerCase(),cat=$("categoryFilter").value;const list=products.filter(p=>(p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q))&&(cat==="All"||p.category===cat));$("productGrid").innerHTML=list.map(p=>`<article class="product-card"><div class="product-image"><img src="${p.image}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span>${p.emoji}</span></div><div class="product-info"><div class="product-category">${p.category}</div><h3>${esc(p.name)}</h3><div class="product-bottom"><strong>${money(p.price)}</strong><button class="btn btn-sm btn-primary" onclick="addProduct('${p.id}')">＋ Add</button></div></div></article>`).join("")||`<p class="muted text-center py-4">No products found.</p>`}
function renderMembers(){$("memberCount").textContent=room.members.length;$("memberList").innerHTML=room.members.map(m=>`<div class="member-row"><div class="avatar">${esc(m.name[0].toUpperCase())}</div><div class="member-name">${esc(m.name)} ${m.userId===user.userId?'<span class="you-tag">YOU</span>':''}</div></div>`).join("")}
function renderCart(){const c=room.cart||[];$("emptyCart").classList.toggle("d-none",c.length>0);$("cartList").innerHTML=c.map(i=>`<div class="cart-item"><div><h3>${esc(i.productName)}</h3><div class="item-meta">${esc(i.category)} • Added by ${esc(i.addedBy)}</div></div><div class="qty-controls"><button onclick="qty('${i.productId}',${i.qty-1})">−</button><strong>${i.qty}</strong><button onclick="qty('${i.productId}',${i.qty+1})">+</button><button class="remove-btn" onclick="removeItem('${i.productId}')">🗑️</button></div><div class="item-price">${money(i.price*i.qty)}</div></div>`).join("");const units=c.reduce((s,i)=>s+i.qty,0);$("itemCountText").textContent=`${units} item${units===1?"":"s"}`}
function renderActivity(){$("activityLog").innerHTML=(room.activity||[]).slice(0,25).map(a=>`<div class="activity"><div class="activity-icon">${a.icon}</div><div><p>${esc(a.text)}</p><small>${ago(a.createdAt)}</small></div></div>`).join("")||'<p class="muted text-center py-3">No activity yet.</p>'}
function summary(){const c=room.cart||[],total=c.reduce((s,i)=>s+i.price*i.qty,0),units=c.reduce((s,i)=>s+i.qty,0),people=new Set(c.map(i=>i.addedBy)).size,p=Math.min(100,total/5000*100);$("summaryTotal").textContent=money(total);$("summaryMeta").textContent=`${units} items • ${people} contributors`;$("thresholdBar").style.width=p+"%";$("thresholdText").textContent=`${money(total)} / ₹5,000`;$("thresholdHint").textContent=total>=5000?"🎉 Free delivery threshold reached!":`${money(5000-total)} more needed for free delivery.`}
window.addProduct=async id=>{const p=products.find(x=>x.id===id);room=await api(`/api/rooms/${roomCode}/cart`,{method:"POST",body:JSON.stringify({...p,name:p.name,qty:1,addedBy:user.name,addedById:user.userId})});toast(`${p.name} added.`);render()}
window.qty=async(id,q)=>{room=await api(`/api/rooms/${roomCode}/cart/${id}`,{method:"PUT",body:JSON.stringify({qty:q,userName:user.name})});render()}
window.removeItem=async id=>{room=await api(`/api/rooms/${roomCode}/cart/${id}`,{method:"DELETE",body:JSON.stringify({userName:user.name})});render()}
$("clearCartBtn").onclick=async()=>{if(!room.cart.length||!confirm("Clear the shared cart?"))return;room=await api(`/api/rooms/${roomCode}/cart`,{method:"DELETE",body:JSON.stringify({userName:user.name})});render()}
$("copyRoomBtn").onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);toast("Room code copied!")}catch{toast(roomCode)}}
$("receiptBtn").onclick=()=>location.href=`/receipt.html?room=${roomCode}`;
$("leaveBtn").onclick=()=>{localStorage.removeItem("cartshare_user");location.href="/"}
$("searchProducts").oninput=renderProducts;$("categoryFilter").onchange=renderProducts;
[...new Set(products.map(p=>p.category))].sort().forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;$("categoryFilter").appendChild(o)});
socket.on("room:updated",data=>{room=data;render()});
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function ago(t){const s=Math.floor((Date.now()-new Date(t))/1000);if(s<10)return"just now";if(s<60)return`${s}s ago`;const m=Math.floor(s/60);if(m<60)return`${m}m ago`;return`${Math.floor(m/60)}h ago`}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>$("toast").classList.remove("show"),1800)}
load().catch(e=>{alert(e.message);location.href="/"});
setInterval(()=>{if(room)renderActivity()},10000);
