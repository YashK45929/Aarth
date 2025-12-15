let runningTasks = [];

function startTask() {
  const name = document.getElementById('taskName').value.trim();
  if (!name) return alert("Enter a task name!");
  if (runningTasks.find(t => t.name === name)) {
    return alert("Task already running!");
  }

  const now = new Date();
  runningTasks.push({
    name,
    date: now.toISOString().split('T')[0],
    startDate: now,
    start: formatAMPM(now)
  });

  document.getElementById('taskName').value = '';
  renderRunningTasks();
}

function endTask(name) {
  const taskIndex = runningTasks.findIndex(t => t.name === name);
  if (taskIndex === -1) return alert("Task not found!");

  const task = runningTasks[taskIndex];
  const endDate = new Date();
  task.end = formatAMPM(endDate);
  task.duration = calculateDuration(task.startDate, endDate);

  runningTasks.splice(taskIndex, 1);

  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  renderRunningTasks();
  displayTasks();
}

function renderRunningTasks() {
  const runningList = document.getElementById('runningList');
  runningList.innerHTML = runningTasks.map(t => `
    <div class="task-item">
      <strong>${t.name}</strong>
      <span class="time">Start: ${t.start}</span>
      <button class="end-btn" onclick="endTask('${t.name}')">End Task</button>
    </div>
  `).join('');
}

function displayTasks() {
  const taskList = document.getElementById('taskList');
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

  const grouped = {};
  tasks.forEach(task => {
    const date = task.date || "Unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(task);
  });

  taskList.innerHTML = Object.keys(grouped).reverse().map(date => {
    const label = formatDateLabel(date);
    const entries = grouped[date].map(t => `
      <div class="task-item">
        <strong>${t.name}</strong>
        <span class="time">Start: ${t.start}</span>
        <span class="time">End: ${t.end}</span>
        <span class="duration">Duration: ${t.duration}</span>
      </div>
    `).join('');
    return `<div><div class="date-header">${label}</div>${entries}</div>`;
  }).join('');
}

function formatAMPM(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  seconds = seconds < 10 ? '0'+seconds : seconds;

  return `${hours}:${minutes}:${seconds} ${ampm}`;
}

function calculateDuration(start, end) {
  const diff = Math.abs(end - start);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

function downloadCSV() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  if (tasks.length === 0) return alert("No tasks to export!");

  const headers = ['Task Name', 'Start Time', 'End Time', 'Duration', 'Date'];
  const rows = tasks.map(t => [t.name, t.start, t.end, t.duration, t.date]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(row => row.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "task_log.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toDateString();
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('dark', isDark);
  updateModeLabel();
}

function updateModeLabel() {
  const label = document.getElementById('modeLabel');
  label.textContent = document.body.classList.contains('dark')
    ? '🌙 Dark Mode'
    : '🌞 Light Mode';
}

(function restoreDarkMode() {
  const isDark = localStorage.getItem('dark') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    document.getElementById('modeToggle').checked = true;
  }
  updateModeLabel();
})();

displayTasks();
renderRunningTasks();
