
// --- 1. CONFIGURATION ---

const firebaseConfig = {

    apiKey: "AIzaSyCy5NOv_bRx8Ozbq3n5MzXz8D7cF1Piwko",

    authDomain: "services-6ce70.firebaseapp.com",

    databaseURL: "https://services-6ce70-default-rtdb.firebaseio.com",

    projectId: "services-6ce70",

    storageBucket: "services-6ce70.firebasestorage.app",

    messagingSenderId: "153760408547",

    appId: "1:153760408547:web:5f61c39085dbe2f828b6d6"

};



let members = [];

let expenses = [];

let lastLogsData = []; 

let currentFilters = { type: 'all', member: 'all' };



// Initialize Firebase

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const auth = firebase.auth();

const provider = new firebase.auth.GoogleAuthProvider();



// --- 2. AUTHENTICATION ENGINE ---



// Handle Login

document.getElementById('google-login-btn').onclick = () => {

    auth.signInWithPopup(provider).catch(err => alert("Login Error: " + err.message));

};



// Handle Logout

window.handleLogout = () => {

    if(confirm("Are you sure you want to sign out?")) {

        auth.signOut().then(() => location.reload());

    }

};



// Monitor Auth State

auth.onAuthStateChanged((user) => {

    const overlay = document.getElementById('auth-overlay');

    if (user) {

        overlay.style.display = 'none';

        document.getElementById('user-name').innerText = user.displayName;

        document.getElementById('user-photo').src = user.photoURL;

        

        // Start App Logic

        startRealTimeSync();

        showSection('dashboard');

        

        // Admin Logic

        if (user.email === "akhilgoel985@gmail.com") {

            console.log("Welcome Admin: Akhil");

        }

    } else {

        overlay.style.display = 'flex';

    }

});



// --- 3. SMART ACTIVITY LOGGER ---



async function logActivity(text, type) {

    try {

        await db.ref('activityLogs').push({

            text: text,

            type: type,

            time: Date.now()

        });

    } catch (err) { console.error("Log failed", err); }

}



// --- 4. NAVIGATION & DYNAMIC UI ---



window.showSection = (sectionId) => {

    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));

    document.querySelectorAll('.nav-link, .m-nav-item').forEach(n => n.classList.remove('active'));

    

    const target = document.getElementById(`${sectionId}-section`);

    if (target) target.classList.remove('hidden');

    

    document.querySelectorAll(`[onclick="showSection('${sectionId}')"]`).forEach(el => el.classList.add('active'));

    document.getElementById('section-title').innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);



    const desktopAction = document.getElementById('desktop-action-container');

    const mobileAction = document.getElementById('mobile-action-btn');



    if (sectionId === 'members') {

        const btnHtml = `<button class="btn btn-primary" onclick="openModal('memberModal')" style="background: var(--success);"><i data-lucide="user-plus"></i> <span>Member</span></button>`;

        desktopAction.innerHTML = btnHtml;

        mobileAction.style.display = 'flex';

        mobileAction.setAttribute('onclick', "openModal('memberModal')");

        mobileAction.innerHTML = `<i data-lucide="user-plus" style="color: var(--success);"></i><span>Add</span>`;

    } else if (sectionId === 'settlements') {

        desktopAction.innerHTML = '';

        mobileAction.style.display = 'none';

        renderDetailedSettlements();

    } else {

        const btnHtml = `<button class="btn btn-primary" onclick="openModal('expenseModal')"><i data-lucide="plus"></i> <span>Expense</span></button>`;

        desktopAction.innerHTML = btnHtml;

        mobileAction.style.display = 'flex';

        mobileAction.setAttribute('onclick', "openModal('expenseModal')");

        mobileAction.innerHTML = `<i data-lucide="plus-circle" style="color: var(--primary);"></i><span>Add</span>`;

    }

    

    lucide.createIcons();

    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });

};



window.openModal = (id) => {

    const modal = document.getElementById(id);

    modal.style.display = 'flex';

    setTimeout(() => modal.style.opacity = '1', 10);

};



window.closeModal = (id) => {

    const modal = document.getElementById(id);

    modal.style.opacity = '0';

    setTimeout(() => modal.style.display = 'none', 300);

};



// --- 5. ADVANCED FILTERING ---



window.toggleFilter = () => {

    const panel = document.getElementById('filter-panel');

    const trigger = document.getElementById('filter-trigger');

    const isHidden = panel.classList.toggle('hidden');

    trigger.classList.toggle('active-filter', !isHidden);

};



window.applyFilters = () => {

    currentFilters.type = document.getElementById('filter-type').value;

    currentFilters.member = document.getElementById('filter-member').value;

    renderActivityFeed(); 

};



function updateFilterDropdowns() {

    const memberSelect = document.getElementById('filter-member');

    if (!memberSelect) return;

    const currentVal = memberSelect.value;

    memberSelect.innerHTML = `<option value="all">Everyone</option>` + members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');

    memberSelect.value = currentVal;

}



function renderActivityFeed(snap) {

    const feed = document.getElementById('activity-feed');

    if (!feed) return;

    const data = snap ? (snap.val() ? Object.values(snap.val()).reverse() : []) : lastLogsData;

    lastLogsData = data; 



    const filteredLogs = data.filter(log => {

        const matchesType = currentFilters.type === 'all' || log.type === currentFilters.type;

        const matchesMember = currentFilters.member === 'all' || log.text.includes(currentFilters.member);

        return matchesType && matchesMember;

    });



    if (filteredLogs.length === 0) {

        feed.innerHTML = `<div style="padding: 2rem; text-align:center; color: var(--text-light); font-size: 0.8rem;">No activity matching filters</div>`;

        return;

    }



    feed.innerHTML = filteredLogs.map(l => {

        let icon = 'bell', typeClass = 'act-join';

        if (l.type === 'expense') { icon = 'shopping-bag'; typeClass = 'act-expense'; }

        else if (l.type === 'settle') { icon = 'check-circle'; typeClass = 'act-settle'; }

        else if (l.type === 'join') { icon = 'user-plus'; typeClass = 'act-join'; }

        const timeStr = new Date(l.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `<div class="activity-card-mini ${typeClass} animate-in"><div class="activity-icon"><i data-lucide="${icon}" size="14"></i></div><div class="activity-info"><span class="activity-text">${l.text}</span><span class="activity-time">${timeStr}</span></div></div>`;

    }).join('');

    lucide.createIcons();

}



// --- 6. DATA SYNC ---



function startRealTimeSync() {

    db.ref('members').on('value', snap => {

        members = snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [];

        refreshUI();

        updateFilterDropdowns();

    });

    db.ref('expenses').on('value', snap => {

        expenses = snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [];

        refreshUI();

    });

    db.ref('activityLogs').limitToLast(30).on('value', snap => renderActivityFeed(snap));

}



function refreshUI() {

    const payerSelect = document.getElementById('exp-payer');

    if (payerSelect) payerSelect.innerHTML = members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');



    const splitBox = document.getElementById('split-participants');

    if (splitBox) splitBox.innerHTML = members.map(m => `<label><input type="checkbox" value="${m.name}" checked> <span>${m.name}</span></label>`).join('');



    renderExpensesTable();

    renderMembersGrid();

    

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    document.getElementById('total-expense-val').innerText = `₹${totalSpent.toLocaleString('en-IN')}`;

    document.getElementById('pending-settle-val').innerText = expenses.length;

}



// --- 7. RENDERING COMPONENTS ---



function renderExpensesTable() {

    const tbody = document.getElementById('expenses-tbody');

    if (!tbody) return;

    tbody.innerHTML = expenses.map(e => {

        let catIcon = (e.category === 'Food') ? 'utensils' : (e.category === 'Travel') ? 'car' : (e.category === 'Stay') ? 'home' : 'layers';

        const dateStr = new Date(e.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

        return `<tr class="table-row-hover"><td><div class="bill-info"><span class="bill-title">${e.title}</span><span class="bill-date"><i data-lucide="calendar" size="12"></i> ${dateStr}</span></div></td><td class="hide-mobile"><div style="display:flex; align-items:center; gap:8px;"><div class="member-avatar" style="width:28px; height:28px; font-size:0.7rem;">${e.paidBy[0]}</div><span style="font-weight:700;">${e.paidBy}</span></div></td><td><span class="bill-amount">₹${parseFloat(e.amount).toLocaleString('en-IN')}</span></td><td><span class="badge badge-${e.category?.toLowerCase()}"><i data-lucide="${catIcon}" size="12"></i> ${e.category}</span></td><td class="action-cell"><button class="btn" style="color:var(--danger); background: var(--danger-soft); border-radius:12px; padding:10px;" onclick="triggerDelete('expenses', '${e.id}', '${e.title}')"><i data-lucide="trash-2" size="18"></i></button></td></tr>`;

    }).join('') || `<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--text-light);">No trip expenses recorded.</td></tr>`;

    lucide.createIcons();

}



function renderMembersGrid() {

    const grid = document.getElementById('members-grid');

    if (!grid) return;

    let html = members.map(m => `<div class="stat-card member-card animate-in" onclick="openUserProfile('${m.name}')"><div class="member-profile-btn"><div class="member-avatar">${m.name[0]}</div><div><div style="font-weight:800">${m.name}</div><div style="font-size:0.7rem; color:var(--text-muted)">View Ledger</div></div></div><button class="btn" onclick="event.stopPropagation(); triggerDelete('members', '${m.id}', '${m.name}')"><i data-lucide="user-minus" size="16"></i></button></div>`).join('');

    html += `<div class="stat-card mobile-add-member" onclick="openModal('memberModal')" style="cursor: pointer; background: #f0fdf4; border: 2px dashed #bbf7d0;"><p class="stat-label" style="color: #16a34a;">Add Friend</p><div class="stat-value" style="color: #16a34a;"><i data-lucide="user-plus"></i></div></div>`;

    grid.innerHTML = html;

    lucide.createIcons();

}



// --- 8. ACTIONS ---



document.getElementById('expense-form').onsubmit = async (e) => {

    e.preventDefault();

    const title = document.getElementById('exp-title').value;

    const amount = document.getElementById('exp-amount').value;

    const paidBy = document.getElementById('exp-payer').value;

    const category = document.getElementById('exp-category').value;

    const participants = Array.from(document.querySelectorAll('#split-participants input:checked')).map(i => i.value);



    if (participants.length === 0) return alert("Select at least one participant!");

    await db.ref('expenses').push({ title, amount, paidBy, category, participants, time: Date.now() });

    logActivity(`${paidBy} paid ₹${amount} for ${title}`, 'expense');

    closeModal('expenseModal');

    e.target.reset();

};



window.submitNewMember = async () => {

    const input = document.getElementById('new-member-name');

    const name = input.value.trim();

    if (!name) return;

    await db.ref('members').push({ name });

    logActivity(`${name} joined the trip`, 'join');

    input.value = '';

    closeModal('memberModal');

};



// --- 9. SETTLEMENTS & LEDGER ---



window.settleSpecificDebt = async (expenseId, person, title) => {

    if (confirm(`Mark ${person}'s share for "${title}" as paid?`)) {

        const expRef = db.ref('expenses').child(expenseId);

        const snap = await expRef.once('value');

        const exp = snap.val();

        const newParticipants = exp.participants.filter(p => p !== person);

        if (newParticipants.length === 0) await expRef.remove();

        else await expRef.update({ participants: newParticipants });

        logActivity(`${person} settled for ${title}`, 'settle');

        if (!document.getElementById('settlements-section').classList.contains('hidden')) renderDetailedSettlements();

    }

};



function renderDetailedSettlements() {

    const container = document.getElementById('detailed-settlement-view');

    if (!container) return;

    let html = expenses.flatMap(exp => {

        const share = parseFloat(exp.amount) / (exp.participants?.length || 1);

        return exp.participants.filter(p => p !== exp.paidBy).map(person => `<div class="activity-card animate-in"><div class="activity-header"><span class="activity-title">${exp.title}</span><span class="activity-amount">₹${Math.round(share)}</span></div><div class="debt-line"><div class="debt-info"><strong>${person}</strong> owes <strong>${exp.paidBy}</strong></div><button class="btn" style="background: var(--success-soft); color: var(--success); padding: 6px 12px; font-size: 0.7rem;" onclick="settleSpecificDebt('${exp.id}', '${person}', '${exp.title}')">Mark Paid</button></div></div>`);

    }).join('');

    container.innerHTML = html || `<div class="activity-card">Everything is settled! ☀️</div>`;

    lucide.createIcons();

}



window.openUserProfile = (name) => {

    const historyList = document.getElementById('user-transaction-history');

    let toPay = 0, toReceive = 0, historyHtml = '';

    expenses.forEach(exp => {

        const share = parseFloat(exp.amount) / exp.participants.length;

        if (exp.paidBy === name) {

            const othersShare = parseFloat(exp.amount) - share;

            toReceive += othersShare;

            historyHtml += `<div class="activity-node" style="border-left-color: var(--success)"><b>${exp.title}:</b> Getting back ₹${Math.round(othersShare)}.</div>`;

        } else if (exp.participants.includes(name)) {

            toPay += share;

            historyHtml += `<div class="activity-node" style="border-left-color: var(--danger)"><b>${exp.title}:</b> You owe ${exp.paidBy} ₹${Math.round(share)}.</div>`;

        }

    });

    document.getElementById('user-profile-header').innerHTML = `<h2 style="font-weight:900; font-size: 2rem;">${name}</h2><div style="display:flex; gap:10px; margin-top:10px;"><div class="badge badge-success">Receive: ₹${Math.round(toReceive)}</div><div class="badge" style="background:#fee2e2; color:#ef4444">Owe: ₹${Math.round(toPay)}</div></div>`;

    historyList.innerHTML = historyHtml || "<p>No active history.</p>";

    openModal('userProfileModal');

};



// --- 10. DANGER ZONE ---



window.triggerFullReset = () => {

    if (confirm("DANGER: This will delete everything! Are you sure?")) {

        db.ref('/').remove();

        location.reload();

    }

};



window.triggerDelete = (path, id, label) => {

    if (confirm(`Delete ${label}?`)) db.ref(path).child(id).remove();

};
