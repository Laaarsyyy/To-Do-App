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
const addListBtn = document.getElementById('addListBtn');
const listsMenu = document.querySelector('.lists');
const listButtonsContainer = document.getElementById('listButtons');
let selectedListId = '';

const getListsFromStorage = () => {
    try {
        const raw = localStorage.getItem('lists');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to parse lists from localStorage', e);
        return [];
    }
};

const saveListsToStorage = (lists) => {
    localStorage.setItem('lists', JSON.stringify(lists));
};

const getListNameById = (id) => {
    if (!id) return '';
    const lists = getListsFromStorage();
    const found = lists.find(l => l.id === id);
    return found ? found.name : '';
};

const renderLists = () => {
    const lists = getListsFromStorage();

    // render inline list buttons in modal next to Add List (include a 'None' option to clear selection)
    if (listButtonsContainer) {
        listButtonsContainer.innerHTML = '';
        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.className = 'list-chip none-chip';
        noneBtn.dataset.id = '';
        noneBtn.textContent = 'None';
        if (selectedListId === '') noneBtn.classList.add('active');
        listButtonsContainer.appendChild(noneBtn);

        lists.forEach(list => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-chip';
            btn.dataset.id = list.id;
            btn.textContent = list.name;
            if (list.id === selectedListId) btn.classList.add('active');
            listButtonsContainer.appendChild(btn);
        });
    }

    // render menu lists (clear previous except header) and add a 'None' item
    if (listsMenu) {
        listsMenu.innerHTML = '<p>LISTS</p>';
        const noneLi = document.createElement('li');
        noneLi.dataset.id = '';
        noneLi.textContent = 'None';
        if (selectedListId === '') noneLi.classList.add('activeMenu');
        listsMenu.appendChild(noneLi);

        lists.forEach(list => {
            const li = document.createElement('li');
            li.dataset.id = list.id;
            li.innerHTML = `<i class="fa-regular fa-list"></i> ${list.name}`;
            if (list.id === selectedListId) li.classList.add('activeMenu');
            listsMenu.appendChild(li);
        });
    }
};

listBtn.addEventListener('click', () => {
    addListField.style.display = 'flex';
    newListName.focus();
});

cancelListBtn.addEventListener('click', () => {
    addListField.style.display = 'none';
    newListName.value = '';
});

addListBtn.addEventListener('click', () => {
    const name = newListName.value.trim();
    if (!name) return;
    const lists = getListsFromStorage();
    const newList = { id: Date.now().toString(), name };
    lists.push(newList);
    saveListsToStorage(lists);
    // select the newly created list
    selectedListId = newList.id;
    renderLists();
    addListField.style.display = 'none';
    newListName.value = '';
    renderTasks();
});

// select a list by clicking a button inside the modal
if (listButtonsContainer) {
    listButtonsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button.list-chip');
        if (!btn) return;
        selectedListId = btn.dataset.id;
        renderLists();
        renderTasks();
    });
}

// clicking in the sidebar lists selects a list, opens the add list field, or deletes a list
if (listsMenu) {
    listsMenu.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        // delete icon clicked
        if (e.target.matches('.delete-list')) {
            const listId = li.dataset.id;
            if (!listId) return;
            const lists = getListsFromStorage();
            const listObj = lists.find(l => l.id === listId);
            if (!listObj) return;
            const confirmed = window.confirm(`Delete list "${listObj.name}"? Tasks will be moved to None.`);
            if (!confirmed) return;

            // capture state for undo
            const tasks = getTasksFromStorage();
            const changedTasks = tasks.filter(t => t.listId === listId).map(t => ({ id: t.id, previousListId: t.listId }));

            // reassign tasks to None
            tasks.forEach(t => { if (t.listId === listId) t.listId = ''; });
            saveTasksToStorage(tasks);

            // remove the list
            const newLists = lists.filter(l => l.id !== listId);
            saveListsToStorage(newLists);

            // clear selection if it was selected
            if (selectedListId === listId) selectedListId = '';

            renderLists();
            renderTasks();

            // show undo toast
            showUndoToast(`Deleted list "${listObj.name}"`, () => {
                // undo: restore list and restore tasks' listId
                const currentLists = getListsFromStorage();
                currentLists.push(listObj);
                saveListsToStorage(currentLists);

                const curTasks = getTasksFromStorage();
                changedTasks.forEach(orig => {
                    const task = curTasks.find(t => t.id === orig.id);
                    if (task) task.listId = orig.previousListId;
                });
                saveTasksToStorage(curTasks);
                renderLists();
                renderTasks();
            });

            return;
        }

        selectedListId = li.dataset.id || '';
        renderLists();
        renderTasks();
    });
}


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
    // If a list is selected, show only tasks for that list; otherwise show all
    const toRender = selectedListId ? tasks.filter(t => t.listId === selectedListId) : tasks;
    toRender.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.setAttribute('id', 'task');
        taskItem.dataset.id = task.id;
        taskItem.classList.toggle('completed', task.completed);
        const listLabel = task.listId ? ` <span class="task-list">(${getListNameById(task.listId)})</span>` : '';
        taskItem.innerHTML = `
            <p><i class="fa-solid fa-trash-can delete-task" title="Delete"></i> ${task.name}${listLabel}</p><i class="fa-solid fa-angle-right chevronRight"></i>
        `;
        tasksList.appendChild(taskItem);
    });
    updateTaskCounter();
};

// Add task
saveTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const taskName = taskNameInput.value.trim();
    if (taskName === '') return;
    const tasks = getTasksFromStorage();
    const newTask = { id: Date.now().toString(), name: taskName, completed: false, listId: selectedListId || '' };
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

// helper: undo toast
const showUndoToast = (message, undoCallback, timeout = 6000) => {
    let toast = document.getElementById('undoToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'undoToast';
        toast.className = 'undoToast';
        document.body.appendChild(toast);
    }
    // set content
    toast.innerHTML = `<span class="undoMessage">${message}</span> <button type="button" class="undoBtn">Undo</button>`;
    toast.style.opacity = 1;

    const btn = toast.querySelector('.undoBtn');
    const cleanup = () => {
        toast.style.opacity = 0;
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    };
    const timer = setTimeout(() => { cleanup(); }, timeout);

    btn.addEventListener('click', () => {
        clearTimeout(timer);
        undoCallback();
        cleanup();
    }, { once: true });
};

// Render on load
document.addEventListener('DOMContentLoaded', () => {
    renderLists();
    renderTasks();
});
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
