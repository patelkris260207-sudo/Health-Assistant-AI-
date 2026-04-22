export function createMessageBubble({ role, text }) {
  const wrapper = document.createElement("div");
  wrapper.className = `message message-${role}`;
  wrapper.setAttribute("role", "article");
  wrapper.setAttribute("aria-label", `${role} message`);
  wrapper.textContent = text;
  return wrapper;
}
