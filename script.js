const toggleDarkMode =document.getElementById('darkModeToggle');

toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('darkMode', toggleDarkMode.checked);
});

const colorPicker = document.getElementById('color');

colorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--primary-color', colorPicker.value);
});