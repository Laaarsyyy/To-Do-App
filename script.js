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
const newListColor = document.getElementById('newListColor');
const addListBtn = document.getElementById('addListBtn');
const listsMenu = document.querySelector('.lists');
const listButtonsContainer = document.getElementById('listButtons');
// special values: '__today__' -> Today view, '' -> None (tasks with no list), otherwise list id
let selectedListId = '__today__'; 

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
            btn.innerHTML = `<span class="list-chip-color" style="background:${list.color || colorPicker.value}"></span><span>${list.name}</span>`;
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
            const color = list.color || colorPicker.value || getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            li.innerHTML = `<input type="color" class="list-color-picker" value="${color}" title="Change color"><span class="list-name">${list.name}</span><i class="fa-solid fa-trash delete-list" title="Delete"></i>`;
            if (list.id === selectedListId) li.classList.add('activeMenu');
            listsMenu.appendChild(li);
        });

        // ensure taskMenu 'Today' active state is cleared when a list is selected
        const taskTodayLi = document.querySelector('.taskMenu li');
        if (taskTodayLi) taskTodayLi.classList.remove('activeMenu');
    }
};

listBtn.addEventListener('click', () => {
    addListField.style.display = 'flex';
    if (newListColor) newListColor.value = colorPicker.value;
    newListName.focus();
});

cancelListBtn.addEventListener('click', () => {
    addListField.style.display = 'none';
    newListName.value = '';
    if (newListColor) newListColor.value = colorPicker.value;
});

addListBtn.addEventListener('click', () => {
    const name = newListName.value.trim();
    if (!name) return;
    const lists = getListsFromStorage();
    const color = (newListColor && newListColor.value) ? newListColor.value : colorPicker.value;
    const newList = { id: Date.now().toString(), name, color };
    lists.push(newList);
    saveListsToStorage(lists);
    // select the newly created list
    selectedListId = newList.id;
    renderLists();
    addListField.style.display = 'none';
    newListName.value = '';
    if (newListColor) newListColor.value = colorPicker.value;
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

        // ignore clicks on the inline color picker (handled by 'input' event)
        if (e.target.matches('input.list-color-picker')) return;

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
                renderUpcoming();
                maybeRefreshCalendar();
            });

            return;
        }

        selectedListId = li.dataset.id || '';
        hideCalendarView();
        renderLists();
        renderTasks();
    });

    // task menu clicks (Today / Calendar)
    const taskMenu = document.querySelector('.taskMenu');
    if (taskMenu) {
        taskMenu.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            // remove active from lists and task menu then set active on this item
            document.querySelectorAll('.taskMenu li, .lists li').forEach(el => el.classList.remove('activeMenu'));
            li.classList.add('activeMenu');

            const text = li.textContent.trim().toLowerCase();
            console.log('taskMenu click:', text);
            if (text.startsWith('today')) {
                selectedListId = '__today__';
                hideCalendarView();
            } else if (text.startsWith('calendar')) {
                selectedListId = '__calendar__';
                // open the month-grid calendar modal
                openCalendarModal();
            } else {
                // fallback to show all tasks for other task menu items
                selectedListId = '__all__';
                hideCalendarView();
            }
            renderLists();
            renderTasks();
        });
    }

    // handle inline color changes for lists (save without re-rendering so native picker stays open)
    listsMenu.addEventListener('input', (e) => {
        if (!e.target.matches('input.list-color-picker')) return;
        const li = e.target.closest('li');
        if (!li) return;
        const listId = li.dataset.id;
        if (!listId) return;
        const lists = getListsFromStorage();
        const listObj = lists.find(l => l.id === listId);
        if (!listObj) return;
        listObj.color = e.target.value;
        saveListsToStorage(lists);
        // No renderLists() or renderTasks() here to avoid replacing the input while the native color picker is open.
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

    const todayISO = new Date().toISOString().slice(0,10); // YYYY-MM-DD

    let toRender = [];
    if (selectedListId === '__today__') {
        toRender = tasks.filter(t => t.dueDate && t.dueDate === todayISO);
    } else if (selectedListId === '') {
        // None: show tasks without a list
        toRender = tasks.filter(t => !t.listId);
    } else if (selectedListId === '__all__' || !selectedListId) {
        toRender = tasks;
    } else {
        toRender = tasks.filter(t => t.listId === selectedListId);
    }

    toRender.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.setAttribute('id', 'task');
        taskItem.dataset.id = task.id;
        taskItem.classList.toggle('completed', task.completed);
        const listLabel = task.listId ? ` <span class="task-list">(${getListNameById(task.listId)})</span>` : '';
        const dueLabel = task.dueDate ? ` <span class="task-list">[${task.dueDate}${task.dueTime ? ' @'+task.dueTime : ''}]</span>` : '';
        taskItem.innerHTML = `
            <p><i class="fa-solid fa-trash-can delete-task" title="Delete"></i> ${task.name}${listLabel}${dueLabel}</p><i class="fa-solid fa-angle-right chevronRight"></i>
        `;
        tasksList.appendChild(taskItem);
    });
    updateTaskCounter();
    // refresh upcoming panel
    renderUpcoming();
};

// Add task
saveTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const taskName = taskNameInput.value.trim();
    if (taskName === '') return;
    const tasks = getTasksFromStorage();
    let dueDate = null;
    let dueTime = null;
    const todayISO = new Date().toISOString().slice(0,10);
    if (addTaskMode === 'today') {
        // use today's date and time input
        dueDate = todayISO;
        if (deadlineTimeInput && deadlineTimeInput.value) dueTime = deadlineTimeInput.value;
    } else {
        // date-mode (calendar)
        if (deadlineDateInput && deadlineDateInput.value) dueDate = deadlineDateInput.value;
    }
    const newTask = { id: Date.now().toString(), name: taskName, completed: false, listId: (selectedListId && !['__today__','__all__','__calendar__'].includes(selectedListId)) ? selectedListId : '', dueDate, dueTime };
    tasks.push(newTask);
    saveTasksToStorage(tasks);
    renderTasks();
    renderUpcoming();
    maybeRefreshCalendar();
    if (calendarView && calendarView.style.display === 'block') renderCalendarTasks(selectedCalendarDate);
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
        renderUpcoming();
        maybeRefreshCalendar();
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
            // re-render to keep lists in sync
            renderTasks();
            renderUpcoming();
            maybeRefreshCalendar();
            if (calendarView && calendarView.style.display === 'block') renderCalendarTasks(selectedCalendarDate);
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
    renderUpcoming();
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
const deadlineDateInput = document.getElementById('deadline');
const deadlineTimeInput = document.getElementById('deadlineTime');
const calendarView = document.getElementById('calendarView');
const calendarDateInput = document.getElementById('calendarDate');
const calendarTaskList = document.getElementById('calendarTaskList');
const addTaskForDateBtn = document.getElementById('addTaskForDateBtn');
const upcomingList = document.getElementById('upcomingList');

let addTaskMode = 'today'; // 'today' or 'date'
let selectedCalendarDate = new Date().toISOString().slice(0,10);

const toggleModal = () => {
    addTaskModal.classList.toggle('open');
};

addTaskCloseModal.addEventListener('click', toggleModal);

// main Add Task button opens modal in 'today' mode (time input)
addTaskButton.addEventListener('click', () => {
    addTaskMode = 'today';
    // show time input, hide date input
    if (deadlineTimeInput) deadlineTimeInput.style.display = 'inline-block';
    if (deadlineDateInput) deadlineDateInput.style.display = 'none';
    // set defaults
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    if (deadlineTimeInput) deadlineTimeInput.value = `${hh}:${mm}`;
    if (deadlineDateInput) deadlineDateInput.value = new Date().toISOString().slice(0,10);
    toggleModal();
});

cancelTaskBtn.addEventListener('click', () => {
    toggleModal();
});

// Calendar interactions
const showCalendarView = (dateISO) => {
    // set state
    selectedCalendarDate = dateISO || new Date().toISOString().slice(0,10);
    console.log('showCalendarView:', selectedCalendarDate, {calendarView: !!calendarView, calendarDateInput: !!calendarDateInput});
    if (calendarDateInput) {
        calendarDateInput.value = selectedCalendarDate;
        try { calendarDateInput.focus(); } catch(e) {}
    }
    // show calendar, hide tasks list
    if (calendarView) {
        calendarView.style.display = 'block';
        calendarView.style.border = '2px solid var(--primary-color)';
        try { calendarView.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
    }
    if (tasksList) tasksList.style.display = 'none';
    renderCalendarTasks(selectedCalendarDate);
};

const hideCalendarView = () => {
    if (calendarView) calendarView.style.display = 'none';
    if (tasksList) tasksList.style.display = '';
};

calendarDateInput.addEventListener('change', (e) => {
    selectedCalendarDate = e.target.value;
    renderCalendarTasks(selectedCalendarDate);
});

addTaskForDateBtn.addEventListener('click', () => {
    addTaskMode = 'date';
    // show date input and set to selected calendar date
    if (deadlineDateInput) {
        deadlineDateInput.style.display = 'inline-block';
        deadlineDateInput.value = selectedCalendarDate;
    }
    if (deadlineTimeInput) deadlineTimeInput.style.display = 'none';
    toggleModal();
});

// render tasks for a given date in the small calendar view
const renderCalendarTasks = (dateISO) => {
    const tasks = getTasksFromStorage();
    const list = tasks.filter(t => t.dueDate === dateISO);
    calendarTaskList.innerHTML = '';
    list.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `${t.name} ${t.dueTime ? '('+t.dueTime+')' : ''}`;
        calendarTaskList.appendChild(li);
    });
};

// ---- Month-grid calendar modal implementation ----
const calendarModal = document.getElementById('calendarModal');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('monthLabel');
const openCalendarModalBtn = document.getElementById('openCalendarModalBtn');
const selectedDayTasks = document.getElementById('selectedDayTasks');
const addTaskForDayBtn = document.getElementById('addTaskForDayBtn');

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-11
let selectedDayISO = null;

const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatISODate(y,m,d) {
    const mm = String(m+1).padStart(2,'0');
    const dd = String(d).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
}

function openCalendarModal(dateISO) {
    const d = dateISO ? new Date(dateISO) : new Date();
    calendarYear = d.getFullYear();
    calendarMonth = d.getMonth();
    selectedDayISO = dateISO || null;
    // hide the small calendar view if visible
    hideCalendarView();
    if (calendarModal) calendarModal.style.display = 'flex';
    renderMonth(calendarYear, calendarMonth);
}

function closeCalendarModalFn() {
    if (calendarModal) calendarModal.style.display = 'none';
}

function renderMonth(year, month) {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    monthLabel.textContent = `${new Date(year, month, 1).toLocaleString(undefined, { month: 'long' })} ${year}`;
    // weekday headers (render into separate weekdays grid)
    const wk = document.getElementById('calendarWeekdays');
    if (wk) {
        wk.innerHTML = '';
        weekdayNames.forEach(w => {
            const el = document.createElement('div'); el.className = 'weekday'; el.textContent = w; wk.appendChild(el);
        });
    }
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    // blanks
    for (let i=0;i<firstDay;i++) {
        const empty = document.createElement('div'); empty.className = 'day empty'; calendarGrid.appendChild(empty);
    }
    const tasks = getTasksFromStorage();
    for (let d=1; d<=daysInMonth; d++) {
        const dateISO = formatISODate(year, month, d);
        const dayTasks = tasks.filter(t => t.dueDate === dateISO);
        const count = dayTasks.length;
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.dataset.date = dateISO;
        // container for date number and inline tasks
        cell.innerHTML = `<div class="date-num">${d}</div><div class="day-tasks"></div>`;
        // badge showing total count
        if (count > 0) {
            const badge = document.createElement('div'); badge.className = 'tasks-count'; badge.textContent = count; cell.appendChild(badge);
            // populate first 2 tasks names inside the cell
            const tasksContainer = cell.querySelector('.day-tasks');
            dayTasks.slice(0,2).forEach(t => {
                const ti = document.createElement('div'); ti.className = 'task-item'; ti.textContent = (t.dueTime ? ('['+t.dueTime+'] ') : '') + t.name; tasksContainer.appendChild(ti);
            });
            if (count > 2) {
                const more = document.createElement('div'); more.className = 'task-more'; more.textContent = `+${count - 2}`; tasksContainer.appendChild(more);
            }
        }
        if (dateISO === new Date().toISOString().slice(0,10)) cell.classList.add('today');
        if (selectedDayISO === dateISO) cell.classList.add('selected-day');
        cell.addEventListener('click', () => selectDay(dateISO));
        // double-click a day to open inline add inside that day
        cell.addEventListener('dblclick', () => openInlineAddInDay(dateISO));
        calendarGrid.appendChild(cell);
    }
    // fill trailing blanks to maintain grid symmetry
    const totalCells = calendarGrid.querySelectorAll('.day, .empty').length;
    const remainder = (7 - (totalCells % 7)) % 7;
    for (let i=0;i<remainder;i++) { const e = document.createElement('div'); e.className='day empty'; calendarGrid.appendChild(e); }
    // update selected day tasks pane
    if (selectedDayISO) selectDay(selectedDayISO); else selectedDayTasks.innerHTML = '<p>Select a day to see tasks</p>';
}

function selectDay(dateISO) {
    selectedDayISO = dateISO;
    // clear previous selection
    calendarGrid.querySelectorAll('.day').forEach(c => c.classList.toggle('selected-day', c.dataset.date === dateISO));
    // show tasks
    const tasks = getTasksFromStorage().filter(t => t.dueDate === dateISO);
    selectedDayTasks.innerHTML = '';
    if (tasks.length === 0) selectedDayTasks.innerHTML = '<p>No tasks for this date</p>';
    tasks.forEach(t => {
        const div = document.createElement('div');
        div.className = 'upcoming-item';
        div.textContent = `${t.dueTime ? ('['+t.dueTime+'] ') : ''}${t.name}`;
        selectedDayTasks.appendChild(div);
    });
}

// navigation
if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => { calendarMonth--; if (calendarMonth<0) { calendarMonth=11; calendarYear--; } renderMonth(calendarYear, calendarMonth); });
if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => { calendarMonth++; if (calendarMonth>11) { calendarMonth=0; calendarYear++; } renderMonth(calendarYear, calendarMonth); });
if (openCalendarModalBtn) openCalendarModalBtn.addEventListener('click', () => openCalendarModal());
if (closeCalendarModal) closeCalendarModal.addEventListener('click', closeCalendarModalFn);
// backdrop click
if (calendarModal) {
    const backdrop = calendarModal.querySelector('.calendar-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeCalendarModalFn);
}

if (addTaskForDayBtn) addTaskForDayBtn.addEventListener('click', () => {
    // fallback to calendar date input if no explicit selected day
    const day = selectedDayISO || (calendarDateInput && calendarDateInput.value) || null;
    if (!day) return alert('Select a day first');
    openInlineAddInDay(day);
});

// helper: open Add Task modal for a given ISO date (kept for compatibility)
function openAddModalForDate(dateISO) {
    if (!dateISO) return;
    addTaskMode = 'date';
    // close calendar modal if open
    closeCalendarModalFn();
    // show date and time inputs in the add modal
    if (deadlineDateInput) { deadlineDateInput.style.display = 'inline-block'; deadlineDateInput.value = dateISO; }
    if (deadlineTimeInput) { deadlineTimeInput.style.display = 'inline-block'; deadlineTimeInput.value = '12:00'; }
    // default to 'None' list for calendar-created tasks
    selectedListId = '';
    // open add modal
    toggleModal();
}

// Inline add inside a calendar day cell
function openInlineAddInDay(dateISO) {
    if (!dateISO) return;
    // ensure the month for this date is rendered
    const d = new Date(dateISO);
    if (d.getFullYear() !== calendarYear || d.getMonth() !== calendarMonth) {
        // jump to month
        calendarYear = d.getFullYear();
        calendarMonth = d.getMonth();
        renderMonth(calendarYear, calendarMonth);
    }
    const cell = calendarGrid.querySelector(`.day[data-date="${dateISO}"]`);
    if (!cell) return;
    // prevent multiple inline add forms
    if (cell.querySelector('.inline-add')) return;
    // create form
    const form = document.createElement('div'); form.className = 'inline-add';
    form.innerHTML = `<input type="text" class="inline-task-name" placeholder="New task..." aria-label="Task name"><input type="time" class="inline-task-time" value="12:00"><button class="inline-save">Save</button><button class="inline-cancel">Cancel</button>`;
    cell.appendChild(form);
    const nameInput = form.querySelector('.inline-task-name');
    const timeInput = form.querySelector('.inline-task-time');
    const saveBtn = form.querySelector('.inline-save');
    const cancelBtn = form.querySelector('.inline-cancel');
    nameInput.focus();

    const cleanup = () => { if (form.parentNode) form.parentNode.removeChild(form); };
    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return nameInput.focus();
        const tasks = getTasksFromStorage();
        const dueDate = dateISO;
        const dueTime = timeInput.value || null;
        const newTask = { id: Date.now().toString(), name, completed: false, listId: '', dueDate, dueTime };
        tasks.push(newTask);
        saveTasksToStorage(tasks);
        cleanup();
        renderMonth(calendarYear, calendarMonth);
        renderUpcoming();
        renderTasks();
        maybeRefreshCalendar();
    });
    cancelBtn.addEventListener('click', () => cleanup());
    // keyboard: Enter to save, Esc to cancel
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
    });
}

// when the add task modal saves, if calendar modal is open, refresh the month view and selected day
const originalSaveHandler = saveTaskBtn && saveTaskBtn.onclick;
// we can't safely wrap onclick; instead ensure renderCalendar after save in the save flow (already done via renderUpcoming)

// ensure calendar updates when tasks change
const maybeRefreshCalendar = () => { if (calendarModal && calendarModal.style.display === 'flex') renderMonth(calendarYear, calendarMonth); };

// call maybeRefreshCalendar where appropriate (after add/delete/undo etc.)


// upcoming rendering
function renderUpcoming() {
    const tasks = getTasksFromStorage();
    const today = new Date().toISOString().slice(0,10);
    // only show tasks strictly after today (tomorrow onwards)
    const upcoming = tasks.filter(t => t.dueDate && t.dueDate > today).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
    const stickyContainer = document.getElementById('stickyContainer');
    if (!stickyContainer) return;
    stickyContainer.innerHTML = '';

    if (upcoming.length === 0) {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        const p = document.createElement('p');
        p.textContent = 'No upcoming tasks';
        note.appendChild(p);
        stickyContainer.appendChild(note);
        return;
    }

    // show up to 6 upcoming tasks as sticky notes
    upcoming.slice(0,6).forEach(t => {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        const p = document.createElement('p');
        p.textContent = t.name;
        const meta = document.createElement('small');
        meta.textContent = `${t.dueDate}${t.dueTime ? ' @ ' + t.dueTime : ''}`;
        note.appendChild(p);
        note.appendChild(meta);
        stickyContainer.appendChild(note);
    });
}

// ensure calendar is hidden by default on load
hideCalendarView();

