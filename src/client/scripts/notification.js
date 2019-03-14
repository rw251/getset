const $notification = document.querySelector('.notification');

const hideNotifiction = () => {
  $notification.style.display = 'none';
};

const showNotification = () => {
  $notification.style.display = 'block';
  setTimeout(() => {
    hideNotifiction();
  }, 3000);
};

const show = (text) => {
  $notification.innerText = text;
  showNotification();
};

export { show as default };
