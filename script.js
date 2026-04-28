// --- Mock Data & LocalStorage ---
const INITIAL_TRANSACTIONS = [
    { id: 1, desc: 'Salário', amount: 4500.00, type: 'income', category: 'Salário', date: '2023-10-05' },
    { id: 2, desc: 'Aluguel', amount: 1500.00, type: 'expense', category: 'Moradia', date: '2023-10-06' },
    { id: 3, desc: 'Mercado', amount: 650.00, type: 'expense', category: 'Alimentação', date: '2023-10-10' },
    { id: 4, desc: 'Freelance', amount: 1200.00, type: 'income', category: 'Freelance', date: '2023-10-15' },
    { id: 5, desc: 'Internet', amount: 120.00, type: 'expense', category: 'Assinaturas', date: '2023-10-16' },
    { id: 6, desc: 'Transporte', amount: 300.00, type: 'expense', category: 'Transporte', date: '2023-10-20' },
    { id: 7, desc: 'Lazer', amount: 250.00, type: 'expense', category: 'Lazer', date: '2023-10-22' },
    { id: 8, desc: 'Investimentos', amount: 500.00, type: 'expense', category: 'Investimentos', date: '2023-10-25' } // Treating investment as money out of checking
];

const INITIAL_GOALS = [
    { id: 1, name: 'Reserva de Emergência', target: 10000, current: 4500, icon: 'fa-shield-halved' },
    { id: 2, name: 'Viagem', target: 5000, current: 1200, icon: 'fa-plane' }
];

let transactions = JSON.parse(localStorage.getItem('finance_transactions')) || INITIAL_TRANSACTIONS;
let goals = JSON.parse(localStorage.getItem('finance_goals')) || INITIAL_GOALS;
let userProfile = JSON.parse(localStorage.getItem('finance_user')) || { name: 'Usuário', email: 'usuario@email.com' };

// Normalize dates if not set to today for mock data
if (!localStorage.getItem('finance_transactions')) {
    const today = new Date();
    transactions = transactions.map(t => {
        // Just make the dates recent in the current month
        const d = new Date(t.date);
        d.setFullYear(today.getFullYear());
        d.setMonth(today.getMonth());
        return { ...t, date: d.toISOString().split('T')[0] };
    });
    saveData();
}

function saveData() {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    localStorage.setItem('finance_goals', JSON.stringify(goals));
}

// --- DOM Elements ---
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const totalProfitEl = document.getElementById('totalProfit');
const transactionsBody = document.getElementById('transactionsBody');
const emptyState = document.getElementById('emptyState');
const goalsList = document.getElementById('goalsList');
const insightsContainer = document.getElementById('insightsContainer');

// Modal Elements
const modal = document.getElementById('transactionModal');
const btnNewTransaction = document.getElementById('btnNewTransaction');
const closeModal = document.getElementById('closeModal');
const btnCancel = document.getElementById('btnCancel');
const transactionForm = document.getElementById('transactionForm');
const radioTypes = document.getElementsByName('type');
const categorySelect = document.getElementById('category');

// Navigation & Theme
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Profile
const greetingName = document.getElementById('greetingName');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');
const sidebarAvatar = document.getElementById('sidebarAvatar');

const userProfileBtn = document.getElementById('userProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const btnCancelProfile = document.getElementById('btnCancelProfile');
const profileForm = document.getElementById('profileForm');
const profileNameInput = document.getElementById('profileName');
const profileEmailInput = document.getElementById('profileEmail');

// Delete Confirm
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
let transactionToDeleteId = null;

// Notifications
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const markReadBtn = document.getElementById('markReadBtn');
const notifList = document.getElementById('notifList');
const notifBadge = document.getElementById('notifBadge');

// Filters
const typeFilter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchInput');
const periodFilterSelect = document.getElementById('periodFilter');

// Charts instances
let cashflowChartInstance = null;
let categoryChartInstance = null;
let currentPeriod = localStorage.getItem('finance_period') || 'month';
periodFilterSelect.value = currentPeriod;

let chartViewMode = 'month'; // 'month' or 'week'
const btnChartMonthly = document.getElementById('btnChartMonthly');
const btnChartWeekly = document.getElementById('btnChartWeekly');

// Goal Modal
const goalModal = document.getElementById('goalModal');
const btnNewGoal = document.getElementById('btnNewGoal');
const closeGoalModal = document.getElementById('closeGoalModal');
const btnCancelGoal = document.getElementById('btnCancelGoal');
const goalForm = document.getElementById('goalForm');
const goalModalTitle = document.getElementById('goalModalTitle');
const goalIdInput = document.getElementById('goalId');
const goalNameInput = document.getElementById('goalName');
const goalIconInput = document.getElementById('goalIcon');
const goalCurrentInput = document.getElementById('goalCurrent');
const goalTargetInput = document.getElementById('goalTarget');

    // Sidebar Overlay
const sidebarOverlay = document.getElementById('sidebarOverlay');

// --- Formatting ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR', options); // Hack for timezone
};

// --- Category Icons Mapping ---
const getCategoryIcon = (category) => {
    const icons = {
        'Salário': 'fa-money-bill-wave',
        'Freelance': 'fa-laptop-code',
        'Investimentos': 'fa-arrow-trend-up',
        'Outras Entradas': 'fa-plus',
        'Alimentação': 'fa-utensils',
        'Moradia': 'fa-house',
        'Transporte': 'fa-car',
        'Saúde': 'fa-notes-medical',
        'Lazer': 'fa-gamepad',
        'Educação': 'fa-book',
        'Assinaturas': 'fa-repeat',
        'Outros Gastos': 'fa-receipt'
    };
    return icons[category] || 'fa-tag';
};

// --- Core Logic ---
function getTransactionsByPeriod() {
    const now = new Date();
    return transactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        if (currentPeriod === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (currentPeriod === 'week') {
            const oneJan = new Date(now.getFullYear(),0,1);
            const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
            const currentWeek = Math.ceil(( now.getDay() + 1 + numberOfDays) / 7);
            const tDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
            const tWeek = Math.ceil(( d.getDay() + 1 + tDays) / 7);
            return tWeek === currentWeek && d.getFullYear() === now.getFullYear();
        } else if (currentPeriod === 'year') {
            return d.getFullYear() === now.getFullYear();
        }
        return true; // 'all'
    });
}

function calculateTotals(filteredTransactions) {
    const incomes = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = incomes - expenses;
    
    totalIncomeEl.innerText = formatCurrency(incomes);
    totalExpenseEl.innerText = formatCurrency(expenses);
    totalBalanceEl.innerText = formatCurrency(balance);
    totalProfitEl.innerText = formatCurrency(balance); // Simplification: Profit = Balance here
}

function renderTransactions(filteredTransactions) {
    transactionsBody.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        emptyState.classList.remove('hidden');
        transactionsBody.parentElement.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    transactionsBody.parentElement.classList.remove('hidden');

    // Sort by date descending
    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(t => {
        const isIncome = t.type === 'income';
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>
                <div class="td-name">
                    <div class="icon-box">
                        <i class="fa-solid ${getCategoryIcon(t.category)}"></i>
                    </div>
                    <span>${t.desc}</span>
                </div>
            </td>
            <td>${t.category}</td>
            <td>${formatDate(t.date)}</td>
            <td>
                <span class="type-badge ${t.type}">
                    <i class="fa-solid ${isIncome ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> 
                    ${isIncome ? 'Entrada' : 'Gasto'}
                </span>
            </td>
            <td class="${isIncome ? 'val-income' : 'val-expense'}">
                ${isIncome ? '+' : '-'} ${formatCurrency(t.amount)}
            </td>
            <td>
                <button class="action-btn delete" onclick="deleteTransaction(${t.id})" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        transactionsBody.appendChild(tr);
    });
}

function renderGoals() {
    goalsList.innerHTML = '';
    goals.forEach(g => {
        const percent = Math.min(100, Math.round((g.current / g.target) * 100));
        const div = document.createElement('div');
        div.className = 'goal-item';
        div.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">
                    <i class="fa-solid ${g.icon}"></i>
                    <span>${g.name}</span>
                </div>
                <div class="goal-actions">
                    <button class="action-btn" onclick="editGoal(${g.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteGoal(${g.id})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="goal-stats">
                <span>${formatCurrency(g.current)}</span>
                <span>Alvo: ${formatCurrency(g.target)}</span>
            </div>
        `;
        goalsList.appendChild(div);
    });
}

function generateInsights(filteredTransactions) {
    insightsContainer.innerHTML = '';
    
    const incomes = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const insights = [];
    
    if (incomes > expenses) {
        insights.push({ icon: 'fa-check-circle', text: 'Excelente! Seu saldo está positivo no período selecionado.' });
    } else if (expenses > incomes) {
        insights.push({ icon: 'fa-triangle-exclamation', text: 'Atenção: Seus gastos superaram suas entradas neste período.' });
    }
    
    // Find highest expense category
    const expByCategory = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
    });
    
    let maxCat = '';
    let maxVal = 0;
    for (const [cat, val] of Object.entries(expByCategory)) {
        if (val > maxVal) { maxVal = val; maxCat = cat; }
    }
    
    if (maxCat) {
        insights.push({ icon: 'fa-chart-pie', text: `Sua maior despesa foi com <strong>${maxCat}</strong> (${formatCurrency(maxVal)}).` });
    }

    insights.forEach(ins => {
        const div = document.createElement('div');
        div.className = 'insight-alert';
        div.innerHTML = `<i class="fa-solid ${ins.icon}"></i> <span>${ins.text}</span>`;
        insightsContainer.appendChild(div);
    });
}

// --- Charts Logic ---
function initCharts(filteredTransactions) {
    const isDark = body.classList.contains('dark-theme');
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Cashflow Chart (Line)
    const ctxCash = document.getElementById('cashflowChart').getContext('2d');
    
    if (cashflowChartInstance) cashflowChartInstance.destroy();

    // Grouping logic for line chart
    const groupedCash = {};
    const sorted = [...filteredTransactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        let key = '';
        if (chartViewMode === 'month') {
            key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        } else {
            key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        }
        
        if (!groupedCash[key]) groupedCash[key] = { income: 0, expense: 0 };
        if (t.type === 'income') groupedCash[key].income += t.amount;
        else groupedCash[key].expense += t.amount;
    });
    
    const labelsCash = Object.keys(groupedCash);
    const dataCash = labelsCash.map(k => groupedCash[k].income - groupedCash[k].expense);

    if (labelsCash.length === 0) {
        labelsCash.push('Sem dados');
        dataCash.push(0);
    }
    
    cashflowChartInstance = new Chart(ctxCash, {
        type: 'line',
        data: {
            labels: labelsCash,
            datasets: [{
                label: 'Saldo no Período',
                data: dataCash,
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#7C3AED'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: gridColor }, beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Category Chart (Doughnut)
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChartInstance) categoryChartInstance.destroy();

    const expByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
    });
    
    const labels = Object.keys(expByCategory);
    const data = Object.values(expByCategory);
    const bgColors = ['#7C3AED', '#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#06B6D4', '#8B5CF6', '#EC4899'];

    categoryChartInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? bgColors.slice(0, labels.length) : [gridColor],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }
            }
        }
    });
}

// --- Event Listeners ---

// Delete transaction
window.deleteTransaction = (id) => {
    transactionToDeleteId = id;
    deleteConfirmModal.classList.add('active');
};

const closeDeleteModalFunc = () => {
    deleteConfirmModal.classList.remove('active');
    transactionToDeleteId = null;
};

closeDeleteModal.addEventListener('click', closeDeleteModalFunc);
btnCancelDelete.addEventListener('click', closeDeleteModalFunc);

btnConfirmDelete.addEventListener('click', () => {
    if (transactionToDeleteId !== null) {
        transactions = transactions.filter(t => t.id !== transactionToDeleteId);
        saveData();
        updateDashboard();
        closeDeleteModalFunc();
    }
});

// Filter & Search
const applyFilters = () => {
    const type = typeFilter.value;
    const term = searchInput.value.toLowerCase();
    
    let filtered = getTransactionsByPeriod();
    
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }
    
    if (term) {
        filtered = filtered.filter(t => t.desc.toLowerCase().includes(term) || t.category.toLowerCase().includes(term));
    }
    
    renderTransactions(filtered);
    // Note: Local table search filter works upon the current selected period data
};

typeFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

periodFilterSelect.addEventListener('change', (e) => {
    currentPeriod = e.target.value;
    localStorage.setItem('finance_period', currentPeriod);
    updateDashboard();
});

btnChartMonthly.addEventListener('click', () => {
    chartViewMode = 'month';
    btnChartMonthly.classList.add('active');
    btnChartWeekly.classList.remove('active');
    initCharts(getTransactionsByPeriod());
});

btnChartWeekly.addEventListener('click', () => {
    chartViewMode = 'week';
    btnChartWeekly.classList.add('active');
    btnChartMonthly.classList.remove('active');
    initCharts(getTransactionsByPeriod());
});

// Form Dynamic Category selection based on type
const updateCategoryOptions = () => {
    const isIncome = document.querySelector('input[name="type"]:checked').value === 'income';
    const incomeOptGroup = document.getElementById('incomeCategories');
    const expenseOptGroup = document.getElementById('expenseCategories');
    
    if (isIncome) {
        incomeOptGroup.style.display = 'block';
        expenseOptGroup.style.display = 'none';
        // Select first available automatically
        categorySelect.value = incomeOptGroup.children[0].value;
    } else {
        incomeOptGroup.style.display = 'none';
        expenseOptGroup.style.display = 'block';
        categorySelect.value = expenseOptGroup.children[0].value;
    }
};

radioTypes.forEach(radio => radio.addEventListener('change', updateCategoryOptions));

// Form Submit
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = document.querySelector('input[name="type"]:checked').value;
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = categorySelect.value;
    
    const newTrans = {
        id: Date.now(), // simple unique id
        desc,
        amount,
        type,
        category,
        date
    };
    
    transactions.push(newTrans);
    saveData();
    
    closeModalFunc();
    updateDashboard();
    
    // Reset form manually
    transactionForm.reset();
    updateCategoryOptions();
    
    // Show success message (simple alert for now)
    // alert('Transação adicionada com sucesso!');
});

// Modal controls
const openModal = () => {
    modal.classList.add('active');
    document.getElementById('date').valueAsDate = new Date(); // default to today
    updateCategoryOptions();
};
const closeModalFunc = () => modal.classList.remove('active');

btnNewTransaction.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFunc);
btnCancel.addEventListener('click', closeModalFunc);

// Goals CRUD
window.editGoal = (id) => {
    const g = goals.find(x => x.id === id);
    if(g) {
        goalIdInput.value = g.id;
        goalNameInput.value = g.name;
        goalIconInput.value = g.icon;
        goalCurrentInput.value = g.current;
        goalTargetInput.value = g.target;
        goalModalTitle.innerText = 'Editar Meta';
        goalModal.classList.add('active');
    }
};

window.deleteGoal = (id) => {
    if(confirm('Tem certeza que deseja excluir esta meta?')) {
        goals = goals.filter(x => x.id !== id);
        saveData();
        renderGoals();
    }
};

const closeGoalModalFunc = () => goalModal.classList.remove('active');

btnNewGoal.addEventListener('click', () => {
    goalForm.reset();
    goalIdInput.value = '';
    goalModalTitle.innerText = 'Nova Meta';
    goalModal.classList.add('active');
});
closeGoalModal.addEventListener('click', closeGoalModalFunc);
btnCancelGoal.addEventListener('click', closeGoalModalFunc);

goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = goalIdInput.value;
    const name = goalNameInput.value;
    const icon = goalIconInput.value;
    const current = parseFloat(goalCurrentInput.value);
    const target = parseFloat(goalTargetInput.value);
    
    if(target <= 0) {
        alert('Valor alvo não pode ser menor ou igual a zero.');
        return;
    }
    
    if (id) {
        const g = goals.find(x => x.id == id);
        if(g) { g.name = name; g.icon = icon; g.current = current; g.target = target; }
    } else {
        goals.push({ id: Date.now(), name, icon, current, target });
    }
    saveData();
    renderGoals();
    closeGoalModalFunc();
});

// Profile logic
function updateProfileUI() {
    greetingName.innerText = userProfile.name;
    sidebarUserName.innerText = userProfile.name;
    sidebarUserEmail.innerText = userProfile.email;
    sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=7C3AED&color=fff`;
}

const openProfileModal = () => {
    profileNameInput.value = userProfile.name;
    profileEmailInput.value = userProfile.email;
    editProfileModal.classList.add('active');
};
const closeProfileModalFunc = () => editProfileModal.classList.remove('active');

userProfileBtn.addEventListener('click', openProfileModal);
closeProfileModal.addEventListener('click', closeProfileModalFunc);
btnCancelProfile.addEventListener('click', closeProfileModalFunc);

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userProfile.name = profileNameInput.value;
    userProfile.email = profileEmailInput.value;
    localStorage.setItem('finance_user', JSON.stringify(userProfile));
    updateProfileUI();
    closeProfileModalFunc();
});

// Notifications Logic
let notifications = [
    { id: 1, text: 'Nova entrada de R$ 4.500,00 adicionada', time: 'Há 2 horas', icon: 'fa-arrow-up', type: 'income' },
    { id: 2, text: 'Você atingiu 45% da sua meta Reserva', time: 'Ontem', icon: 'fa-bullseye', type: 'neutral' },
    { id: 3, text: 'Gasto alto detectado em Moradia', time: 'Há 3 dias', icon: 'fa-triangle-exclamation', type: 'expense' }
];

function renderNotifications() {
    notifList.innerHTML = '';
    
    if (notifications.length === 0) {
        notifBadge.style.display = 'none';
        notifList.innerHTML = '<div class="notif-empty">Nenhuma notificação nova</div>';
        return;
    }
    
    notifBadge.style.display = 'flex';
    notifBadge.innerText = notifications.length;
    
    notifications.forEach(notif => {
        const div = document.createElement('div');
        div.className = 'notif-item';
        div.innerHTML = `
            <div class="notif-icon">
                <i class="fa-solid ${notif.icon}"></i>
            </div>
            <div class="notif-content">
                <p>${notif.text}</p>
                <span class="notif-time">${notif.time}</span>
            </div>
        `;
        notifList.appendChild(div);
    });
}

notificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsDropdown.classList.toggle('active');
});

markReadBtn.addEventListener('click', () => {
    notifications = [];
    renderNotifications();
    notificationsDropdown.classList.remove('active');
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.dataset.theme = 'light';
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        body.classList.add('dark-theme');
        body.dataset.theme = 'dark';
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    // Re-init charts to update colors
    initCharts(getTransactionsByPeriod());
});

// Sidebar Mobile Toggle
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
});

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
});

// Sidebar Navigation Smooth Scroll
const sidebarMenuLinks = document.querySelectorAll('#sidebarMenu a');
sidebarMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all
        sidebarMenuLinks.forEach(l => l.parentElement.classList.remove('active'));
        
        // Add active class to clicked
        e.currentTarget.parentElement.classList.add('active');
        
        // Smooth scroll
        const targetId = e.currentTarget.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        }
    });
});

// Global clicks for modals and dropdowns
document.addEventListener('click', (e) => {
    // Close sidebar on mobile when clicking outside
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn && !mobileMenuBtn.contains(e.target) && e.target !== sidebarOverlay) {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        }
    }
    
    // Notifications dropdown
    if (!notificationsDropdown.contains(e.target) && e.target !== notificationsBtn && !notificationsBtn.contains(e.target)) {
        notificationsDropdown.classList.remove('active');
    }
    
    // Modals
    if(e.target === modal) closeModalFunc();
    if(e.target === editProfileModal) closeProfileModalFunc();
    if(e.target === deleteConfirmModal) closeDeleteModalFunc();
    if(e.target === goalModal) closeGoalModalFunc();
});

// --- Init Dashboard ---
function updateDashboard() {
    updateProfileUI();
    renderNotifications();
    
    const periodTransactions = getTransactionsByPeriod();
    
    calculateTotals(periodTransactions);
    renderTransactions(periodTransactions);
    renderGoals();
    generateInsights(periodTransactions);
    initCharts(periodTransactions);
}

// Initial Call
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});
