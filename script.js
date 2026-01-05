const toggleDarkMode =document.getElementById('darkModeToggle');

toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('darkMode', toggleDarkMode.checked);
});

const colorPicker = document.getElementById('color');

colorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--primary-color', colorPicker.value);
});


const addTaskCloseModal = document.getElementById('addTaskcloseModal');
const addTaskModal = document.querySelector('.addTaskModal');

addTaskCloseModal.addEventListener('click', () => {
    addTaskModal.classList.remove('open');
    addTaskModal.classList.add('closed');
});

const addTaskButton = document.querySelector('.addTaskButton');

addTaskButton.addEventListener('click', () => {
    addTaskModal.classList.remove('closed');
    addTaskModal.classList.add('open');
});