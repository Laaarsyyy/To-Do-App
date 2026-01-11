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

const updateTaskCounter = () => {
    const menuTodayTaskCounter = document.querySelector('.menuTodayTaskCounter');
    const todayTaskCount = document.querySelector('.todayTaskCount');
    const count = tasksList ? tasksList.children.length : 0;
    if (todayTaskCount) todayTaskCount.textContent = count;
    if (menuTodayTaskCounter) menuTodayTaskCounter.textContent = count;
};

const renderTasks = () => {
    const tasks = getTasksFromStorage();
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.setAttribute('id', 'task');
        taskItem.dataset.id = task.id;
        taskItem.classList.toggle('completed', task.completed);
        taskItem.innerHTML = `
            <p><i class="fa-solid fa-trash-can delete-task" title="Delete"></i> ${task.name}</p><i class="fa-solid fa-angle-right chevronRight"></i>
        `;
        tasksList.appendChild(taskItem);
    });
    updateTaskCounter();
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
    if (e.target.matches('.delete-task')) return;
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
        if (!item) return;
        const id = item.dataset.id;

        // Add deleting class to trigger CSS transition
        item.classList.add('deleting');
        item.style.pointerEvents = 'none';

        const removeTaskFromDOM = () => {
            // remove from storage
            let tasks = getTasksFromStorage();
            tasks = tasks.filter(t => t.id !== id);
            saveTasksToStorage(tasks);
            // remove the element and update counters
            if (item.parentNode) item.parentNode.removeChild(item);
            updateTaskCounter();
        };

        const onTransitionEnd = (ev) => {
            if (ev.target !== item) return;
            item.removeEventListener('transitionend', onTransitionEnd);
            removeTaskFromDOM();
        };
        item.addEventListener('transitionend', onTransitionEnd);

        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
            if (document.body.contains(item)) {
                item.removeEventListener('transitionend', onTransitionEnd);
                removeTaskFromDOM();
            }
        }, 600);
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
