/**
 * TripSplit Premium Core Engine v25.0 - FIXED-SHARE & IDENTITY EDITION
 * Features: Fixed-Share Logic (Prevents amount jumping), Email Access Wall, Smart Filters
 */

// --- 1. FIREBASE & SYSTEM CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCy5NOv_bRx8Ozbq3n5MzXz8D7cF1Piwko",
    authDomain: "services-6ce70.firebaseapp.com",
    databaseURL: "https://services-6ce70-default-rtdb.firebaseio.com",
    projectId: "services-6ce70",
    storageBucket: "services-6ce70.firebasestorage.app",
    messagingSenderId: "153760408547",
    appId: "1:153760408547:web:5f61c39085dbe2f828b6d6"
};

const ADMIN_EMAIL = "akhilgoel985@gmail.com"; 

// Global State Variables
let members = [];
let expenses = [];
let settledHistory = [];
let allLogs = []; 

// Initialize Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 2. AUTHENTICATION & ACCESS CONTROL GATEKEEPER ---
document.getElementById('google-login-btn').onclick = () => {
    auth.signInWithPopup(provider).catch(err => alert("Login Error: " + err.message));
};

window.handleLogout = () => {
    if(confirm("Are you sure you want to sign out?")) {
        auth.signOut().then(() => location.reload());
    }
};

auth.onAuthStateChanged((user) => {
    const overlay = document.getElementById('auth-overlay');
    const deniedOverlay = document.getElementById('access-denied-overlay');

    if (user) {
        overlay.style.display = 'none';
        
        // Identity Verification logic
        db.ref('members').once('value', (snap) => {
            const memberList = snap.val() ? Object.values(snap.val()) : [];
            const userEmail = user.email.toLowerCase();
            
            const isMember = memberList.some(m => m.email && m.email.toLowerCase() === userEmail);
            const isAdmin = userEmail === ADMIN_EMAIL;

            if (isAdmin || isMember) {
                if(deniedOverlay) deniedOverlay.classList.add('hidden');
                syncUserProfileUI(user);
                startRealTimeSync();
                showSection('dashboard');
            } else {
                if(deniedOverlay) {
                    deniedOverlay.classList.remove('hidden');
                    document.getElementById('denied-msg').innerText = `Sorry ${user.displayName}, your email (${user.email}) is not authorized. Please ask the admin to add you.`;
                }
                lucide.createIcons();
            }
        });
    } else {
        overlay.style.display = 'flex';
        if(deniedOverlay) deniedOverlay.classList.add('hidden');
    }
});

function syncUserProfileUI(user) {
    const nameElements = ['user-name', 'user-name-mobile', 'main-profile-name'];
    const photoElements = ['user-photo', 'user-photo-mobile', 'main-profile-photo'];
    nameElements.forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = user.displayName; });
    photoElements.forEach(id => { if(document.getElementById(id)) document.getElementById(id).src = user.photoURL; });
    if (document.getElementById('main-profile-email')) document.getElementById('main-profile-email').innerText = user.email;
}

// --- 3. NAVIGATION ENGINE ---
window.showSection = (sectionId) => {
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link, .m-nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll(`[onclick="showSection('${sectionId}')"]`).forEach(el => el.classList.add('active'));
    
    const titleMap = { 'dashboard': 'Dashboard', 'expenses': 'Expenses', 'balance': 'Balance Sheet', 'members': 'Trip Members', 'settlements': 'Settlements', 'profile': 'My Profile' };
    document.getElementById('section-title').innerText = titleMap[sectionId] || 'TripSplit';

    const desktopAction = document.getElementById('desktop-action-container');
    const mobileAction = document.getElementById('mobile-action-btn');

    if (sectionId === 'expenses') {
        desktopAction.innerHTML = `<button class="btn btn-primary" onclick="openModal('expenseModal')"><i data-lucide="plus"></i> Add Bill</button>`;
        if(mobileAction) { mobileAction.style.display = 'flex'; mobileAction.setAttribute('onclick', "openModal('expenseModal')"); mobileAction.innerHTML = `<i data-lucide="plus-circle"></i><span>Add</span>`; }
    } else if (sectionId === 'members') {
        desktopAction.innerHTML = `<button class="btn btn-primary" onclick="openModal('memberModal')" style="background:var(--success);"><i data-lucide="user-plus"></i> Member</button>`;
        if(mobileAction) { mobileAction.style.display = 'flex'; mobileAction.setAttribute('onclick', "openModal('memberModal')"); mobileAction.innerHTML = `<i data-lucide="user-plus" style="color:var(--success);"></i><span>Add</span>`; }
    } else {
        desktopAction.innerHTML = '';
    }

    if (sectionId === 'balance') renderBalanceSheet();
    if (sectionId === 'profile') renderProfileStats();
    if (sectionId === 'settlements') { renderDetailedSettlements(); renderSettledHistory(); }
    
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 4. DATA SYNC ENGINE ---
function startRealTimeSync() {
    db.ref('members').on('value', snap => {
        members = snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [];
        refreshUI();
        updateMemberFilters();
    });
    db.ref('expenses').on('value', snap => {
        expenses = snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [];
        refreshUI();
    });
    db.ref('settledHistory').on('value', snap => {
        settledHistory = snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })).reverse() : [];
        renderSettledHistory();
    });
    db.ref('activityLogs').limitToLast(50).on('value', snap => {
        allLogs = snap.val() ? Object.values(snap.val()).reverse() : [];
        applyActivityFilters();
    });
}

function refreshUI() {
    const payerSelect = document.getElementById('exp-payer');
    if (payerSelect) payerSelect.innerHTML = members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    const splitBox = document.getElementById('split-participants');
    if (splitBox) splitBox.innerHTML = members.map(m => `<label><input type="checkbox" value="${m.name}" checked> <span>${m.name}</span></label>`).join('');

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (document.getElementById('total-expense-val')) document.getElementById('total-expense-val').innerText = `₹${Math.round(totalSpent)}`;

    renderExpensesTable();
    renderMembersGrid();
    if (!document.getElementById('balance-section').classList.contains('hidden')) renderBalanceSheet();
    if (!document.getElementById('settlements-section').classList.contains('hidden')) { renderDetailedSettlements(); renderSettledHistory(); }
}

// --- 5. ACTIVITY FILTERS ---
window.toggleActivityFilter = () => { document.getElementById('activity-filter-panel').classList.toggle('hidden'); };

function updateMemberFilters() {
    const filterMember = document.getElementById('filter-act-member');
    if (filterMember) {
        const currentVal = filterMember.value;
        filterMember.innerHTML = '<option value="all">Everyone</option>' + members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        filterMember.value = currentVal;
    }
}

window.applyActivityFilters = () => {
    const typeFilter = document.getElementById('filter-act-type').value;
    const memberFilter = document.getElementById('filter-act-member');
    const feed = document.getElementById('activity-feed');
    if (!feed || !memberFilter) return;
    const mValue = memberFilter.value;

    const filtered = allLogs.filter(log => {
        const matchesType = typeFilter === 'all' || log.type === typeFilter;
        const matchesMember = mValue === 'all' || (log.text && log.text.includes(mValue));
        return matchesType && matchesMember;
    });
    feed.innerHTML = filtered.map(l => `
        <div class="activity-card-mini act-${l.type} animate-in">
            <div class="activity-icon"><i data-lucide="${getActivityIcon(l.type)}" size="14"></i></div>
            <div class="activity-info">
                <span class="activity-text">${l.text}</span>
                <span class="activity-time">${formatTime(l.time)}</span>
            </div>
        </div>`).join('');
    lucide.createIcons();
};

window.resetActivityFilters = () => {
    document.getElementById('filter-act-type').value = 'all';
    document.getElementById('filter-act-member').value = 'all';
    applyActivityFilters();
    toggleActivityFilter();
};

function getActivityIcon(type) { return type === 'expense' ? 'shopping-bag' : type === 'join' ? 'user-plus' : type === 'settle' ? 'hand-coins' : 'info'; }
function formatTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? "Just now" : mins < 60 ? `${mins}m ago` : Math.floor(mins/60) < 24 ? `${Math.floor(mins/60)}h ago` : new Date(ts).toLocaleDateString();
}

// --- 6. FINANCIAL ENGINE (FIXED-SHARE LOGIC) ---
function renderBalanceSheet() {
    const grid = document.getElementById('balance-grid');
    if (!grid) return;
    let html = '';
    members.forEach(member => {
        let pPaid = 0, owedToMe = 0, iOwe = 0;
        let myDebts = [], myCredits = [];
        expenses.forEach(exp => {
            // CRITICAL FIX: Use stored fixedShare to prevent amount jumping
            const share = exp.fixedShare || (parseFloat(exp.amount) / exp.participants.length);
            if (exp.paidBy === member.name) {
                pPaid += parseFloat(exp.amount);
                exp.participants.forEach(p => { if (p !== member.name) { owedToMe += share; myCredits.push({ from: p, amount: share, title: exp.title }); } });
            } else if (exp.participants.includes(member.name)) {
                iOwe += share;
                myDebts.push({ to: exp.paidBy, amount: share, title: exp.title });
            }
        });
        const net = owedToMe - iOwe;
        html += `
            <div class="balance-card animate-in">
                <div class="balance-header">
                    <div class="member-avatar">${member.name[0]}</div>
                    <div><div class="balance-name">${member.name}</div><div style="font-size:0.7rem; color:var(--text-light); font-weight:800;">CONTRIBUTED: ₹${Math.round(pPaid)}</div></div>
                </div>
                <div class="mini-stat-row">
                    <div class="mini-stat"><p>Receivable</p><span class="text-get">₹${Math.round(owedToMe)}</span></div>
                    <div class="mini-stat"><p>Payable</p><span class="text-give">₹${Math.round(iOwe)}</span></div>
                </div>
                <div class="debt-detail-box">
                    ${myDebts.map(d => `<div class="debt-item"><span>To <b>${d.to}</b></span><span class="text-give">-₹${Math.round(d.amount)}</span></div>`).join('')}
                    ${myCredits.map(c => `<div class="debt-item"><span>From <b>${c.from}</b></span><span class="text-get">+₹${Math.round(c.amount)}</span></div>`).join('')}
                    ${myDebts.length === 0 && myCredits.length === 0 ? '<p style="text-align:center; font-size:0.8rem; color:var(--text-light);">Clean! 🧘‍♂️</p>' : ''}
                </div>
                <div style="margin-top:1.5rem; padding-top:1rem; border-top:2px solid var(--bg-main); display:flex; justify-content:space-between; align-items:center;">
                    <span class="stat-label">Net Standing</span>
                    <span style="font-weight:900; color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${net >= 0 ? '+' : ''}₹${Math.round(net)}</span>
                </div>
            </div>`;
    });
    grid.innerHTML = html;
    lucide.createIcons();
}

function renderDetailedSettlements() {
    const container = document.getElementById('detailed-settlement-view');
    if (!container) return;
    let html = '';
    expenses.forEach(exp => {
        // CRITICAL FIX: Share is now absolute and does not change when others pay
        const share = exp.fixedShare || (parseFloat(exp.amount) / exp.participants.length);
        exp.participants.forEach(person => {
            if (person !== exp.paidBy) {
                html += `
                    <div class="activity-card animate-in">
                        <div class="activity-header"><span class="activity-title">${exp.title}</span><span class="activity-amount" style="color:var(--danger)">₹${Math.round(share)}</span></div>
                        <div class="debt-line" style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; border-top:1px dashed var(--border); padding-top:10px;">
                            <div class="debt-info"><b>${person}</b> owes <b>${exp.paidBy}</b></div>
                            <button class="btn" style="background:var(--success-soft); color:var(--success); padding:6px 12px; font-size:0.75rem;" 
                                onclick="processSettlement('${exp.id}', '${person}', '${exp.paidBy}', ${share}, '${exp.title}')">Mark Paid</button>
                        </div>
                    </div>`;
            }
        });
    });
    container.innerHTML = html || `<p style="text-align:center; color:var(--text-light);">No pending debts found! ☀️</p>`;
}

window.processSettlement = async (expId, from, to, amount, title) => {
    if (confirm(`Confirm ${from} paid ₹${Math.round(amount)} to ${to}?`)) {
        try {
            await db.ref('settledHistory').push({ from, to, amount, title, time: Date.now() });
            const expRef = db.ref('expenses').child(expId);
            const snap = await expRef.once('value');
            const data = snap.val();
            if (data) {
                const updated = data.participants.filter(p => p !== from);
                // Bill is only deleted if EVERYONE has paid the payer back
                if (updated.length <= 1) await expRef.remove();
                else await expRef.update({ participants: updated });
            }
            await logActivity(`${from} settled ₹${Math.round(amount)} with ${to}`, 'settle');
        } catch (e) { console.error(e); }
    }
};

function renderSettledHistory() {
    const container = document.getElementById('settled-history-view');
    if (!container) return;
    container.innerHTML = settledHistory.map(h => `
        <div class="activity-node" style="border-left: 4px solid var(--success); background: #f0fdf4; padding: 12px; margin-bottom: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.9rem;"><b>${h.from}</b> paid <b>${h.to}</b></span>
                <span style="color:var(--success); font-weight:900;">₹${Math.round(h.amount)}</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-light); margin-top:4px;">For: ${h.title} • ${new Date(h.time).toLocaleDateString()}</div>
        </div>`).join('') || `<p style="text-align:center; color:var(--text-light);">No history yet.</p>`;
}

// --- 7. CORE ACTIONS & FORMS ---
document.getElementById('expense-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const title = document.getElementById('exp-title').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const paidBy = document.getElementById('exp-payer').value;
    const category = document.getElementById('exp-category').value;
    const participants = Array.from(document.querySelectorAll('#split-participants input:checked')).map(i => i.value);

    if (participants.length === 0) return alert("Select at least one participant.");
    
    // ARCHITECTURAL UPGRADE: Calculate and lock the share amount at creation
    const fixedShare = amount / participants.length;

    btn.disabled = true; btn.innerText = "Saving...";
    try {
        await db.ref('expenses').push({ title, amount, paidBy, category, participants, fixedShare, time: Date.now() });
        await logActivity(`${paidBy} paid ₹${amount} for ${title}`, 'expense');
        closeModal('expenseModal'); e.target.reset();
    } catch (err) { alert(err.message); } finally { btn.disabled = false; btn.innerText = "Save Activity"; }
};

window.submitNewMember = async () => {
    const nameEl = document.getElementById('new-member-name');
    const emailEl = document.getElementById('new-member-email');
    const name = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    if (!name || !email) return alert("Enter Name and Gmail.");
    await db.ref('members').push({ name, email, addedDate: Date.now() });
    await logActivity(`${name} (${email}) joined`, 'join');
    nameEl.value = ''; emailEl.value = ''; closeModal('memberModal');
};

async function logActivity(text, type) { try { await db.ref('activityLogs').push({ text, type, time: Date.now() }); } catch(e) {} }

// --- 8. SECURITY & UTILS ---
window.triggerFullReset = () => {
    if (confirm("⚠️ DANGER: Permanent deletion of ALL data. Continue?") && confirm("FINAL CHECK: This cannot be undone. Proceed?")) {
        db.ref('/').remove().then(() => location.reload());
    }
};

window.openModal = (id) => { const m = document.getElementById(id); m.style.display = 'flex'; setTimeout(() => m.style.opacity = '1', 10); };
window.closeModal = (id) => { const m = document.getElementById(id); m.style.opacity = '0'; setTimeout(() => m.style.display = 'none', 300); };

function renderExpensesTable() {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    tbody.innerHTML = expenses.map(e => `
        <tr class="table-row-hover">
            <td><div class="bill-info"><span class="bill-title">${e.title}</span><span class="bill-date">${new Date(e.time).toLocaleDateString()}</span></div></td>
            <td class="hide-mobile"><b>${e.paidBy}</b></td>
            <td><span class="bill-amount">₹${Math.round(e.amount)}</span></td>
            <td><span class="badge badge-${e.category?.toLowerCase()}">${e.category}</span></td>
            <td><button class="btn" style="color:var(--danger); background:var(--danger-soft);" onclick="db.ref('expenses').child('${e.id}').remove()"><i data-lucide="trash-2" size="16"></i></button></td>
        </tr>`).join('');
    lucide.createIcons();
}

function renderMembersGrid() {
    const grid = document.getElementById('members-grid');
    if (!grid) return;
    grid.innerHTML = members.map(m => `
        <div class="stat-card member-card">
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="member-avatar">${m.name[0]}</div>
                <div><b>${m.name}</b><div style="font-size:0.6rem; color:var(--text-light);">${m.email}</div></div>
            </div>
            <button class="btn" onclick="db.ref('members').child('${m.id}').remove()" style="color:var(--danger); background:var(--danger-soft);"><i data-lucide="user-minus" size="16"></i></button>
        </div>`).join('') + `
        <div class="stat-card mobile-add-member" onclick="openModal('memberModal')" style="cursor:pointer; border:2px dashed var(--success); background:var(--success-soft);">
            <p class="stat-label" style="color:var(--success);">Manage Access</p><div class="stat-value" style="color:var(--success);"><i data-lucide="user-plus"></i></div>
        </div>`;
    lucide.createIcons();
}

function renderProfileStats() {
    const user = auth.currentUser;
    if(!user) return;
    let lent = 0, owed = 0;
    expenses.forEach(e => {
        const share = e.fixedShare || (e.amount / e.participants.length);
        if(e.paidBy === user.displayName) lent += (share * (e.participants.length - 1));
        else if(e.participants.includes(user.displayName)) owed += share;
    });
    if(document.getElementById('profile-lent-val')) document.getElementById('profile-lent-val').innerText = `₹${Math.round(lent)}`;
    if(document.getElementById('profile-owed-val')) document.getElementById('profile-owed-val').innerText = `₹${Math.round(owed)}`;
    if(document.getElementById('profile-balance-val')) document.getElementById('profile-balance-val').innerText = `₹${Math.round(lent - owed)}`;
}
