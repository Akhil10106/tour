/**
 * TripSplit Premium - Core Engine v3.0 (Fully Responsive)
 * Features: Real-time Sync, Smart Debt Minimization, Custom UI Notifications
 */

// 1. Firebase Configuration
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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- 2. PREMIUM UI NOTIFICATION SYSTEM ---

window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.customConfirm = function(message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const proceedBtn = document.getElementById('confirm-proceed');
    const cancelBtn = document.getElementById('confirm-cancel');

    if (!modal || !msgEl) return;

    msgEl.innerText = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const cleanUp = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    proceedBtn.onclick = () => { onConfirm(); cleanUp(); };
    cancelBtn.onclick = cleanUp;
};

// --- 3. RESPONSIVE NAVIGATION & MODALS ---

window.toggleMobileMenu = function() {
    const sidebar = document.getElementById('mobile-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
};

window.handleMobileNav = function(sectionId) {
    window.showSection(sectionId);
    window.toggleMobileMenu();
};

window.openModal = function(id) {
    const m = document.getElementById(id);
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};

window.closeModal = function(id) {
    const m = document.getElementById(id);
    if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
};

window.showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    
    // Show Target
    const target = document.getElementById(`${sectionId}-section`);
    if(target) target.classList.remove('hidden');

    // Update Sidebar Links (Desktop)
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active', 'bg-blue-50', 'text-blue-600');
        if(l.getAttribute('onclick').includes(sectionId)) l.classList.add('active');
    });

    // Update Mobile Links
    document.querySelectorAll('.nav-link-mobile').forEach(l => {
        l.classList.remove('active', 'bg-blue-50', 'text-blue-600');
        if(l.getAttribute('onclick').includes(sectionId)) l.classList.add('active');
    });

    document.getElementById('section-title').innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    lucide.createIcons();
};

// --- 4. MEMBER & EXPENSE LOGIC ---

window.openMemberPrompt = async function() {
    const name = prompt("Enter Member Name:");
    if (name && name.trim() !== "") {
        try {
            await db.ref('members').push({
                name: name.trim(),
                role: 'Member',
                joinedAt: Date.now()
            });
            window.showToast(`${name.trim()} added!`, 'success');
            await logActivity(`👋 ${name.trim()} joined the trip!`);
        } catch (e) {
            window.showToast("Permission Denied: Set Firebase Rules to Public", 'error');
        }
    }
};

window.deleteMember = function(id, name) {
    window.customConfirm(`Remove ${name} from the trip?`, async () => {
        await db.ref('members').child(id).remove();
        window.showToast(`${name} removed.`, 'info');
    });
};

window.deleteExpense = function(id) {
    window.customConfirm(`Delete this expense record?`, async () => {
        await db.ref('expenses').child(id).remove();
        window.showToast(`Expense deleted.`, 'info');
    });
};

// --- 5. DATA SYNC & SETTLEMENT ENGINE ---

let members = [];
let expenses = [];

function listenToData() {
    // Sync Members
    db.ref('members').on('value', (snapshot) => {
        const data = snapshot.val();
        members = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
        renderMembers();
        updateDropdowns();
        calculateEverything();
    });

    // Sync Expenses
    db.ref('expenses').on('value', (snapshot) => {
        const data = snapshot.val();
        expenses = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
        renderExpenses();
        calculateEverything();
    });

    // Sync Activity
    db.ref('activityLogs').limitToLast(12).on('value', (snapshot) => {
        const data = snapshot.val();
        const feed = document.getElementById('activity-feed');
        if(!data || !feed) return;
        feed.innerHTML = Object.values(data).reverse().map(log => `
            <div class="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border-l-4 border-transparent hover:border-blue-400">
                <div class="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                <div>
                    <p class="text-sm font-semibold text-slate-700 leading-tight">${log.text}</p>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">${new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
        `).join('');
    });
}

function updateDropdowns() {
    const payerSelect = document.getElementById('exp-payer');
    const splitDiv = document.getElementById('split-participants');
    if(!payerSelect || !splitDiv) return;

    payerSelect.innerHTML = members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    splitDiv.innerHTML = members.map(m => `
        <label class="flex items-center gap-2 p-3 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100">
            <input type="checkbox" value="${m.name}" checked class="w-5 h-5 rounded text-blue-600 border-slate-300">
            <span class="text-sm font-semibold text-slate-600">${m.name}</span>
        </label>
    `).join('');
}

function calculateEverything() {
    let total = 0;
    const netBalances = {};
    const payerMap = {};

    members.forEach(m => {
        netBalances[m.name] = 0;
        payerMap[m.name] = 0;
    });

    expenses.forEach(exp => {
        const amt = parseFloat(exp.amount);
        total += amt;
        payerMap[exp.paidBy] = (payerMap[exp.paidBy] || 0) + amt;

        const share = amt / exp.participants.length;
        if(netBalances.hasOwnProperty(exp.paidBy)) netBalances[exp.paidBy] += amt;
        exp.participants.forEach(p => {
            if(netBalances.hasOwnProperty(p)) netBalances[p] -= share;
        });
    });

    // Dashboard Totals
    document.getElementById('total-expense-val').innerText = `₹${total.toLocaleString('en-IN')}`;
    const topPayer = Object.keys(payerMap).reduce((a, b) => payerMap[a] > payerMap[b] ? a : b, '---');
    document.getElementById('top-payer-val').innerText = topPayer === '---' ? '---' : topPayer;
    
    renderSettlements(netBalances);
}

function renderSettlements(netBalances) {
    const list = document.getElementById('settlement-list');
    if(!list) return;
    
    const debtors = [], creditors = [];
    Object.entries(netBalances).forEach(([name, bal]) => {
        if (bal < -0.9) debtors.push({ name, bal: Math.abs(bal) });
        else if (bal > 0.9) creditors.push({ name, bal });
    });

    debtors.sort((a,b) => b.bal - a.bal);
    creditors.sort((a,b) => b.bal - a.bal);

    let html = '';
    let i = 0, j = 0, count = 0;

    while(i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].bal, creditors[j].bal);
        html += `
            <div class="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-slate-700">${debtors[i].name}</span>
                    <div class="flex flex-col items-center">
                        <i data-lucide="arrow-right" class="w-4 h-4 text-blue-500"></i>
                    </div>
                    <span class="font-bold text-slate-700">${creditors[j].name}</span>
                </div>
                <span class="text-lg font-black text-blue-600">₹${Math.round(amount)}</span>
            </div>`;
        debtors[i].bal -= amount;
        creditors[j].bal -= amount;
        if(debtors[i].bal < 0.1) i++;
        if(creditors[j].bal < 0.1) j++;
        count++;
    }

    list.innerHTML = html || '<div class="text-center py-10 text-slate-400 font-medium">All settled up! 🌴</div>';
    document.getElementById('pending-settle-val').innerText = count;
    lucide.createIcons();
}

// --- 6. FORM HANDLERS & RENDERING ---

function renderMembers() {
    const grid = document.getElementById('members-grid');
    if(!grid) return;
    grid.innerHTML = members.map(m => `
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-100">
                    ${m.name.charAt(0).toUpperCase()}
                </div>
                <h4 class="font-bold text-slate-800">${m.name}</h4>
            </div>
            <button onclick="deleteMember('${m.id}', '${m.name}')" class="opacity-0 group-hover:opacity-100 text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>`).join('');
    lucide.createIcons();
}

function renderExpenses() {
    const tbody = document.getElementById('expenses-tbody');
    if(!tbody) return;
    tbody.innerHTML = expenses.length ? expenses.map(exp => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="p-5 font-bold text-slate-800">${exp.title}</td>
            <td class="p-5 text-slate-500 font-medium">${exp.paidBy}</td>
            <td class="p-5 font-black text-slate-700 text-lg">₹${exp.amount}</td>
            <td class="p-5">
                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">${exp.category}</span>
            </td>
            <td class="p-5 text-right">
                <button onclick="deleteExpense('${exp.id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>`).join('') : `<tr><td colspan="5" class="p-10 text-center text-slate-400">No expenses found.</td></tr>`;
    lucide.createIcons();
}

const expenseForm = document.getElementById('expense-form');
if(expenseForm) {
    expenseForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('exp-title').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const paidBy = document.getElementById('exp-payer').value;
        const category = document.getElementById('exp-category').value;
        const participants = Array.from(document.querySelectorAll('#split-participants input:checked')).map(i => i.value);

        if(!paidBy || participants.length === 0) return window.showToast("Select members first!", "error");

        try {
            await db.ref('expenses').push({ title, amount, paidBy, category, participants, timestamp: Date.now() });
            window.showToast("Bill recorded!", "success");
            await logActivity(`💰 ${paidBy} paid ₹${amount} for ${title}`);
            window.closeModal('expenseModal');
            expenseForm.reset();
        } catch (err) { window.showToast("Sync Error", "error"); }
    };
}

async function logActivity(text) {
    await db.ref('activityLogs').push({ text, time: Date.now() });
}

// --- 7. STARTUP ---

window.onload = () => {
    lucide.createIcons();
    listenToData();
    // Default start
    window.showSection('dashboard');
};
