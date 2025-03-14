// Non-blocking alert()
export function showUserMessage(title, message) {
  const userMessage = document.getElementById('userMessage');
  userMessage.showModal();
  userMessage.querySelector('.dialog-header').textContent = title;
  userMessage.querySelector('.dialog-content').textContent = message;
}