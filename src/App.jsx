import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock, MapPin, Users, User, PlusCircle, X, Bell,
  LayoutDashboard, ListOrdered, MonitorSmartphone, ChevronRight, ChevronLeft,
  CheckCircle2, Search, Settings, QrCode, LockKeyhole
} from "lucide-react";

const API_BASE = "";

const STAFF_FALLBACK = [
  { id: "s1", name: "Alex", role: "Barber" },
  { id: "s2", name: "Bea", role: "Stylist" },
  { id: "s3", name: "Carlo", role: "Therapist" },
];
const SERVICES = [
  { id: "svc1", name: "Haircut", mins: 45 },
  { id: "svc2", name: "Shave", mins: 30 },
  { id: "svc3", name: "Color", mins: 60 },
  { id: "svc4", name: "Massage", mins: 60 },
];

function fmtTime(h,m=0){ return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function genTimeSlots(hours){ const slots=[]; for(let h=hours.open; h<hours.close; h++){ slots.push({id:`${h}:00`,label:fmtTime(h,0)}); slots.push({id:`${h}:30`,label:fmtTime(h,30)});} return slots; }

async function api(path, opts={}){
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers||{}) },
    ...opts,
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function Toast({ message, onClose }){
  useEffect(()=>{ const t=setTimeout(onClose,2500); return ()=>clearTimeout(t); },[onClose]);
  return (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl flex items-center gap-2">
    <CheckCircle2 className="w-5 h-5"/><span className="text-sm">{message}</span></div>);
}
const Card=({children,className=""})=>(<div className={`rounded-2xl bg-white/80 backdrop-blur shadow-sm border border-slate-200 ${className}`}>{children}</div>);
const SectionTitle=({icon:Icon,title,hint})=>(<div className="flex items-center gap-2 mb-3"><Icon className="w-5 h-5"/><h3 className="font-semibold text-slate-800">{title}</h3>{hint&&<span className="text-xs text-slate-500">{hint}</span>}</div>);

function InstallBanner(){
  const [show,setShow]=useState(()=>localStorage.getItem("qe_install_dismissed")!=="true");
  if(!show) return null;
  return (<div className="fixed bottom-0 inset-x-0 z-40">
    <div className="mx-auto max-w-5xl m-3 p-4 rounded-2xl bg-indigo-600 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3"><MonitorSmartphone className="w-6 h-6"/><div><div className="font-semibold">Install QueueEasy to your Home Screen</div>
      <div className="text-sm opacity-90">Faster access, offline queue status, and push updates.</div></div></div>
      <div className="flex gap-2">
        <button onClick={()=>{localStorage.setItem("qe_install_dismissed","true"); setShow(false);}} className="px-3 py-2 rounded-xl bg-white text-indigo-700 font-medium">Dismiss</button>
        <button onClick={()=>alert("On a real PWA, this would trigger the install prompt.")} className="px-3 py-2 rounded-xl bg-black/20 font-medium">Install</button>
      </div>
    </div></div>);
}

function TopNav({active,setActive,shops,activeShopId,setActiveShopId}){
  return (<div className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-slate-200">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
      <QrCode className="w-6 h-6 text-indigo-600"/><div className="font-bold text-slate-800">QueueEasy</div>
      <div className="hidden md:block text-slate-400">—</div>
      <div className="hidden md:flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4"/>
        <select value={activeShopId||""} onChange={(e)=>setActiveShopId(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1">
          {shops.map(s=>(<option key={s._id} value={s._id}>{s.name}</option>))}
        </select>
      </div>
      <div className="ml-auto flex gap-1">
        {[{id:"customer",label:"Book",icon:CalendarDays},{id:"queue",label:"Queue Board",icon:ListOrdered},{id:"admin",label:"Admin",icon:LayoutDashboard}].map(tab=>(
          <button key={tab.id} onClick={()=>setActive(tab.id)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${active===tab.id?"bg-indigo-600 text-white border-indigo-600":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
            <tab.icon className="w-4 h-4"/>{tab.label}
          </button>
        ))}
      </div>
    </div></div>);
}

function useShops(){
  const [shops,setShops]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ (async()=>{
    try{ const data = await api("/api/shops"); setShops(data); }
    catch{ setShops([{_id:"local1",name:"QueueEasy Demo – Pioneer",address:"123 Pioneer St",hours:{open:9,close:19},phone:"+63 917 000 0000",adminCode:"1234",staff:[{id:"s1",name:"Alex",role:"Barber"},{id:"s2",name:"Bea",role:"Stylist"},{id:"s3",name:"Carlo",role:"Therapist"}]}]); }
    finally{ setLoading(false); }
  })(); },[]);
  return {shops,loading,setShops};
}

function CustomerBooking({ shop }){
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [serviceId,setServiceId]=useState("svc1");
  const [staffId,setStaffId]=useState("any");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [slots,setSlots]=useState([]);
  const [booked,setBooked]=useState([]);
  const [toast,setToast]=useState("");

  useEffect(()=>{ setSlots(genTimeSlots(shop.hours)); },[shop]);
  useEffect(()=>{ (async()=>{ try{ const res=await api(`/api/bookings?shopId=${shop._id}&date=${date}`); setBooked(res);}catch{ setBooked([]);} })(); },[shop._id,date]);

  const reservedSet = useMemo(()=> new Set(booked.map(b=>`${b.slot}_${b.staffId}`)), [booked]);

  async function createBooking(slot){
    if(!name||!phone){ setToast("Please enter your name and phone."); return; }
    const staffList = shop.staff?.length ? shop.staff : [{id:"s1",name:"Alex",role:"Barber"}];
    const chosenStaff = staffId==="any" ? staffList[Math.floor(Math.random()*staffList.length)].id : staffId;
    try{
      await api(`/api/bookings`, { method:"POST", body: JSON.stringify({ shopId: shop._id, date, slot: slot.id, staffId: chosenStaff, serviceId, name, phone }) });
      const res = await api(`/api/bookings?shopId=${shop._id}&date=${date}`);
      setBooked(res); setToast("Booking confirmed. See you soon!");
    }catch(e){ alert("Booking failed: "+e.message); }
  }

  return (<div className="grid md:grid-cols-3 gap-4">
    <div className="md:col-span-2">
      <Card className="p-4">
        <SectionTitle icon={CalendarDays} title="Book a Slot" hint={`Open ${fmtTime(shop.hours.open)}–${fmtTime(shop.hours.close)}`}/>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <label className="text-sm text-slate-600"><span className="block mb-1">Date</span>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={date} onChange={e=>setDate(e.target.value)}/>
          </label>
          <label className="text-sm text-slate-600"><span className="block mb-1">Service</span>
            <select className="w-full border rounded-lg px-3 py-2" value={serviceId} onChange={e=>setServiceId(e.target.value)}>
              <option value="svc1">Haircut — 45 mins</option>
              <option value="svc2">Shave — 30 mins</option>
              <option value="svc3">Color — 60 mins</option>
              <option value="svc4">Massage — 60 mins</option>
            </select>
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <label className="text-sm text-slate-600"><span className="block mb-1">Preferred Staff</span>
            <select className="w-full border rounded-lg px-3 py-2" value={staffId} onChange={e=>setStaffId(e.target.value)}>
              <option value="any">No preference (fastest)</option>
              {(shop.staff?.length?shop.staff:STAFF_FALLBACK).map(st=>(<option key={st.id} value={st.id}>{st.name} — {st.role}</option>))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600"><span className="block mb-1">Your Name</span>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Juan D." value={name} onChange={e=>setName(e.target.value)}/>
            </label>
            <label className="text-sm text-slate-600"><span className="block mb-1">Phone</span>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="09XX…" value={phone} onChange={e=>setPhone(e.target.value)}/>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-slate-500"/><span className="text-sm text-slate-600">Select a time slot. Occupied slots show as disabled by staff.</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {slots.map(slot=>{
            const staffList = shop.staff?.length ? shop.staff : STAFF_FALLBACK;
            const disabled = staffList.some(st=>reservedSet.has(`${slot.id}_${st.id}`));
            return (<button key={slot.id} disabled={disabled} onClick={()=>createBooking(slot)} className={`px-3 py-2 rounded-xl border text-sm text-left transition ${disabled?"border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed":"border-slate-300 bg-white hover:bg-indigo-50"}`}>
              <div className="font-medium">{slot.label}</div>
              <div className="text-xs text-slate-500">{disabled?"Fully booked":"Available"}</div>
            </button>);
          })}
        </div>
      </Card>
    </div>
    <div className="md:col-span-1">
      <Card className="p-4">
        <SectionTitle icon={MapPin} title="Location"/>
        <div className="text-sm text-slate-700 font-medium">{shop.name}</div>
        <div className="text-sm text-slate-600">{shop.address}</div>
        <div className="text-sm text-slate-600 mt-1">☎ {shop.phone}</div>
      </Card>
      <Card className="p-4 mt-4">
        <SectionTitle icon={Bell} title="Notifications"/>
        <p className="text-sm text-slate-600">Enable push to get queue updates. (Future)</p>
        <button onClick={()=>alert("Push permissions would be requested here.")} className="mt-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">Enable Push</button>
      </Card>
    </div>
  </div>);
}

function QueueBoard({ shop, date }){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    const load=async()=>{
      try{ const res = await api(`/api/bookings?shopId=${shop._id}&date=${date}`); setItems(res.sort((a,b)=>a.slot.localeCompare(b.slot))); }catch{}
    };
    load();
    const t=setInterval(load, 5000);
    return ()=>clearInterval(t);
  },[shop._id,date]);
  const groups = (shop.staff||[]).map(st=>({staff:st, list: items.filter(b=>b.staffId===st.id)}));
  return (<Card className="p-4">
    <div className="flex items-center justify-between">
      <SectionTitle icon={ListOrdered} title="Live Queue Board" hint={new Date().toLocaleTimeString()}/>
      <div className="text-sm text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4"/>Auto-refresh</div>
    </div>
    <div className="grid md:grid-cols-3 gap-3">
      {groups.map(({staff,list})=>(
        <div key={staff.id} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 flex items-center justify-between">
            <div className="font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4"/>{staff.name}</div>
            <div className="text-xs text-slate-500">{staff.role}</div>
          </div>
          <div className="divide-y">
            {list.length===0 && (<div className="px-3 py-4 text-sm text-slate-500">No customers yet.</div>)}
            {list.map((b,idx)=>(
              <div key={b._id} className="px-3 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">#{String(idx+1).padStart(2,"0")} — {b.name}</div>
                  <div className="text-xs text-slate-500">{b.slot}</div>
                </div>
                <div className="text-xs">
                  {b.status==="booked" && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Waiting</span>}
                  {b.status==="serving" && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Serving</span>}
                  {b.status==="done" && <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Card>);
}

function Admin({ shop }){
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [code,setCode]=useState(()=>localStorage.getItem(`admin_${shop._id}`)||"");
  const [authed,setAuthed]=useState(false);
  const [items,setItems]=useState([]);
  const [search,setSearch]=useState("");

  async function verify(){
    try{
      const ok = await api(`/api/shops/verify?shopId=${shop._id}&code=${encodeURIComponent(code)}`);
      if(ok.valid){ localStorage.setItem(`admin_${shop._id}`, code); setAuthed(true); load(); }
      else alert("Wrong code");
    }catch{ alert("Verification failed"); }
  }

  async function load(){
    try{ const res = await api(`/api/bookings?shopId=${shop._id}&date=${date}`); setItems(res); }catch{}
  }
  useEffect(()=>{ if(authed) load(); },[date]);

  async function changeStatus(id,status){
    try{
      await api(`/api/bookings`, { method:"PUT", body: JSON.stringify({ id, status, shopId: shop._id, adminCode: code }) });
      await load();
    }catch(e){ alert("Update failed: "+e.message); }
  }
  async function addWalkIn(slot){
    try{
      const staffId = (shop.staff?.[0]?.id) || "s1";
      await api(`/api/bookings`, { method:"POST", body: JSON.stringify({ shopId: shop._id, date, slot, staffId, serviceId:"svc1", name:"Walk-in", phone:"", adminCode: code }) });
      await load();
    }catch(e){ alert("Add failed: "+e.message); }
  }

  const slots = genTimeSlots(shop.hours);
  const filtered = items.filter(b=> (b.name||"").toLowerCase().includes((search||"").toLowerCase()) );

  if(!authed){
    return (<Card className="p-6">
      <div className="flex items-center gap-2 mb-3"><LockKeyhole className="w-5 h-5"/><h3 className="font-semibold text-slate-800">Enter Admin Code</h3></div>
      <div className="text-sm text-slate-600 mb-2">Ask the shop owner for the 4-digit Admin Code.</div>
      <div className="flex gap-2">
        <input value={code} onChange={e=>setCode(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="1234"/>
        <button onClick={verify} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">Verify</button>
      </div>
    </Card>);
  }

  return (<div className="grid md:grid-cols-3 gap-4">
    <div className="md:col-span-2">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/><h3 className="font-semibold text-slate-800">Admin — Schedule & Heat Map</h3></div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setDate(new Date(Date.parse(date)-86400000).toISOString().slice(0,10))} className="p-2 rounded-lg border"><ChevronLeft className="w-4 h-4"/></button>
            <div className="text-sm font-medium text-slate-700 w-36 text-center">{date}</div>
            <button onClick={()=>setDate(new Date(Date.parse(date)+86400000).toISOString().slice(0,10))} className="p-2 rounded-lg border"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {slots.map(slot=>{
            const count = items.filter(b=>b.slot===slot.id).length;
            const intensity=Math.min(count/(shop.staff?.length||3),1);
            const bg=intensity===0? "bg-green-50" : intensity<0.5? "bg-amber-50" : "bg-rose-50";
            return (<div key={slot.id} className={`rounded-xl border border-slate-200 ${bg} p-3 text-sm flex flex-col gap-1`}>
              <div className="font-medium text-slate-800">{slot.label}</div>
              <div className="text-xs text-slate-600">{count} / {(shop.staff?.length||3)} booked</div>
              <button onClick={()=>addWalkIn(slot.id)} className="mt-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border hover:bg-white">
                <PlusCircle className="w-3 h-3"/> Add walk-in
              </button>
            </div>);
          })}
        </div>
      </Card>
      <Card className="p-4 mt-4">
        <div className="flex items-center gap-2 mb-3"><ListOrdered className="w-5 h-5"/><h3 className="font-semibold text-slate-800">Bookings</h3></div>
        <div className="mb-3 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/>
            <input placeholder="Search by name or phone…" className="w-full border rounded-xl pl-9 pr-3 py-2" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">Time</th><th className="py-2">Customer</th><th className="py-2">Staff</th><th className="py-2">Status</th><th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 && (<tr><td colSpan={5} className="py-6 text-center text-slate-500">No bookings yet.</td></tr>)}
              {items.filter(b=>(b.name||"").toLowerCase().includes(search.toLowerCase())).map(b=>(
                <tr key={b._id} className="border-b last:border-0">
                  <td className="py-2">{b.slot}</td>
                  <td className="py-2 font-medium">{b.name||"Walk-in"}</td>
                  <td className="py-2">{(shop.staff||[]).find(s=>s.id===b.staffId)?.name || "-"}</td>
                  <td className="py-2">
                    <select value={b.status} onChange={e=>changeStatus(b._id,e.target.value)} className="border rounded-lg px-2 py-1">
                      <option value="booked">Booked</option>
                      <option value="serving">Serving</option>
                      <option value="done">Done</option>
                      <option value="no-show">No-show</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={()=>changeStatus(b._id,"done")} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Mark done</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    <div className="md:col-span-1">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><Settings className="w-5 h-5"/><h3 className="font-semibold text-slate-800">Shop Settings</h3></div>
        <div className="text-sm text-slate-600">Hours: {fmtTime(shop.hours.open)}–{fmtTime(shop.hours.close)}</div>
        <div className="text-xs text-slate-500 mt-1">Admin Code: <span className="font-mono">{shop.adminCode||"1234"}</span></div>
        <div className="text-xs text-slate-500 mt-1">Staff: {(shop.staff||[]).map(s=>s.name).join(", ")||"—"}</div>
      </Card>
    </div>
  </div>);
}

export default function App(){
  const [active,setActive]=useState("customer");
  const {shops,loading}=useShops();
  const [activeShopId,setActiveShopId]=useState(null);

  useEffect(()=>{ if(!loading && shops.length>0 && !activeShopId){ setActiveShopId(shops[0]._id); } },[loading,shops,activeShopId]);
  if(loading) return (<div className="min-h-screen grid place-items-center text-slate-600">Loading…</div>);
  const shop = shops.find(s=>s._id===activeShopId);
  const today = new Date().toISOString().slice(0,10);

  return (<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
    <div className="max-w-6xl mx-auto px-4 py-3">
      <TopNav active={active} setActive={setActive} shops={shops} activeShopId={activeShopId} setActiveShopId={setActiveShopId} />
      <div className="py-4">
        {active==="customer" && <CustomerBooking shop={shop}/>}
        {active==="queue" && <QueueBoard shop={shop} date={today}/>}
        {active==="admin" && <Admin shop={shop}/>}
      </div>
    </div>
    <InstallBanner/>
    <div className="mt-10 border-t bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500 flex items-center justify-between">
        <div>© {new Date().getFullYear()} QueueEasy — Full MVP</div>
        <div className="flex items-center gap-3"><span>Demo only (no payments)</span></div>
      </div>
    </div>
  </div>);
}
