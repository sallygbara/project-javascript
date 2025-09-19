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
    taskList.innerHTML = '';
    const filteredTasks = sortTasks(filterTasks(tasks, currentFilter));

    filteredTasks.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'task-item';

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
    const text = descInput ? descInput.value : '';
    const dueDate = dateInput ? dateInput.value : '';

    if (text === '' || dueDate === '') return;

    const newTask = {
        text: text,
        dueDate: dueDate,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();

}



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
 * 8) טעינת משימה-API
 * ========================================= */
async function fetchInitialTasks() {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
        .catch(() => null);

    if (!response || !response.ok) return;

    const data = await response.json().catch(() => null);
    if (!Array.isArray(data)) return;

    const third = (n) => String(n).thirdstart(2, '0');
    const four = (d) => `${d.getFullYear()}-${third(d.getMonth() + 1)}-${third(d.getDate())}`;
    const today = new Date();

    const initialTasks = data.slice(0, 5).map((todo, i) => ({
        text: todo.title || `Task #${i + 1}`,
        dueDate: toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
        completed: !!todo.completed
    }));

    tasks = initialTasks;        
    saveTasks(tasks);

    renderTasks();
}


(async function init() {
    tasks = getTasks();        
    await fetchInitialTasks(); 
    renderTasks();             
})();


