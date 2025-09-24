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

        const left = document.createElement('div');
        left.className = 'task-left';

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = t.text;
        if (t.completed) title.classList.add('done');
        left.appendChild(title);

        if (t.dueDate) {
            const first = document.createElement('span');
           first .className = 'task-first';
            first.textContent = ' | ';

            const second = document.createElement('span');
            second.className = 'task-second';
            second.textContent = `Due: ${t.dueDate}`;

            left.appendChild(first);
            left.appendChild(second);
        }

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.textContent = t.completed ? 'Uncomplete' : 'Complete';
        completeBtn.addEventListener('click', () => {
            t.completed = !t.completed;
            saveTasks(tasks);
            renderTasks();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            tasks = tasks.filter(x => x !== t); 
            saveTasks(tasks);
            renderTasks();
        });

        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(left);
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
 * 8) API  
 * ========================================= */
async function fetchInitialTasks() {
    if (tasks.length > 0) return;

    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
        .catch(() => null);
    if (!response || !response.ok) return;

    const todos = await response.json().catch(() => null);
    if (!Array.isArray(todos)) return;

    const date = (num) => String(num).padStart(2, '0');
    const formatISODate = (dateObj) =>
        `${dateObj.getFullYear()}-${date(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;

    const todayDate = new Date();

    const seedTasks = todos.map((todoItem, idx) => ({
        text: todoItem.title || `Task #${idx + 1}`,
        dueDate: formatISODate(new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            todayDate.getDate() + idx
        )),
        completed: !!todoItem.completed
    }));

    for (const taskItem of seedTasks) {
        tasks.push(taskItem);
    }

    saveTasks(tasks);
    renderTasks();
}

(async function init() {
    tasks = getTasks();
    await fetchInitialTasks();
    renderTasks();
})();


