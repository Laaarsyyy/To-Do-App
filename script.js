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
const listSelect = document.getElementById('listSelect');
const addListField = document.querySelector('.addListField');
const cancelListBtn = document.getElementById('cancelListBtn');
const newListName = document.getElementById('newListName');

listSelect.addEventListener('change', () => {
    if (listSelect.value === 'addList') {
        addListField.style.display = 'flex';
        newListName.focus();
    }
});

cancelListBtn.addEventListener('click', () => {
    addListField.style.display = 'none';
    listSelect.value = '';
});

/*
========================================
            Adding Task
========================================
*/
const taskNameInput = document.getElementById('taskName');
const saveTaskBtn = document.querySelector('.saveTaskBtn');

saveTaskBtn.addEventListener('click', () => {
    const taskName = taskNameInput.value.trim();
    if (taskName === '') return; {
        taskNameInput.value = '';
    }

    const tasks = document.querySelector('.tasks');
    const taskItem = document.createElement('li');
    taskItem.setAttribute('id', 'task');
    taskItem.innerHTML = `
    <p><input type="checkbox"/>${taskName}</p><i 
    class="fa-solid fa-angle-right"></i>
    `;
    tasks.appendChild(taskItem);
    toggleModal();
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
