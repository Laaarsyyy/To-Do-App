/*
========================================
        Toggle Dark Mode
========================================
*/

const toggleDarkMode = document.getElementById('darkModeToggle');

toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('darkMode', toggleDarkMode.checked);
});

/*
========================================
        color Picker 
========================================
*/

const colorPicker = document.getElementById('color');

colorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--primary-color', colorPicker.value);
});

/*
========================================
        addList and Cancel List
========================================
*/
const listBtn = document.getElementById('addList');
const addListField = document.querySelector('.addListField');
const cancelListBtn = document.getElementById('cancelListBtn');
const newListName = document.getElementById('newListName');

listBtn.addEventListener('click', () => {
    addListField.style.display = 'flex';
    newListName.focus();
});

cancelListBtn.addEventListener('click', () => {
    addListField.style.display = 'none';
    listSelect.value = '';
});

/*
========================================
            Adding Task (with localStorage)
========================================
*/
const taskNameInput = document.getElementById('taskName');
const saveTaskBtn = document.querySelector('.saveTaskBtn');
const tasksList = document.querySelector('.tasks');

const getTasksFromStorage = () => {
    try {
        const raw = localStorage.getItem('tasks');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
        return [];
    }
};

const saveTasksToStorage = (tasks) => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

const renderTasks = () => {
    const tasks = getTasksFromStorage();
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        taskItem.dataset.id = task.id;
        taskItem.classList.toggle('completed', task.completed);
        taskItem.innerHTML = `
            <p><i class="fa-solid fa-trash-can delete-task" title="Delete"></i> ${task.name}</p>
        `;
        tasksList.appendChild(taskItem);
    });
};

// Add task
saveTaskBtn.addEventListener('click', () => {
    const taskName = taskNameInput.value.trim();
    if (taskName === '') return;
    const tasks = getTasksFromStorage();
    const newTask = { id: Date.now().toString(), name: taskName, completed: false };
    tasks.push(newTask);
    saveTasksToStorage(tasks);
    renderTasks();
    toggleModal();
    taskNameInput.value = '';
});

// double-click to toggle completed
tasksList.addEventListener('dblclick', (e) => {
    if (e.target.matches('.delete-task')) return; // ignore dblclicks on delete icon
    const item = e.target.closest('li');
    if (!item) return;
    const id = item.dataset.id;
    const tasks = getTasksFromStorage();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage(tasks);
        renderTasks();
    }
});

tasksList.addEventListener('click', (e) => {
    if (e.target.matches('.delete-task')) {
        const item = e.target.closest('li');
        const id = item.dataset.id;
        let tasks = getTasksFromStorage();
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage(tasks);
        renderTasks();
    }
});

// Render on load
document.addEventListener('DOMContentLoaded', renderTasks);
/*
========================================
        Opening and closing modal
========================================
*/

const addTaskCloseModal = document.getElementById('addTaskcloseModal');
const addTaskModal = document.querySelector('.addTaskModal');
const addTaskButton = document.querySelector('.addTaskButton');
const cancelTaskBtn = document.querySelector('.cancelTaskBtn');

const toggleModal = () => {
    addTaskModal.classList.toggle('open');
};

addTaskCloseModal.addEventListener('click', toggleModal);
addTaskButton.addEventListener('click', toggleModal);
cancelTaskBtn.addEventListener('click', toggleModal);
