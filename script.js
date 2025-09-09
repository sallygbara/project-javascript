'use strict';

/* =========================================
 * 1) Get elements from the DOM
 * ========================================= */
const form = document.querySelector('.text form');
const descInput = document.getElementById('taskDescription');
const dateInput = document.getElementById('taskDueDate');
const taskList = document.querySelector('.text1 ul');   // use the single UL inside .text1

// Filter buttons in your HTML order: All / Completed / Pending
const [btnAll, btnCompleted, btnPending] = document.querySelectorAll('.button > button');

// Sort-by-date button (the one inside .text1, above the UL)
const sortBtn = document.querySelector('.text1 > button');


/* =========================================
 * 2) Data storage (localStorage)
 * ========================================= */
function getTasks() {
    try {
        const raw = localStorage.getItem('tasks');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
function saveTasks(arr) {
    localStorage.setItem('tasks', JSON.stringify(arr));
}


/* =========================================
 * 3) Global tasks array
 * ========================================= */
let tasks = [];             // { id, text, dueDate:'YYYY-MM-DD', completed:boolean }
let currentFilter = 'all';  // 'all' | 'completed' | 'active'   (we map "pending"→"active")


/* =========================================
 * 4) renderTasks():
 *    - Clear list
 *    - Create <li> per task: text + due + Complete/Delete
 *    - Add CSS for completed (line-through)
 * ========================================= */
function renderTasks() {
    taskList.innerHTML = '';
    const visible = sortTasks(filterTasks(tasks, currentFilter));

    if (visible.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No tasks to display.';
        li.style.opacity = '0.7';
        taskList.appendChild(li);
        return;
    }

    visible.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        // LEFT: title | due
        const left = document.createElement('div');
        left.className = 'task-left';

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = t.text;
        if (t.completed) title.classList.add('done');

        const sep = document.createElement('span');
        sep.className = 'task-sep';
        sep.textContent = ' | ';

        const due = document.createElement('small');
        due.className = 'task-due';
        due.textContent = t.dueDate ? `Due: ${t.dueDate}` : '';

        // אם אין תאריך, אל תציג את הקו המפריד
        left.append(title);
        if (t.dueDate) left.append(sep, due);

        // RIGHT: actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.className = 'pill btn-complete';
        completeBtn.dataset.action = 'complete';
        completeBtn.dataset.id = String(t.id);
        completeBtn.textContent = t.completed ? 'Uncomplete' : 'Complete';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'pill danger btn-delete';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = String(t.id);
        deleteBtn.textContent = 'Delete';

        actions.append(completeBtn, deleteBtn);
        li.append(left, actions);
        taskList.appendChild(li);
    });
}




/* =========================================
 * 5) addTask():
 *    - Read fields, validate (not empty)
 *    - Build new task object
 *    - Push → save → render → reset
 * ========================================= */
function addTask() {
    const text = descInput.value.trim();
    const dueDate = (dateInput.value || '').trim(); // YYYY-MM-DD

    if (!text || !dueDate) {
        alert('Please fill in task description and due date.');
        return;
    }

    const newTask = {
        id: Date.now(),
        text,
        dueDate,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();
    form.reset();
    descInput.focus();
}


/* =========================================
 * 6) filterTasks() & sortTasks()
 *    - filter: 'all' | 'completed' | 'active'
 *    - sort by due date ascending; empty dates last
 * ========================================= */
function filterTasks(arr, filterKey) {
    const key = (filterKey === 'pending') ? 'active' : filterKey; // support “Pending” label

    switch (key) {
        case 'all': return arr;
        case 'completed': return arr.filter(t => t.completed);
        case 'active': return arr.filter(t => !t.completed);
        default: return arr;
    }
}

function sortTasks(arr) {
    return arr.slice().sort((a, b) => {
        const da = a.dueDate || '';
        const db = b.dueDate || '';
        if (!da && !db) return 0;
        if (!da) return 1;   // task with no date goes last
        if (!db) return -1;
        return da.localeCompare(db);
    });
}


/* =========================================
 * 7) Event handling
 *    - Add task (form submit)
 *    - Filters: All / Completed / Pending
 *    - Sort by date
 *    - Complete/Delete via event delegation on UL
 * ========================================= */
form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

btnAll.addEventListener('click', () => {
    currentFilter = 'all';
    renderTasks();
});
btnCompleted.addEventListener('click', () => {
    currentFilter = 'completed';
    renderTasks();
});
btnPending.addEventListener('click', () => {
    currentFilter = 'pending'; // mapped to 'active' by filterTasks()
    renderTasks();
});

sortBtn?.addEventListener('click', () => {
    tasks = sortTasks(tasks);
    saveTasks(tasks);
    renderTasks();
});

// Single listener that handles both Complete & Delete for any task row
taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id || NaN);
    if (!action || !id) return;

    if (action === 'complete') {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        task.completed = !task.completed;
        saveTasks(tasks);
        renderTasks();
    } else if (action === 'delete') {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        renderTasks();
    }
});


/* =========================================
 * 8) Initial tasks from API (5 items) with fallback
 * ========================================= */
async function fetchInitialTasks() {
    // אם יש כבר 5 או יותר, אל תעשה כלום
    if (tasks.length >= 5) return;

    const need = 5 - tasks.length; // כמה חסר כדי להגיע ל-5

    const fallback = () => {
        const today = new Date();
        const pad = n => String(n).padStart(2, '0');
        const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        // צור עוד 'need' משימות דמו והוסף למערך הקיים
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
        // שלוף רק את הכמות שחסרה
        const resp = await fetch(`https://jsonplaceholder.typicode.com/todos?_limit=${need}`);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();

        const today = new Date();
        const pad = n => String(n).padStart(2, '0');
        const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
    await fetchInitialTasks(); // seed if empty
    renderTasks();             // first paint
})();




