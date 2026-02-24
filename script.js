import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Same Firebase config from your source
const firebaseConfig = {
    apiKey: "AIzaSyCy5NOv_bRx8Ozbq3n5MzXz8D7cF1Piwko",
    authDomain: "services-6ce70.firebaseapp.com",
    databaseURL: "https://services-6ce70-default-rtdb.firebaseio.com",
    projectId: "services-6ce70",
    storageBucket: "services-6ce70.firebasestorage.app",
    messagingSenderId: "153760408547",
    appId: "1:153760408547:web:5f61c39085dbe2f828b6d6",
    measurementId: "G-6Z4H8X4EXL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
const tripDate = new Date('March 13, 2026');

// Initialization
onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');
    
    if (user) {
        currentUser = user;
        overlay.classList.add('opacity-0', 'pointer-events-none', 'scale-110');
        mainApp.classList.remove('opacity-0');
        document.getElementById('user-avatar').src = user.photoURL;
        document.getElementById('user-name').innerText = user.displayName;
        renderView('dashboard');
    } else {
        overlay.classList.remove('opacity-0', 'pointer-events-none', 'scale-110');
        mainApp.classList.add('opacity-0');
    }
});

document.getElementById('login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => signOut(auth);

// View Switcher
document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        const view = e.currentTarget.dataset.view;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderView(view);
    };
});

function renderView(view) {
    const mount = document.getElementById('content-mount');
    const title = document.getElementById('view-title');
    mount.innerHTML = '';
    mount.className = 'flex-1 overflow-y-auto p-10 fade-up';

    switch(view) {
        case 'dashboard':
            title.innerText = 'Command Center';
            renderDashboard(mount);
            break;
        case 'train':
            title.innerText = 'Transit Logistics';
            renderTrain(mount);
            break;
        case 'checklist':
            title.innerText = 'Gear Strategy';
            renderChecklist(mount);
            break;
        case 'expenses':
            title.innerText = 'Finance Sync';
            renderExpenses(mount);
            break;
        case 'members':
            title.innerText = 'The Expedition Crew';
            renderMembers(mount);
            break;
    }
}

// --- Specialized Renderers ---

function renderDashboard(container) {
    const days = Math.floor((tripDate - new Date()) / (1000 * 60 * 60 * 24));
    
    container.innerHTML = `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-8 glass-card bg-slate-900 text-white relative overflow-hidden">
                <div class="relative z-10">
                    <span class="text-indigo-400 font-black text-[10px] tracking-[0.3em] uppercase mb-6 block">T-Minus Countdown</span>
                    <div class="flex items-baseline gap-4 mb-8">
                        <h2 class="text-8xl font-black tracking-tighter">${days}</h2>
                        <span class="text-2xl font-bold text-slate-400">Days to Katra</span>
                    </div>
                    <div class="flex gap-4">
                        <div class="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Departure</p>
                            <p class="font-bold text-sm">March 13, 2026</p>
                        </div>
                        <div class="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Destination</p>
                            <p class="font-bold text-sm">SVDK - Platform 1</p>
                        </div>
                    </div>
                </div>
                <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <i class="fas fa-mountain absolute right-10 top-1/2 -translate-y-1/2 text-white/5 text-[240px]"></i>
            </div>

            <div class="col-span-12 lg:col-span-4 flex flex-col gap-8">
                <div class="stat-card flex-1">
                    <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                        <i class="fas fa-sun-bright text-xl"></i>
                    </div>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Katra Forecast</p>
                    <h4 class="text-3xl font-black mt-1">18°C <span class="text-lg text-slate-300">/ 6°C</span></h4>
                    <p class="text-sm text-slate-500 mt-2 font-medium italic">"Ideal trekking conditions"</p>
                </div>
                <div class="stat-card flex-1 bg-indigo-50/30 border-indigo-100">
                    <p class="text-indigo-600 text-xs font-black uppercase tracking-widest mb-4">Quick Action</p>
                    <button class="w-full py-4 bg-white border border-indigo-100 rounded-2xl font-bold text-indigo-600 shadow-sm hover:shadow-indigo-100 transition-all">
                        View Train Ticket
                    </button>
                </div>
            </div>

            <div class="col-span-12 glass-card">
                <div class="flex justify-between items-center mb-10">
                    <h4 class="font-black text-slate-900 tracking-tight">Expedition Progress</h4>
                    <span class="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase">Phase: Planning</span>
                </div>
                <div class="relative px-4">
                    <div class="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2"></div>
                    <div class="absolute top-1/2 left-0 w-[20%] h-[2px] bg-indigo-500 -translate-y-1/2 transition-all duration-1000"></div>
                    <div class="flex justify-between relative z-10">
                        <div class="group flex flex-col items-center">
                            <div class="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-xs">
                                <i class="fas fa-check"></i>
                            </div>
                            <span class="mt-3 text-[10px] font-black text-slate-900 uppercase">Preparation</span>
                        </div>
                        <div class="group flex flex-col items-center opacity-40">
                            <div class="w-10 h-10 bg-white rounded-full border-4 border-slate-100 shadow-sm flex items-center justify-center text-slate-300 text-xs">
                                <i class="fas fa-train"></i>
                            </div>
                            <span class="mt-3 text-[10px] font-black text-slate-400 uppercase">Transit</span>
                        </div>
                        <div class="group flex flex-col items-center opacity-40">
                            <div class="w-10 h-10 bg-white rounded-full border-4 border-slate-100 shadow-sm flex items-center justify-center text-slate-300 text-xs">
                                <i class="fas fa-person-hiking"></i>
                            </div>
                            <span class="mt-3 text-[10px] font-black text-slate-400 uppercase">Ascent</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTrain(container) {
    container.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-8">
            <div class="glass-card flex flex-col md:flex-row justify-between items-center gap-8">
                <div class="flex items-center gap-6">
                    <div class="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white">
                        <i class="fas fa-train-subway text-3xl"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-black tracking-tighter">12445 Uttar S Kranti</h2>
                        <div class="flex gap-3 mt-1">
                            <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Coach S2</span>
                            <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">PNR: 2944875853</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-8">
                    <div class="text-right">
                        <p class="text-3xl font-black tracking-tight text-slate-900">UMB</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ambala Cantt</p>
                    </div>
                    <div class="flex flex-col items-center">
                        <i class="fas fa-arrow-right-long text-slate-200 text-2xl"></i>
                        <span class="text-[9px] font-black text-indigo-500 mt-2">6.5 HOURS</span>
                    </div>
                    <div class="text-left">
                        <p class="text-3xl font-black tracking-tight text-slate-900">SVDK</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMVD Katra</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 lg:col-span-4 glass-card h-fit">
                    <h4 class="font-black text-slate-900 mb-8 tracking-tight">Assigned Berths</h4>
                    <div class="space-y-4">
                        ${renderSeatInfo('Akhil Goel', '43 (UB)', 'Indigo')}
                        ${renderSeatInfo('Pratham Sharma', '45 (MB)', 'Slate')}
                        ${renderSeatInfo('Aniket', '46 (UB)', 'Indigo')}
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-8 glass-card">
                    <h4 class="font-black text-slate-900 mb-8 tracking-tight">Coach S2 Map Visualization</h4>
                    <div class="bg-slate-50 p-10 rounded-[2rem] overflow-x-auto">
                        <div class="seat-map min-w-[500px]">
                            ${Array.from({length: 8}).map((_, i) => `
                                <div class="seat-node ${[43, 45, 46].includes(40+i*3+1) ? 'active' : ''}">${40+i*3+1}</div>
                                <div class="seat-node ${[43, 45, 46].includes(40+i*3+2) ? 'active' : ''}">${40+i*3+2}</div>
                                <div class="seat-node ${[43, 45, 46].includes(40+i*3+3) ? 'active' : ''}">${40+i*3+3}</div>
                                <div></div>
                                <div class="seat-node opacity-40">${40+i*3+4}</div>
                                <div class="seat-node opacity-40">${40+i*3+5}</div>
                                <div class="seat-node opacity-40">${40+i*3+6}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSeatInfo(name, seat, color) {
    return `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-xs shadow-sm">
                    <i class="fas fa-user text-slate-400"></i>
                </div>
                <p class="text-sm font-bold text-slate-700">${name}</p>
            </div>
            <span class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-600">${seat}</span>
        </div>
    `;
}

function renderChecklist(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-8">
            <div class="glass-card">
                <div class="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <input id="item-input" type="text" placeholder="Add critical gear (e.g., Medical Kit, ID Proofs...)" 
                        class="flex-1 bg-transparent px-6 py-4 font-semibold text-slate-700 placeholder:text-slate-400">
                    <button id="add-item" class="px-10 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">
                        DEPLOY ITEM
                    </button>
                </div>
            </div>
            <div id="packing-list" class="grid grid-cols-1 gap-4">
                </div>
        </div>
    `;

    const packingRef = ref(db, 'checklist');
    const input = document.getElementById('item-input');
    const addBtn = document.getElementById('add-item');

    addBtn.onclick = () => {
        if(!input.value) return;
        push(packingRef, { text: input.value, done: false, user: currentUser.displayName, time: Date.now() });
        input.value = '';
    };

    onValue(packingRef, (snapshot) => {
        const listContainer = document.getElementById('packing-list');
        listContainer.innerHTML = '';
        const data = snapshot.val();
        for(let id in data) {
            const item = data[id];
            const div = document.createElement('div');
            div.className = `glass-card !p-5 flex items-center justify-between group fade-up ${item.done ? 'opacity-60 grayscale-[0.5]' : ''}`;
            div.innerHTML = `
                <div class="flex items-center gap-5">
                    <button onclick="window.toggleItem('${id}', ${item.done})" 
                        class="w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all 
                        ${item.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-400'}">
                        <i class="fas fa-check text-xs"></i>
                    </button>
                    <div>
                        <p class="font-bold text-slate-900 ${item.done ? 'line-through opacity-50' : ''}">${item.text}</p>
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Assigned by ${item.user}</p>
                    </div>
                </div>
                <button onclick="window.deleteItem('${id}')" class="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-200 hover:text-red-500 transition-all flex items-center justify-center">
                    <i class="fas fa-trash-can text-sm"></i>
                </button>
            `;
            listContainer.prepend(div);
        }
    });
}

function renderExpenses(container) {
    container.innerHTML = `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-4 glass-card h-fit sticky top-28">
                <h4 class="font-black text-slate-900 mb-8 tracking-tight">Record Transaction</h4>
                <div class="space-y-6">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Description</label>
                        <input id="exp-title" type="text" placeholder="Train Food / Hotel Deposit" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Amount (INR)</label>
                        <input id="exp-amount" type="number" placeholder="0.00" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-2xl">
                    </div>
                    <button id="add-exp" class="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-tight hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-100 transition-all active:scale-95">
                        PUSH TO LEDGER
                    </button>
                </div>
            </div>
            <div class="col-span-12 lg:col-span-8 space-y-8">
                <div class="glass-card bg-indigo-600 text-white flex justify-between items-center">
                    <div>
                        <p class="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Group Total Spends</p>
                        <h2 id="total-val" class="text-5xl font-black tracking-tighter mt-1">₹0</h2>
                    </div>
                    <i class="fas fa-wallet text-6xl text-white/10"></i>
                </div>
                <div id="expense-list" class="space-y-4">
                    </div>
            </div>
        </div>
    `;

    const expRef = ref(db, 'expenses');
    document.getElementById('add-exp').onclick = () => {
        const title = document.getElementById('exp-title');
        const amount = document.getElementById('exp-amount');
        if(!title.value || !amount.value) return;
        push(expRef, { title: title.value, amount: amount.value, user: currentUser.displayName, time: Date.now() });
        title.value = ''; amount.value = '';
    };

    onValue(expRef, (snapshot) => {
        const list = document.getElementById('expense-list');
        const totalDisp = document.getElementById('total-val');
        list.innerHTML = '';
        let total = 0;
        const data = snapshot.val();
        for(let id in data) {
            total += parseFloat(data[id].amount);
            const div = document.createElement('div');
            div.className = "glass-card !p-6 flex items-center justify-between fade-up";
            div.innerHTML = `
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <i class="fas fa-arrow-up-right-dots"></i>
                    </div>
                    <div>
                        <p class="font-black text-slate-900">${data[id].title}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logged by ${data[id].user}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xl font-black text-slate-900 tracking-tight">₹${data[id].amount}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Status: Confirmed</p>
                </div>
            `;
            list.prepend(div);
        }
        totalDisp.innerText = `₹${total.toLocaleString('en-IN')}`;
    });
}

function renderMembers(container) {
    const members = [
        { name: 'Akhil Goel', role: 'Train Passenger', seat: 'S2-43', color: 'indigo' },
        { name: 'Pratham Sharma', role: 'Train Passenger', seat: 'S2-45', color: 'indigo' },
        { name: 'Aniket', role: 'Train Passenger', seat: 'S2-46', color: 'indigo' },
        { name: 'Lakshya Sharma', role: 'Surface Crew', seat: 'N/A', color: 'slate' }
    ];

    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            ${members.map(m => `
                <div class="glass-card !p-8 flex flex-col items-center text-center group">
                    <div class="relative mb-6">
                        <div class="absolute inset-0 bg-indigo-500 blur-2xl opacity-0 group-hover:opacity-20 transition-all"></div>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}" class="relative w-24 h-24 rounded-[2.5rem] bg-slate-50 p-2 border-2 border-slate-100 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <h4 class="text-xl font-black text-slate-900 tracking-tight">${m.name}</h4>
                    <span class="mt-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">${m.role}</span>
                    <div class="mt-8 w-full pt-8 border-t border-slate-50">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Berth Assignment</p>
                        <p class="text-2xl font-black text-slate-900 tracking-tighter mt-1">${m.seat}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Global exposure for Firebase helpers
window.toggleItem = (id, status) => update(ref(db, `checklist/${id}`), { done: !status });
window.deleteItem = (id) => remove(ref(db, `checklist/${id}`));
