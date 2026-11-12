const toast = document.getElementById('toast');
const buttons = document.querySelectorAll('#downloadButton, #downloadButtonSecondary');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    toast.textContent = 'Le launcher Sovereign est en cours de téléchargement...';
    toast.classList.add('visible');
    window.setTimeout(() => toast.classList.remove('visible'), 2600);
  });
});
