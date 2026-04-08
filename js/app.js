import { DraggableContainer } from './draggable-container.js';
import { stopPlaying } from './cafe-piano.js';

const containers = {
  cafe: new DraggableContainer('cafe-window', { width: '70%', height: '80%', top: '6%', left: '12%' }),
  links: new DraggableContainer('links-window', { width: '50%', height: '70%', top: '5%', left: '10%' }),
  about: new DraggableContainer('about-window', { width: '40%', height: '60%', top: '10%', left: '40%' })
};

function setupDesktopIcons() {
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  desktopIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const containerId = icon.dataset.container;
      if (containers[containerId]) {
        containers[containerId].show();
      }
    });
  });
}


function setupCafeToggle() {
  const cafeContent = document.querySelector('.cafe-content');
  const cafeButton = document.querySelector('.cafe-toggle-btn');
  if (!cafeContent || !cafeButton) return;

  const updateButtonText = () => {
    cafeButton.textContent = cafeContent.classList.contains('entered') ? 'Exit?' : 'Enter?';
    if (cafeButton.textContent === 'Enter?') {
      stopPlaying()
    }
  };

  cafeButton.addEventListener('click', event => {
    event.stopPropagation();
    cafeContent.classList.toggle('entered');
    updateButtonText();
  });

  updateButtonText();
}

window.addEventListener('DOMContentLoaded', () => {
  setupDesktopIcons();
  setupCafeToggle();
});

