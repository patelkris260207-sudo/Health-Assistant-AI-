/**
 * Health Assistant AI — Chat UI helpers
 */

const Chat = (() => {
  /* ── helpers ─────────────────────────────────────────────────────── */
  function _container() { return document.getElementById('chatMessages'); }

  /** Convert Markdown-ish text (headers, bold, bullet lists) to HTML */
  function _markdownToHtml(text) {
    return text
      // escape HTML entities first
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // ### Heading
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      // ## Heading
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // *italic*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // numbered list  1. item → <li data-ol>
      .replace(/^\d+\.\s+(.+)$/gm, '<li data-ol>$1</li>')
      // bullet list  - item  or  • item
      .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
      // wrap consecutive ordered <li data-ol> items in <ol>
      .replace(/(<li data-ol>.*?<\/li>(\n|$))+/g, match =>
        `<ol>${match.replace(/ data-ol/g, '')}</ol>`)
      // wrap remaining consecutive <li> items in <ul>
      .replace(/(<li>.*?<\/li>(\n|$))+/g, match => `<ul>${match}</ul>`)
      // blank lines → paragraph breaks
      .replace(/\n{2,}/g, '</p><p>')
      // single newlines → <br>
      .replace(/\n/g, '<br>')
      // wrap in a paragraph
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  /** Scroll the chat window to the very bottom */
  function _scrollToBottom() {
    const c = _container();
    if (c) c.scrollTop = c.scrollHeight;
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  return {
    /** Append a user message (text + optional thumbnail) */
    addUserMessage(text, imageDataUrl = null) {
      const c = _container();
      if (!c) return;

      const div = document.createElement('div');
      div.className = 'message message-user';

      let content = '';
      if (imageDataUrl) {
        content += `<img src="${imageDataUrl}" alt="Uploaded photo" class="msg-image" />`;
      }
      if (text) {
        content += `<span class="msg-text">${text.replace(/</g, '&lt;')}</span>`;
      }
      div.innerHTML = content;
      c.appendChild(div);
      _scrollToBottom();
    },

    /** Append an AI message bubble */
    addAIMessage(text, severity = 0) {
      const c = _container();
      if (!c) return;

      const div = document.createElement('div');
      div.className = 'message message-ai';
      if (severity >= 8) div.classList.add('msg-critical');
      else if (severity >= 5) div.classList.add('msg-warning');

      div.innerHTML = `
        <div class="ai-avatar">🏥</div>
        <div class="msg-body">${_markdownToHtml(text)}</div>`;
      c.appendChild(div);
      _scrollToBottom();
    },

    /** Show a "typing…" indicator, returns a remove function */
    showTyping() {
      const c = _container();
      if (!c) return () => {};

      const div = document.createElement('div');
      div.className = 'message message-ai typing-indicator';
      div.id = 'typingIndicator';
      div.innerHTML = `
        <div class="ai-avatar">🏥</div>
        <div class="msg-body"><span></span><span></span><span></span></div>`;
      c.appendChild(div);
      _scrollToBottom();
      return () => div.remove();
    },

    /** Show a system / info message (e.g. "Location detected") */
    addSystemMessage(text) {
      const c = _container();
      if (!c) return;
      const div = document.createElement('div');
      div.className = 'message message-system';
      div.innerHTML = `<span>${text}</span>`;
      c.appendChild(div);
      _scrollToBottom();
    },

    /** Clear all messages */
    clear() {
      const c = _container();
      if (c) c.innerHTML = '';
    },

    /** Display an error bubble */
    addError(text) {
      const c = _container();
      if (!c) return;
      const div = document.createElement('div');
      div.className = 'message message-ai message-error';
      div.innerHTML = `<div class="ai-avatar">⚠️</div><div class="msg-body">${text}</div>`;
      c.appendChild(div);
      _scrollToBottom();
    },
  };
})();
