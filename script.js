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
let tasks = [];             
let currentFilter = 'all'; 
tasks = getTasks();         
/* =========================================
 * 4) renderTasks()
 * ========================================= */
function renderTasks() {
    const tasksListElement = document.getElementById('tasksList');
    tasksListElement.innerHTML = "";

    tasks.forEach((task) => {
        if (currentFilter === "all") {
            tasksListElement.appendChild(buildTaskItem(task));
        } else if (currentFilter === "completed") {
            if (task.completed) tasksListElement.appendChild(buildTaskItem(task));
        } else { 
            if (!task.completed) tasksListElement.appendChild(buildTaskItem(task));
        }
    });
}

function buildTaskItem(t) {
    const li = document.createElement('li');
    li.className = 'task-item';

    const left = document.createElement('div');
    left.className = 'task-left';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.innerText = t.text;
    if (t.completed) title.classList.add('done');
    left.appendChild(title);

    if (t.dueDate) {
        const sep = document.createElement('span');
        sep.className = 'task-first';
        sep.innerText = ' | ';

        const due = document.createElement('span');
        due.className = 'task-second';
        due.innerText = `Due: ${t.dueDate}`;

        left.appendChild(sep);
        left.appendChild(due);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.innerText = t.completed ? 'Uncomplete' : 'Complete';
    completeBtn.addEventListener('click', () => {
        t.completed = !t.completed;
        saveTasks(tasks);
        renderTasks();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.innerText = 'Delete';
    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter(x => x !== t);
        saveTasks(tasks);
        renderTasks();
    });

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(left);
    li.appendChild(actions);

    return li;
}




/* =========================================
 * 5) addTask()
 * ========================================= */

function addTask(e) {
    const text = descInput ? descInput.value.trim() : '';
    const dueDate = dateInput ? dateInput.value : '';

    if (text === '' || dueDate === '') return;

    const newTask = {
        text: text,
        dueDate: dueDate,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);

    currentFilter = 'all';  
    renderTasks()}



/* =========================================
 * 6) filterTasks() & sortTasks()
 * ========================================= */   

function filterTasks(tasks, filter) {      
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
        if (!a.dueDate) return 1;   
        if (!b.dueDate) return -1;

        const da = new Date(a.dueDate);
        const db = new Date(b.dueDate);

        return da - db; 
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

taskList.addEventListener('click', (e) => {
    const { action, id } = e.target.dataset;
    if (!action || !id) return;

    if (action === 'complete') {
        const i = tasks.findIndex(t => String(t.id) === id);
        if (i === -1) return;
        tasks[i].completed = !tasks[i].completed;
        saveTasks(tasks);
        currentFilter = 'all';          
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
 * 8) API  
 * ========================================= */
async function fetchInitialTasks() {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5').catch(() => null);
    if (!res?.ok) return;
    const todos = await res.json().catch(() => null);
    if (!Array.isArray(todos)) return;

    const data1 = n => String(n).padStart(2, '0');
    const data2 = d => `${d.getFullYear()}-${data1(d.getMonth() + 1)}-${data1(d.getDate())}`;
    const today = new Date();

    tasks = todos.map((t, i) => ({
        text: t.title || `Task #${i + 1}`,
        dueDate:data2(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
        completed: !!t.completed
    }));

    saveTasks(tasks);
    renderTasks();                         
}

(async function init() {
    await fetchInitialTasks();
})();
