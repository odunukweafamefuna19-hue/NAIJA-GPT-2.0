
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChat");

let conversation = [];
let isGenerating = false;

function addMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = content;
  messages.appendChild(message);
  messages.scrollIntoView({ behavior: "smooth", block: "end" });
}

function newChat() {
  conversation = [];
  messages.innerHTML = "";
  welcome.style.display = "block";
  input.value = "";
}

newChatBtn.addEventListener("click", newChat);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text || isGenerating) return;

  conversation.push({
    role: "user",
    content: text
  });

  addMessage("user", text);
  welcome.style.display = "none";

  input.value = "";
  isGenerating = true;
  sendBtn.disabled = true;
  sendBtn.textContent = "...";

  const loading = document.createElement("div");
  loading.className = "message assistant";
  loading.textContent = "NAIJA GPT is thinking...";
  messages.appendChild(loading);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "AI request failed.");
    }

    conversation.push({
      role: "assistant",
      content: data.reply
    });

    addMessage("assistant", data.reply);

  } catch (error) {
    loading.remove();
    addMessage("assistant", "Sorry bro! " + error.message);
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    sendBtn.textContent = "➤";
    input.focus();
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
  
