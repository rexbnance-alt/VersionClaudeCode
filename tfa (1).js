// ── 2FA Firebase Config (compat SDK) ──
const tfaFirebaseConfig = {
  apiKey: "AIzaSyAPemqQ6bAf9DWZ8gYR2-yAAbiqAeTzu5c",
  authDomain: "cardmri-2fa.firebaseapp.com",
  projectId: "cardmri-2fa",
  storageBucket: "cardmri-2fa.firebasestorage.app",
  messagingSenderId: "853767072548",
  appId: "1:853767072548:web:037ab9958219f9f142e1b1"
};
const tfaApp = firebase.initializeApp(tfaFirebaseConfig, "tfa-app");
const tfaDb  = tfaApp.firestore();

const TFA_SESSION_KEY = "c4rdmr12fa";
function tfaEncryptUser(u){return btoa(u.split("").map((c,i)=>String.fromCharCode(c.charCodeAt(0)^TFA_SESSION_KEY.charCodeAt(i%TFA_SESSION_KEY.length))).join(""));}
function tfaDecryptUser(e){try{const d=atob(e);return d.split("").map((c,i)=>String.fromCharCode(c.charCodeAt(0)^TFA_SESSION_KEY.charCodeAt(i%TFA_SESSION_KEY.length))).join("");}catch(e){return null;}}

let tfaCurrentUser = tfaDecryptUser(localStorage.getItem("2fa_user")||"")||null;
let tfaAccounts = [];

window.tfaLogin = async function(){
  const username=document.getElementById("tfa-login-input").value.trim().toLowerCase();
  const errEl=document.getElementById("tfa-login-error");
  const btn=document.getElementById("tfa-login-btn");
  errEl.style.display="none";
  if(!username){errEl.textContent="Please enter your name.";errEl.style.display="block";return;}
  btn.disabled=true;btn.textContent="Checking...";
  try{
    const snap=await tfaDb.collection("whitelist").doc(username).get();
    if(!snap.exists||snap.data().active===false){
      errEl.textContent="Name not found. Please contact your admin.";errEl.style.display="block";
      btn.disabled=false;btn.textContent="Continue";return;
    }
    tfaCurrentUser=username;
    localStorage.setItem("2fa_user",tfaEncryptUser(username));
    btn.disabled=false;btn.textContent="Continue";
    tfaShowMain();
  }catch(e){
    errEl.textContent="Connection error. Please try again.";errEl.style.display="block";
    btn.disabled=false;btn.textContent="Continue";
  }
};

window.tfaLogout=function(){
  tfaCurrentUser=null;tfaAccounts=[];
  localStorage.removeItem("2fa_user");
  document.getElementById("tfa-login-wrap").style.display="";
  document.getElementById("tfa-main-wrap").style.display="none";
  document.getElementById("tfa-login-input").value="";
  document.getElementById("tfa-login-error").style.display="none";
};

function tfaShowMain(){
  document.getElementById("tfa-login-wrap").style.display="none";
  document.getElementById("tfa-main-wrap").style.display="";
  document.getElementById("tfa-user-label").textContent=tfaCurrentUser;
  tfaLoadAccounts();
}

async function tfaLoadAccounts(){
  const list=document.getElementById("tfa-accounts-list");
  list.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted)">Loading...</div>';
  try{
    const snap=await tfaDb.collection("users").doc(tfaCurrentUser).collection("accounts").get();
    tfaAccounts=snap.docs.map(d=>({id:d.id,...d.data()}));
    tfaRenderAccounts();
  }catch(e){
    list.innerHTML='<div style="text-align:center;padding:24px;color:var(--red);font-size:13px">Failed to load. Check connection.</div>';
  }
}

window.tfaAddAccount=async function(){
  const name=document.getElementById("tfa-account-name").value.trim();
  const secret=document.getElementById("tfa-secret-key").value.trim().replace(/\s/g,"");
  if(!name||!secret){showToast("Please fill in all fields");return;}
  try{tfaBase32Decode(secret);}catch(e){showToast("Invalid secret key");return;}
  try{
    const ref=await tfaDb.collection("users").doc(tfaCurrentUser).collection("accounts").add({name,secret});
    tfaAccounts.push({id:ref.id,name,secret});
    document.getElementById("tfa-account-name").value="";
    document.getElementById("tfa-secret-key").value="";
    document.getElementById("tfa-qr-text").textContent="Click to upload QR image";
    document.getElementById("tfa-qr-upload").value="";
    tfaRenderAccounts();
    showToast("Account added");
  }catch(e){showToast("Failed to save.");}
};

window.tfaDeleteAccount=async function(id){
  if(!confirm("Remove this account?"))return;
  try{
    await tfaDb.collection("users").doc(tfaCurrentUser).collection("accounts").doc(id).delete();
    tfaAccounts=tfaAccounts.filter(a=>a.id!==id);
    tfaRenderAccounts();
    showToast("Account removed");
  }catch(e){showToast("Failed to delete.");}
};

function tfaBase32Decode(b32){
  const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  b32=b32.toUpperCase().replace(/=+$/,"").replace(/\s/g,"");
  let bits=0,value=0;const out=[];
  for(let i=0;i<b32.length;i++){const idx=chars.indexOf(b32[i]);if(idx===-1)throw new Error("Bad");value=(value<<5)|idx;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}
  return new Uint8Array(out);
}

async function tfaHmacSHA1(k,d){
  const key=await crypto.subtle.importKey("raw",k,{name:"HMAC",hash:"SHA-1"},false,["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC",key,d));
}

async function tfaGenerateTOTP(secret,time=Math.floor(Date.now()/1000)){
  const counter=Math.floor(time/30);
  const buf=new ArrayBuffer(8);const dv=new DataView(buf);
  dv.setUint32(0,Math.floor(counter/0x100000000),false);dv.setUint32(4,counter>>>0,false);
  const hmac=await tfaHmacSHA1(tfaBase32Decode(secret),buf);
  const offset=hmac[19]&0xf;
  const code=((hmac[offset]&0x7f)<<24)|((hmac[offset+1]&0xff)<<16)|((hmac[offset+2]&0xff)<<8)|(hmac[offset+3]&0xff);
  return String(code%1000000).padStart(6,"0");
}

function tfaRenderAccounts(){
  const list=document.getElementById("tfa-accounts-list");
  document.getElementById("tfa-account-count").textContent=tfaAccounts.length;
  if(!tfaAccounts.length){
    list.innerHTML='<div style="text-align:center;padding:32px 16px;color:var(--muted);font-size:13px">No accounts yet.</div>';
    return;
  }
  list.innerHTML=tfaAccounts.map(a=>`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 14px;margin-bottom:7px;position:relative" id="tfa-card-${a.id}">
      <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px">${a.name.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1">
          <div id="tfa-code-${a.id}" onclick="tfaCopyCode('${a.id}')" style="font-family:monospace;font-size:15px;font-weight:500;letter-spacing:3px;color:var(--text);cursor:pointer">------</div>
          <div style="font-size:9px;color:var(--muted)">tap to copy</div>
        </div>
        <div style="position:relative;width:34px;height:34px;flex-shrink:0">
          <svg style="transform:rotate(-90deg);width:34px;height:34px" viewBox="0 0 34 34">
            <circle fill="none" stroke="var(--border)" stroke-width="3" cx="17" cy="17" r="13"/>
            <circle fill="none" stroke="var(--purple)" stroke-width="3" stroke-linecap="round" stroke-dasharray="82" id="tfa-ring-${a.id}" cx="17" cy="17" r="13"/>
          </svg>
          <div id="tfa-timer-${a.id}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9px;color:var(--muted)">30</div>
        </div>
      </div>
      <button onclick="tfaDeleteAccount('${a.id}')" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:2px 6px;border-radius:6px">✕</button>
    </div>
  `).join("");
  tfaUpdateAllCodes();
}

async function tfaUpdateAllCodes(){
  const now=Math.floor(Date.now()/1000);
  const remaining=30-(now%30);
  const circ=81.7;
  for(const a of tfaAccounts){
    const codeEl=document.getElementById("tfa-code-"+a.id);
    const ringEl=document.getElementById("tfa-ring-"+a.id);
    const timerEl=document.getElementById("tfa-timer-"+a.id);
    if(!codeEl)continue;
    try{const code=await tfaGenerateTOTP(a.secret,now);codeEl.textContent=code.slice(0,3)+" "+code.slice(3);}
    catch(e){codeEl.textContent="ERROR";}
    if(ringEl){ringEl.style.strokeDasharray=circ;ringEl.style.strokeDashoffset=circ*(1-remaining/30);}
    if(timerEl)timerEl.textContent=remaining;
    if(codeEl)codeEl.style.color=remaining<=5?"var(--red)":"var(--text)";
  }
}

window.tfaCopyCode=async function(id){
  const el=document.getElementById("tfa-code-"+id);if(!el)return;
  const code=el.textContent.replace(/\s/g,"");
  try{await navigator.clipboard.writeText(code);el.style.color="var(--green)";setTimeout(()=>el.style.color="",1000);showToast("Copied!");}
  catch(e){showToast("Copy failed");}
};

window.tfaScanQR=function(input){
  const file=input.files[0];if(!file)return;
  document.getElementById("tfa-qr-text").textContent="Reading QR...";
  const reader=new FileReader();
  reader.onload=function(e){
    const img=new Image();
    img.onload=function(){
      const canvas=document.createElement("canvas");
      canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);
      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      const code=jsQR(imageData.data,imageData.width,imageData.height);
      if(!code){showToast("QR not found.");document.getElementById("tfa-qr-text").textContent="Click to upload QR image";input.value="";return;}
      try{
        const url=new URL(code.data);
        const secret=url.searchParams.get("secret")||"";
        const issuer=url.searchParams.get("issuer")||"";
        const account=decodeURIComponent(url.pathname.split("/").pop()||"");
        const appName=issuer||account.split(":").pop()||"";
        document.getElementById("tfa-account-name").value=appName;
        document.getElementById("tfa-secret-key").value=secret;
        document.getElementById("tfa-qr-text").textContent="QR scanned!";
        showToast("QR scanned!");
      }catch(err){showToast("Invalid QR format.");document.getElementById("tfa-qr-text").textContent="Click to upload QR image";}
      input.value="";
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
};

setInterval(tfaUpdateAllCodes,1000);

(function(){
  if(tfaCurrentUser){
    const lw=document.getElementById("tfa-login-wrap");
    const mw=document.getElementById("tfa-main-wrap");
    if(lw&&mw)tfaShowMain();
  }
})();
