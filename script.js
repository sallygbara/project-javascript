'use strict';

/* =========================================
 * 1) Get elements from the DOM
 * ========================================= */
const form = document.getElementById('taskForm');
const descInput = document.getElementById('taskDescription');
const dateInput = document.getElementById('taskDueDate');
const taskList = document.getElementById('tasksList');

const btnAll = document.getElementById('btnAll');
const btnCompleted = document.getElementById('btnCompleted');
const btnPending = document.getElementById('btnPending');
const sortBtn = document.getElementById('sortBtn');

/* =========================================
 * 2) Data storage (localStorage)
 * ========================================= */
function getTasks() {
    try {
        const firstask = localStorage.getItem('tasks');
        return firstask ? JSON.parse(firstask) : [];
    } catch {
        return [];
    }
}
function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/* =========================================
 * 3) Global tasks array
 * ========================================= */
let tasks = getTasks();      // [{ id, text, dueDate, completed }]
let currentFilter = 'all';   // 'all' | 'completed' | 'active'
tasks = getTasks(); // load from localStorage

/* === מיגרציה: לתת id למשימות ישנות שחסר להן (חד-פעמי) === */
function migrateIdsIfMissing() {
    let changed = false;
    tasks.forEach(t => {
        if (t.id == null) { // undefined/null
            t.id = Date.now() + Math.floor(Math.random() * 1e6);
            changed = true;
        }
    });
    if (changed) saveTasks(tasks);
}

/* =========================================
 * 4) renderTasks()
 * ========================================= */
function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = sortTasks(filterTasks(tasks, currentFilter));

   

    filteredTasks.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        // LEFT: title | due
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-left';

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = t.text;
        if (t.completed) title.classList.add('done');
        taskInfo.appendChild(title);

        if (t.dueDate) {
            const first = document.createElement('span');
            first.className = 'task-first';
            first.textContent = ' | ';

            const second = document.createElement('span');
            second.className = 'task-second'; // ודאי שיש CSS למחלקה הזו
            second.textContent = `Due: ${t.dueDate}`;

            taskInfo.appendChild(first);
            taskInfo.appendChild(second);
        }

        // RIGHT: actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.dataset.action = 'complete';
        completeBtn.dataset.id = String(t.id);
        completeBtn.textContent = t.completed ? 'Uncomplete' : 'Complete';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = String(t.id);
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';

        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(taskInfo);
        li.appendChild(actions);

        taskList.appendChild(li);
    });
}

/* =========================================
 * 5) addTask()
 * ========================================= */
function addTask() {
    const text = descInput.value;
    const dueDate = dateInput.value;

    if (text === '' || dueDate === '') return;

    const newTask = {
        id: Date.now(),      // חובה כדי ש-Delete/Complete יעבדו
        text,
        dueDate,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();

    // אם תרצי לנקות שדות: descInput.value = ''; dateInput.value = '';
}

/* =========================================
 * 6) filterTasks() & sortTasks()
 * ========================================= */
function filterTasks(tasks, filter) {
    const tasksone = (filter === 'pending') ? 'active' : filter;
    switch (tasksone) {
        case 'all': return tasks;
        case 'completed': return tasks.filter(t => t.completed);
        case 'active': return tasks.filter(t => !t.completed);
        default: return ;tasks
    }
}

function sortTasks(arr) {
    return arr.slice().sort((a, b) => {
        const da = a.dueDate || '';
        const db = b.dueDate || '';
        if (!da && !db) return 0;
        if (!da) return 1;   // ללא תאריך – בסוף
        if (!db) return -1;
        return da.localeCompare(db);
    });
}

/* =========================================
 * 7) Event handling
 * ========================================= */
form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

btnAll.addEventListener('click', () => { currentFilter = 'all'; renderTasks(); });
btnCompleted.addEventListener('click', () => { currentFilter = 'completed'; renderTasks(); });
btnPending.addEventListener('click', () => { currentFilter = 'pending'; renderTasks(); });

sortBtn?.addEventListener('click', () => {
    tasks = sortTasks(tasks);
    saveTasks(tasks);
    renderTasks();
});

// Complete/Delete via event delegation on UL
taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    if (!action || Number.isNaN(id)) return; // בדיקה בטוחה

    if (action === 'complete') {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        task.completed = !task.completed;
    } else if (action === 'delete') {
        tasks = tasks.filter(t => t.id !== id);
    }
    saveTasks(tasks);
    renderTasks();
});

/* =========================================
 * 8) Initial tasks from API (5 items) with fallback
 * ========================================= */
async function fetchInitialTasks() {
    if (tasks.length >= 5) return;

    const need = 5 - tasks.length;
    const pad = n => String(n).padStart(2, '0');
    const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const fallback = () => {
        const today = new Date();
        const extra = Array.from({ length: need }, (_, i) => ({
            id: Date.now() + i,
            text: `Sample ${i + 1}`,
            dueDate: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
            completed: false,
        }));
        tasks = tasks.concat(extra);
        saveTasks(tasks);
    };

    try {
        const resp = await fetch(`https://jsonplaceholder.typicode.com/todos?_limit=${need}`);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();

        const today = new Date();
        const extra = data.map((todo, i) => ({
            id: todo.id,
            text: todo.title || `Task #${i + 1}`,
            dueDate: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
            completed: !!todo.completed
        }));
        tasks = tasks.concat(extra);
        saveTasks(tasks);
    } catch {
        fallback();
    }
}

/* =========================================
 * 9) Init on page load
 * ========================================= */
(async function init() {
    tasks = getTasks();        // load from localStorage
    migrateIdsIfMissing();     // ← נותן id למשימות ישנות שחסר להן
    await fetchInitialTasks(); // seed אם צריך (עד 5 סה״כ)
    renderTasks();             // first paint
})();
