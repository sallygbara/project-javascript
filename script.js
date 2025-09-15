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
const addBtn = document.getElementById('btnAddTask');



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
let tasks = [];             // { id, text, dueDate:'YYYY-MM-DD', completed:boolean }
let currentFilter = 'all';  // 'all' | 'completed' | 'active'
tasks = getTasks();         // load from localStorage

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
            second.className = 'task-second';
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
    // 1) קבל את הערכים משדות הטופס
    const text = descInput ? descInput.value : '';
    const dueDate = dateInput ? dateInput.value : '';

    // 2) בדוק ששניהם לא ריקים
    if (text === '' || dueDate === '') return;

    // 3) צור אובייקט משימה חדש
    const newTask = {
        id: String(Date.now()), // מזהה פנימי (נדרש למחיקה/complete)
        text: text,
        dueDate: dueDate,
        completed: false
    };

    // 4) הוסף למערך
    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();

}



/* =========================================
 * 6) filterTasks() & sortTasks()
 * ========================================= */
function filterTasks(tasks, filter) {           // ✅ אל תדרסי את שם הפרמטר
    const key = (filter === 'pending') ? 'active' : filter;
    switch (key) {
        case 'all': return tasks;
        case 'completed': return tasks.filter(t => t.completed);
        case 'active': return tasks.filter(t => !t.completed);
        default: return tasks;
    }
}

function sortTasks(tasks) {
    return tasks.slice().sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;   // ללא תאריך – בסוף
        if (!b.dueDate) return -1;

        const da = new Date(a.dueDate);
        const db = new Date(b.dueDate);

        return da - db; // מיון כרונולוגי עולה
    });
}


/* =========================================
 * 7) Event handling
 * ========================================= */

    addBtn.addEventListener('click', addTask);
    btnAll?.addEventListener('click', () => { currentFilter = 'all'; renderTasks(); });
    btnCompleted?.addEventListener('click', () => { currentFilter = 'completed'; renderTasks(); });
    btnPending?.addEventListener('click', () => { currentFilter = 'pending'; renderTasks(); });

    sortBtn?.addEventListener('click', () => {
        tasks = sortTasks(tasks);
        saveTasks(tasks);
        renderTasks();
    });

// Complete/Delete via event delegation using event.target.dataset.id
taskList.addEventListener('click', (e) => {
    const { action, id } = e.target.dataset;
    if (!action || !id) return;

    if (action === 'complete') {
        const i = tasks.findIndex(t => String(t.id) === id);
        if (i === -1) return;
        tasks[i].completed = !tasks[i].completed;
        saveTasks(tasks);
        currentFilter = 'all';          // ← לראות אותה מיד אחרי שינוי הסטטוס
        renderTasks();
        return;
    }

    if (action === 'delete') {
        tasks = tasks.filter(t => String(t.id) !== id);
        saveTasks(tasks);
        renderTasks();
        return;
    }
});




/* =========================================
 * 8) Initial tasks from API – השלמה עד 5
 * ========================================= */
async function fetchInitialTasks() {
    // כמה חסר כדי להגיע ל-5
    const need = Math.max(0, 5 - tasks.length);
    if (need === 0) return;

    const pad = n => String(n).padStart(2, '0');
    const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();

    const addSamples = (n) => {
        const extra = Array.from({ length: n }, (_, i) => ({
            id: `s_${Date.now()}_${i}`,               // מזהה ייחודי כמחרוזת
            text: `Sample ${tasks.length + i + 1}`,
            dueDate: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
            completed: false
        }));
        tasks = tasks.concat(extra);
        saveTasks(tasks);
    };

    try {
        const resp = await fetch(`https://jsonplaceholder.typicode.com/todos?_limit=${need}`);
        const data = await resp.json();

        const extra = data.map((todo, i) => ({
            id: `api_${String(todo.id)}`,             // תמיד כמחרוזת + prefix למניעת התנגשויות
            text: todo.title || `Task #${tasks.length + i + 1}`,
            dueDate: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
            completed: !!todo.completed
        }));

        tasks = tasks.concat(extra);
        saveTasks(tasks);

        // אם ה-API החזיר פחות מהמבוקש (קורה לפעמים), נשלים בדוגמאות
        const stillNeed = Math.max(0, 5 - tasks.length);
        if (stillNeed > 0) addSamples(stillNeed);

    } catch {
        // אין רשת? נמלא דוגמאות
        addSamples(need);
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


