let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function toggleOtherCategoryInput() {
  const categorySelect = document.getElementById('category');
  const customInput = document.getElementById('customCategory');
  
  if (categorySelect.value === 'Other') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
  }
}

function addTransaction() {
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const categorySelect = document.getElementById('category');
  const customInput = document.getElementById('customCategory');
  const reason = document.getElementById('reason').value.trim();

  let category = categorySelect.value;
  if (category === 'Other') {
    category = customInput.value.trim();
  }

  if (!amount || !category || !reason) {
    alert("Please fill all fields!");
    return;
  }

  const newTxn = {
    id: Date.now(),
    date: new Date().toISOString(),
    amount,
    type,
    category,
    reason
  };

  transactions.unshift(newTxn);
  saveAndRender();
  
  document.getElementById('amount').value = '';
  document.getElementById('reason').value = '';
  categorySelect.value = '';
  customInput.value = '';
  customInput.style.display = 'none';
}

function deleteTransaction(id) {
  if(confirm("Delete this transaction?")) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndRender();
  }
}

function saveAndRender() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  filterHistory(); 
  updateSummary();
  updateChart();
}

function filterHistory() {
  const dateValue = document.getElementById('filterDate').value;
  renderList(dateValue);
}

function clearFilter() {
  document.getElementById('filterDate').value = '';
  renderList(null);
}

function renderList(filterDate = null) {
  const list = document.getElementById('transactionList');
  
  const displayData = filterDate 
    ? transactions.filter(t => t.date.split('T')[0] === filterDate)
    : transactions;

  if (displayData.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:20px; color:gray;">No transactions found.</div>';
    return;
  }

  list.innerHTML = displayData.map(t => {
    const isCredit = t.type === 'credit';
    const sign = isCredit ? '+' : '-';
    const colorClass = isCredit ? 'green-text' : 'red-text';
    
    const d = new Date(t.date);
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    return `
      <div class="task-item">
        <div class="task-info">
          <strong>${t.reason}</strong>
          <span style="font-size: 0.85rem; opacity: 0.7">${dateStr}, ${timeStr} • ${t.category}</span>
        </div>
        <div class="money-val ${colorClass}">
          ${sign}₹${t.amount}
          <button onclick="deleteTransaction(${t.id})" style="background:none; border:none; color:gray; font-size:1.2rem; cursor:pointer; padding:0; margin-left:15px;">&times;</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateSummary() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthCredit = 0, monthDebit = 0;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
      if (t.type === 'credit') monthCredit += t.amount;
      else monthDebit += t.amount;
    }
  });

  document.getElementById('monthCredit').innerText = `₹${monthCredit}`;
  document.getElementById('monthDebit').innerText = `₹${monthDebit}`;
  
  const mStatus = monthCredit - monthDebit;
  const mElem = document.getElementById('monthStatus');
  mElem.innerText = (mStatus >= 0 ? '+' : '') + `₹${mStatus}`;
  mElem.className = mStatus >= 0 ? 'green-text' : 'red-text';
}

let expenseChart;

function updateChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  
  const categories = {};
  transactions.forEach(t => {
    if (t.type === 'debit') {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });

  if (expenseChart) expenseChart.destroy();

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ['#ff4757', '#2ed573', '#ffa502', '#5352ed', '#ff6b81', '#70a1ff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        title: { display: true, text: 'Expenses by Category' }
      }
    }
  });
}

function downloadCSV() {
  const headers = ['Date', 'Time', 'Type', 'Category', 'Reason', 'Amount'];
  const rows = transactions.map(t => {
    const d = new Date(t.date);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      t.type,
      t.category,
      t.reason,
      t.amount
    ];
  });

  let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "arth.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMoney', isDark);
  document.getElementById('modeLabel').innerText = isDark ? '🌙' : '🌞';
}

const storedDark = localStorage.getItem('darkMoney') === 'true';
if(storedDark) {
  document.body.classList.add('dark');
  document.getElementById('modeToggle').checked = true;
  document.getElementById('modeLabel').innerText = '🌙';
} else {
  document.getElementById('modeLabel').innerText = '🌞';
}

filterHistory();
updateSummary();
updateChart();