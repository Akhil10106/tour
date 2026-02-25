/**
 * TripSplit Premium Core Engine v5.0
 * Features: Adaptive UI, Greedy Debt Minimization, Real-time Firebase Sync
 * Architecture: Event-Driven Micro-UX
 */

// --- 1. CONFIGURATION & STATE ---
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

// Global Store
let members = [];
let expenses = [];
let activeSection = 'dashboard';

// Initialize Firebase with safety check
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- 2. THE ADAPTIVE NAVIGATION ENGINE ---

/**
 * Handles seamless transitions between different app sections
 * with opacity fades and scroll resets.
 */
window.showSection = (sectionId) => {
    const sections = document.querySelectorAll('.section-content');
    const navLinks = document.querySelectorAll('.nav-link, .m-nav-item');
    
    // 1. Exit Animation
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        setTimeout(() => section.classList.add('hidden'), 200);
    });

    // 2. State Update
    activeSection = sectionId;

    // 3. Entry Animation
    setTimeout(() => {
        const target = document.getElementById(`${sectionId}-section`);
        if (target) {
            target.classList.remove('hidden');
            // Trigger reflow
            void target.offsetWidth; 
            target.style.opacity = '1';
            target.style.transform = 'translateY(0)';
        }
        
        // Update Navbar Visuals
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick').includes(sectionId)) {
                link.classList.add('active');
            }
        });

        // Dynamic Title Update
        const titleEl = document.getElementById('section-title');
        if (titleEl) titleEl.innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        
        lucide.createIcons();
    }, 250);

    // UX: Auto-scroll to top for mobile users
    if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// --- 3. PREMIUM UI INTERACTIONS (MODALS & TOASTS) ---

window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    modal.style.display = 'flex';
    // Visual Entrance
    setTimeout(() => {
        modal.style.opacity = '1';
        const content = modal.querySelector('.modal-content');
        if (content) content.style.transform = 'scale(1) translateY(0)';
    }, 10);

    // Auto-focus logic for better keyboard UX
    const focusEl = modal.querySelector('input, select');
    if (focusEl) setTimeout(() => focusEl.focus(), 350);
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.style.opacity = '0';
    const content = modal.querySelector('.modal-content');
    if (content) content.style.transform = 'scale(0.95) translateY(20px)';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Support for different icons based on type
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'x-circle' : 'info');
    toast.innerHTML = `<i data-lucide="${icon}" size="18"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons();

    // Auto-remove with exit animation
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
};

// --- 4. FINANCIAL CORE: THE CALCULATION ENGINE ---

/**
 * Orchestrates the entire balance calculation.
 * Uses a greedy debt minimization algorithm to simplify transactions.
 */
function processFinancials() {
    let totalTripSpent = 0;
    const netBalances = {}; 
    const outOfPocket = {}; 

    // Initialize person-specific maps
    members.forEach(m => {
        netBalances[m.name] = 0;
        outOfPocket[m.name] = 0;
    });

    // Aggregate all expenses
    expenses.forEach(exp => {
        const amount = parseFloat(exp.amount);
        if (isNaN(amount)) return;

        totalTripSpent += amount;
        outOfPocket[exp.paidBy] = (outOfPocket[exp.paidBy] || 0) + amount;

        const share = amount / (exp.participants?.length || 1);
        
        // Payer is owed the full amount
        if (netBalances.hasOwnProperty(exp.paidBy)) {
            netBalances[exp.paidBy] += amount;
        }

        // Every participant owes their share
        exp.participants.forEach(p => {
            if (netBalances.hasOwnProperty(p)) {
                netBalances[p] -= share;
            }
        });
    });

    // Update Dashboard Metrics
    animateCounter('total-expense-val', totalTripSpent);
    
    const topPayer = Object.keys(outOfPocket).reduce((a, b) => 
        (outOfPocket[a] > outOfPocket[b]) ? a : b, '---');
    
    const topPayerEl = document.getElementById('top-payer-val');
    if (topPayerEl) topPayerEl.innerText = topPayer === '---' ? 'None' : topPayer;

    renderSettlements(netBalances);
}

/**
 * DEBT MINIMIZATION ALGORITHM
 * Reduces the number of payments needed to settle the trip.
 */
function renderSettlements(netBalances) {
    const list = document.getElementById('settlement-list');
    if (!list) return;

    const debtors = [], creditors = [];
    
    Object.entries(netBalances).forEach(([name, balance]) => {
        if (balance < -0.99) debtors.push({ name, amount: Math.abs(balance) });
        else if (balance > 0.99) creditors.push({ name, amount: balance });
    });

    // Sort descending to settle largest amounts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let html = '';
    let count = 0;
    let i = 0, j = 0;

    

    while (i < debtors.length && j < creditors.length) {
        const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
        
        html += `
            <div class="settle-item animate-in">
                <div class="settle-names">
                    <span class="debtor">${debtors[i].name}</span>
                    <i data-lucide="chevron-right" size="14"></i>
                    <span class="creditor">${creditors[j].name}</span>
                </div>
                <div class="amount-tag">₹${Math.round(settleAmount).toLocaleString('en-IN')}</div>
            </div>`;
        
        debtors[i].amount -= settleAmount;
        creditors[j].amount -= settleAmount;

        if (debtors[i].amount < 1) i++;
        if (creditors[j].amount < 1) j++;
        count++;
    }

    list.innerHTML = html || `<div class="empty-state">
        <i data-lucide="sun" size="32"></i>
        <p>Everything is settled!</p>
    </div>`;

    const debtCountEl = document.getElementById('pending-settle-val');
    if (debtCountEl) debtCountEl.innerText = count;
    
    lucide.createIcons();
}

// --- 5. REAL-TIME DATA SYNCHRONIZATION ---

function startRealTimeSync() {
    // Sync Members
    db.ref('members').on('value', snap => {
        const val = snap.val();
        members = val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : [];
        syncInternalUI();
    });

    // Sync Expenses
    db.ref('expenses').on('value', snap => {
        const val = snap.val();
        expenses = val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : [];
        syncInternalUI();
    });

    // Sync Activity Log
    db.ref('activityLogs').limitToLast(12).on('value', snap => {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;
        const data = snap.val() ? Object.values(snap.val()).reverse() : [];
        
        feed.innerHTML = data.map(log => `
            <div class="activity-node">
                <div class="node-content">
                    <p class="node-text">${log.text}</p>
                    <span class="node-time">${new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
        `).join('');
    });
}

function syncInternalUI() {
    // 1. Update Input Selections
    const payerSelect = document.getElementById('exp-payer');
    const splitContainer = document.getElementById('split-participants');
    
    if (payerSelect) {
        payerSelect.innerHTML = members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    }

    if (splitContainer) {
        splitContainer.innerHTML = members.map(m => `
            <label class="custom-checkbox">
                <input type="checkbox" value="${m.name}" checked>
                <div class="checkbox-tile">
                    <span>${m.name}</span>
                </div>
            </label>
        `).join('');
    }

    // 2. Refresh Calculations
    processFinancials();

    // 3. Render Lists
    renderExpensesTable();
    renderMembersGrid();
}

// --- 6. TABLE & LIST RENDERING ---

function renderExpensesTable() {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;

    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-table">No expenses found for this trip.</td></tr>`;
        return;
    }

    tbody.innerHTML = expenses.map(e => `
        <tr class="table-row-hover">
            <td>
                <div class="bill-info">
                    <span class="bill-title">${e.title}</span>
                    <span class="bill-date">${new Date(e.time || Date.now()).toLocaleDateString()}</span>
                </div>
            </td>
            <td class="hide-mobile">${e.paidBy}</td>
            <td class="bill-amount">₹${parseFloat(e.amount).toLocaleString('en-IN')}</td>
            <td><span class="badge badge-${e.category?.toLowerCase() || 'misc'}">${e.category}</span></td>
            <td class="action-cell">
                <button class="icon-btn delete" onclick="triggerDelete('expenses', '${e.id}', '${e.title}')">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderMembersGrid() {
    const grid = document.getElementById('members-grid');
    if (!grid) return;

    grid.innerHTML = members.map(m => `
        <div class="stat-card member-card animate-in">
            <div class="member-profile">
                <div class="member-avatar">${m.name[0].toUpperCase()}</div>
                <div class="member-meta">
                    <span class="member-name">${m.name}</span>
                    <span class="member-role">Traveler</span>
                </div>
            </div>
            <button class="icon-btn delete" onclick="triggerDelete('members', '${m.id}', '${m.name}')">
                <i data-lucide="user-minus" size="18"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- 7. DATABASE MODIFICATION HANDLERS ---

window.openMemberPrompt = () => {
    const input = document.getElementById('new-member-name');
    if (input) input.value = '';
    openModal('memberModal');
};

window.submitNewMember = async () => {
    const nameInput = document.getElementById('new-member-name');
    const name = nameInput.value.trim();

    if (!name) {
        showToast("Please enter a valid name", "error");
        return;
    }

    try {
        const newRef = db.ref('members').push();
        await newRef.set({ name, joinedAt: Date.now() });
        
        await db.ref('activityLogs').push({
            text: `👋 ${name} was added to the trip`,
            time: Date.now()
        });

        closeModal('memberModal');
        showToast(`${name} added successfully!`);
    } catch (err) {
        showToast("Sync failed. Check connection.", "error");
    }
};

document.getElementById('expense-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amount').value;
    const paidBy = document.getElementById('exp-payer').value;
    const category = document.getElementById('exp-category').value;
    const participants = Array.from(document.querySelectorAll('#split-participants input:checked')).map(i => i.value);

    if (participants.length === 0) {
        showToast("Select at least one participant", "error");
        return;
    }

    try {
        await db.ref('expenses').push({
            title, amount, paidBy, category, participants, time: Date.now()
        });

        await db.ref('activityLogs').push({
            text: `💰 ${paidBy} paid ₹${amount} for ${title}`,
            time: Date.now()
        });

        closeModal('expenseModal');
        e.target.reset();
        showToast("Expense recorded!");
    } catch (err) {
        showToast("Error saving expense", "error");
    }
};

window.triggerDelete = (path, id, label) => {
    const modal = document.getElementById('custom-confirm-modal');
    const msg = document.getElementById('confirm-message');
    msg.innerText = `Are you sure you want to remove "${label}"? This cannot be undone.`;
    
    modal.style.display = 'flex';
    
    document.getElementById('confirm-proceed').onclick = async () => {
        await db.ref(path).child(id).remove();
        modal.style.display = 'none';
        showToast("Item deleted", "success");
    };
    
    document.getElementById('confirm-cancel').onclick = () => {
        modal.style.display = 'none';
    };
};

// --- 8. UTILITIES & STARTUP ---

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const startValue = parseInt(el.innerText.replace(/\D/g, '')) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth stop
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * (target - startValue) + startValue);
        
        el.innerText = `₹${current.toLocaleString('en-IN')}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// Global Startup
window.onload = () => {
    lucide.createIcons();
    startRealTimeSync();
    
    // Default Start Section
    showSection('dashboard');
    
    // Console Welcome for Developers
    console.log("%c TripSplit Premium v5.0 Loaded ", "background: #2563eb; color: white; padding: 5px; border-radius: 5px;");
};
