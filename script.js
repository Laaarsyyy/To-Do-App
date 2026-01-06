/*
========================================
        Toggle Dark Mode
========================================
*/

const toggleDarkMode =document.getElementById('darkModeToggle');

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

listSelect.addEventListener('change', () => {
    if (listSelect.value === 'addList') {
        addListField.style.display = 'flex';
    }
});

cancelListBtn.addEventListener('click', () => {
    addListField.style.display = 'none';
    listSelect.value = '';
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