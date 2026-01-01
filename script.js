const toggleDarkMode =document.getElementById('darkModeToggle');

toggleDarkMode.addEventListener('change', () => {
    document.body.classList.toggle('darkMode', toggleDarkMode.checked);
});

const colorPicker = document.getElementById('color');
const colorOutput = document.getElementById('colorOutput');

colorPicker.addEventListener('input', () => {
    colorOutput.textContent = colorPicker.value;
    document.documentElement.style.setProperty('--primary-color', colorPicker.value);
});