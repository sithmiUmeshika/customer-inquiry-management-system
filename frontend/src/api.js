const base=import.meta.env.VITE_API_URL||'http://localhost:4000';
export async function api(path,options={}){
 let response;
 try{response=await fetch(`${base}${path}`,{credentials:'include',headers:{'Content-Type':'application/json'},...options});}
 catch{throw new Error('Cannot connect to server. Check that the backend is running.');}
 const payload=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(payload.error?.message||`Request failed (${response.status})`);error.code=payload.error?.code;error.details=payload.error?.details;throw error;}
 return payload;
}
