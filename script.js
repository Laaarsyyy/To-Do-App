const toggleDarkMode =document.getElementById('darkModeToggle');
const task = document.getElementsByClassName('addTaskButton');

toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('darkMode', toggleDarkMode.checked);
});