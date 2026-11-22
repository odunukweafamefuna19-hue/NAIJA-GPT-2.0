
let supabaseClient;
let conversation = [];
let isGenerating = false;

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");
const authMessage = document.getElementById("authMessage");

const authLogin = document.getElementById("authLogin");
const authSignup = document.getElementById("authSignup");
const authVerify = document.getElementById("authVerify");
const authReset = document.getElementById("authReset");

const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");

function showAuthScreen(screen) {
  authLogin.hidden = screen !== "login";
  authSignup.hidden = screen !== "signup";
  authVerify.hidden = true;
  authReset.hidden = screen !== "reset";
  authMessage.textContent = "";
}

function showMessage(message, success = false) {
  authMessage.textContent = message;
  authMessage.style.color = success ? "#4ade80" : "#fbbf24";
}

function showApp(user) {
  authScreen.hidden = true;
  app.hidden = false;

  const name =
    user.user_metadata?.full_name ||
    user.email ||
    "My Account";

  document.getElementById("userProfile").textContent = name;
}

function showLogin() {
  app.hidden = true;
  authScreen.hidden = false;
  showAuthScreen("login");
}

async function initializeApp() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (!response.ok || !config.supabaseUrl || !config.supabaseKey) {
      throw new Error("Supabase configuration is missing.");
    }

    supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session) {
      showApp(data.session.user);
    } else {
      showLogin();
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        showApp(session.user);
      } else if (event === "SIGNED_OUT") {
        showLogin();
      }
    });

  } catch (error) {
    showLogin();
    showMessage(error.message);
  }
}

// Switch screens

document.getElementById("showSignup").addEventListener("click", () => {
  showAuthScreen("signup");
});

document.getElementById("showLogin").addEventListener("click", () => {
  showAuthScreen("login");
});

document.getElementById("backToLogin").addEventListener("click", () => {
  showAuthScreen("login");
});

document.getElementById("backFromReset").addEventListener("click", () => {
  showAuthScreen("login");
});

// Registration

document.getElementById("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Creating account...";

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    if (data.session) {
      showApp(data.session.user);
    } else {
      showAuthScreen("login");
      showMessage(
        "Registration successful! Check your email and click the confirmation link before signing in.",
        true
      );
    }

  } catch (error) {
    showMessage(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Create Account";
  }
});

// Login

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Signing in...";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    showApp(data.user);

  } catch (error) {
    showMessage(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
});

// Google login

document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;

  } catch (error) {
    showMessage(error.message);
  }
});

// Forgot password

document.getElementById("forgotPassword").addEventListener("click", () => {
  showAuthScreen("reset");
});

document.getElementById("resetForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    if (error) throw error;

    showMessage("Password reset email sent. Check your inbox.", true);

  } catch (error) {
    showMessage(error.message);
  }
});

// Sign out

document.getElementById("logoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) alert(error.message);
});

// Chat

function addMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = content;
  messages.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
}

function newChat() {
  conversation = [];
  messages.innerHTML = "";
  welcome.style.display = "block";
  input.value = "";
}

document.getElementById("newChat").addEventListener("click", newChat);

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
    addMessage("assistant", error.message);
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

initializeApp();
    
