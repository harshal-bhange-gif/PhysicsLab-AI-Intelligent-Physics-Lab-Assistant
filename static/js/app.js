/* ══════════════════════════════════════════════════════════════
   PhysicsLab AI — Frontend Application Controller
   IBM AICTE · Powered by IBM watsonx.ai Granite
   ══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
const state = {
  experiments:    [],
  selectedExp:    null,
  selectedSection: "full",
  chatHistory:    [],
  isGenerating:   false,
  lastContent:    "",
  currentFilter:  "all",
};

// ── DOM Refs ───────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  loadExperiments();
  checkHealth();
  setupThemeToggle();
  setupSectionBtns();
  setupQuickExpSelect();
  // auto-resize textarea on input
  $("chatInput") && $("chatInput").addEventListener("input", () => autoResize($("chatInput")));
});

// ── Particles ─────────────────────────────────────────────────
function initParticles() {
  const container = $("particles");
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      --dur:   ${4 + Math.random() * 6}s;
      --delay: ${-Math.random() * 6}s;
      width:  ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
      opacity: ${0.1 + Math.random() * 0.4};
    `;
    container.appendChild(p);
  }
}

// ── Health Check ───────────────────────────────────────────────
async function checkHealth() {
  try {
    const res  = await fetch("/api/health");
    const data = await res.json();
    const dot  = $("statusDot");
    const txt  = $("statusText");
    const mid  = $("modelId");
    if (data.status === "ok") {
      if (dot) { dot.classList.remove("offline"); }
      if (txt) txt.textContent = "Online";
      if (mid) mid.textContent = data.model || "ibm/granite-3-3-8b-instruct";
    } else {
      markOffline();
    }
  } catch {
    markOffline();
  }
}
function markOffline() {
  const dot = $("statusDot");
  const txt = $("statusText");
  if (dot) dot.classList.add("offline");
  if (txt) txt.textContent = "Offline";
}

// ── Load Experiments ───────────────────────────────────────────
async function loadExperiments() {
  try {
    const res  = await fetch("/api/experiments");
    const data = await res.json();
    state.experiments = data.experiments || [];
    renderExperiments();
    populateQuickSelect();
  } catch (e) {
    showToast("Could not load experiments list.", "error");
  }
}

function renderExperiments(list) {
  const container = $("experimentList");
  if (!container) return;
  const items = list || state.experiments;
  if (!items.length) {
    container.innerHTML = `<p style="padding:16px;color:var(--text-2);font-size:13px;">No experiments found.</p>`;
    return;
  }
  container.innerHTML = items.map(exp => `
    <div class="exp-item ${state.selectedExp?.id === exp.id ? 'active' : ''}"
         onclick="selectExperiment(${exp.id})"
         data-id="${exp.id}" data-category="${exp.category}">
      <div class="exp-num">${exp.id}</div>
      <div>
        <div class="exp-item-name">${exp.name}</div>
        <div class="exp-item-cat">${exp.category}</div>
      </div>
    </div>
  `).join("");
}

function selectExperiment(id) {
  const exp = state.experiments.find(e => e.id === id);
  if (!exp) return;
  state.selectedExp = exp;
  renderExperiments(getFilteredExperiments());
  $("selectedExpName").textContent = exp.name;
  $("selectedExpBar").style.borderColor = "var(--accent)";
  scrollToSection("sectionControls");
  showToast(`Selected: ${exp.name}`, "info");
}

function getFilteredExperiments() {
  const filter = state.currentFilter;
  const search = ($("expSearch")?.value || "").toLowerCase();
  return state.experiments.filter(e => {
    const catMatch  = filter === "all" || e.category === filter;
    const nameMatch = !search || e.name.toLowerCase().includes(search);
    return catMatch && nameMatch;
  });
}

function filterExperiments() {
  renderExperiments(getFilteredExperiments());
}

function filterByCategory(cat, btn) {
  state.currentFilter = cat;
  $$(".cat-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderExperiments(getFilteredExperiments());
}

function populateQuickSelect() {
  const sel = $("quickExpSelect");
  if (!sel) return;
  sel.innerHTML = `<option value="">Choose experiment…</option>` +
    state.experiments.map(e =>
      `<option value="${e.name}">${e.name}</option>`
    ).join("");
}

// ── Section Buttons ────────────────────────────────────────────
function setupSectionBtns() {
  $$(".sec-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".sec-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedSection = btn.dataset.section;
    });
  });
}

// ── Generate Content ───────────────────────────────────────────
async function generateContent() {
  if (!state.selectedExp) {
    showToast("Please select an experiment first.", "warning");
    return;
  }
  if (state.isGenerating) return;

  const section = state.selectedSection;
  await runGenerate(state.selectedExp.name, section, "");
}

async function quickGenerate() {
  const expName = $("quickExpSelect")?.value;
  const section = $("quickSectionSelect")?.value || "full";
  const ctx     = $("quickContext")?.value || "";
  if (!expName) { showToast("Please select an experiment.", "warning"); return; }
  scrollToSection("outputCard");
  await runGenerate(expName, section, ctx);
}

async function runGenerate(expName, section, ctx) {
  if (state.isGenerating) return;
  state.isGenerating = true;
  showLoading(`Generating ${section === 'full' ? 'Full Manual' : section} for ${expName}…`);
  disableGenBtn(true);

  try {
    const res  = await fetch("/api/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ experiment: expName, section, extra_context: ctx }),
    });
    const data = await res.json();
    if (data.success) {
      state.lastContent = data.content;
      renderOutput(data.content);
      showToast("Content generated successfully!", "success");
    } else {
      showToast(`Error: ${data.error}`, "error");
    }
  } catch (e) {
    showToast("Network error. Please try again.", "error");
  } finally {
    hideLoading();
    state.isGenerating = false;
    disableGenBtn(false);
  }
}

function renderOutput(markdown) {
  const content = $("outputContent");
  const toolbar = $("outputToolbar");
  if (!content) return;

  // Render markdown → HTML
  let html = "";
  if (typeof marked !== "undefined") {
    marked.setOptions({ breaks: true, gfm: true });
    html = marked.parse(markdown);
  } else {
    html = `<pre style="white-space:pre-wrap">${escapeHtml(markdown)}</pre>`;
  }

  content.innerHTML = `<div class="rendered-content">${html}</div>`;
  if (toolbar) toolbar.style.display = "flex";

  // Syntax highlighting
  if (typeof hljs !== "undefined") {
    content.querySelectorAll("pre code").forEach(block => hljs.highlightElement(block));
  }

  // Scroll output into view
  content.scrollTop = 0;
}

// ── Chat ───────────────────────────────────────────────────────
async function sendMessage() {
  const input = $("chatInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text || state.isGenerating) return;

  input.value = "";
  autoResize(input);

  appendChatMessage("user", text);
  state.chatHistory.push({ role: "user", content: text });
  showTypingIndicator();

  const sendBtn = $("sendBtn");
  if (sendBtn) sendBtn.disabled = true;
  state.isGenerating = true;

  try {
    const res  = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: text, history: state.chatHistory }),
    });
    const data = await res.json();
    removeTypingIndicator();

    if (data.success) {
      const reply = data.response;
      state.chatHistory.push({ role: "assistant", content: reply });
      appendChatMessage("ai", reply);
    } else {
      appendChatMessage("ai", `❌ Error: ${data.error}`);
    }
  } catch {
    removeTypingIndicator();
    appendChatMessage("ai", "❌ Network error. Please check your connection and try again.");
  } finally {
    state.isGenerating = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function appendChatMessage(role, content) {
  const window_ = $("chatWindow");
  if (!window_) return;

  const isAI = role === "ai";
  const html  = isAI && typeof marked !== "undefined"
    ? marked.parse(content)
    : `<p>${escapeHtml(content)}</p>`;

  const div = document.createElement("div");
  div.className = `chat-message ${isAI ? "ai-message" : "user-message"}`;
  div.innerHTML = `
    <div class="msg-avatar">
      <i class="fa-solid ${isAI ? 'fa-atom' : 'fa-user'}"></i>
    </div>
    <div class="msg-bubble">${html}</div>
  `;
  window_.appendChild(div);
  window_.scrollTop = window_.scrollHeight;

  if (isAI && typeof hljs !== "undefined") {
    div.querySelectorAll("pre code").forEach(b => hljs.highlightElement(b));
  }
}

function showTypingIndicator() {
  const win = $("chatWindow");
  if (!win) return;
  const div = document.createElement("div");
  div.id = "typingIndicator";
  div.className = "chat-message ai-message";
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-atom"></i></div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function removeTypingIndicator() {
  $("typingIndicator")?.remove();
}

function sendQuickPrompt(el) {
  const input = $("chatInput");
  if (input && el) {
    input.value = el.textContent.trim();
    sendMessage();
  }
}

function injectPrompt(el) {
  const input = $("chatInput");
  if (input && el) {
    input.value = el.textContent.trim();
    input.focus();
    scrollToSection("chat-section");
  }
}

function handleChatKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

// ── Output Toolbar ─────────────────────────────────────────────
function copyContent() {
  if (!state.lastContent) return;
  navigator.clipboard.writeText(state.lastContent)
    .then(() => showToast("Copied to clipboard!", "success"))
    .catch(() => showToast("Copy failed.", "error"));
}

async function exportContent() {
  if (!state.lastContent) {
    showToast("Nothing to export yet.", "warning");
    return;
  }
  const expName = state.selectedExp?.name || "experiment";
  const filename = `PhysicsLab_${expName.replace(/\s+/g, '_')}_${state.selectedSection}`;
  try {
    const res = await fetch("/api/export/pdf", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: state.lastContent, filename }),
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported! Open the HTML file in a browser and use Ctrl+P to save as PDF.", "success");
  } catch {
    showToast("Export failed.", "error");
  }
}

function clearOutput() {
  const content = $("outputContent");
  const toolbar = $("outputToolbar");
  if (content) content.innerHTML = `
    <div class="welcome-placeholder">
      <div class="welcome-icon"><i class="fa-solid fa-atom fa-spin-pulse"></i></div>
      <h4>Output Cleared</h4>
      <p>Select an experiment and generate content to see results here.</p>
    </div>`;
  if (toolbar) toolbar.style.display = "none";
  state.lastContent = "";
}

// ── Quick Select Sync ──────────────────────────────────────────
function setupQuickExpSelect() {
  const sel = $("quickExpSelect");
  if (!sel) return;
  sel.addEventListener("change", () => {
    const exp = state.experiments.find(e => e.name === sel.value);
    if (exp) {
      state.selectedExp = exp;
      $("selectedExpName").textContent = exp.name;
      renderExperiments(getFilteredExperiments());
    }
  });
}

// ── Theme Toggle ───────────────────────────────────────────────
function setupThemeToggle() {
  const btn = $("themeToggle");
  if (!btn) return;
  const saved = localStorage.getItem("physicslab-theme") || "dark";
  applyTheme(saved);
  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("physicslab-theme", next);
  });
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("themeToggle")?.querySelector("i");
  if (icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

// ── Loading ─────────────────────────────────────────────────────
function showLoading(msg) {
  const overlay = $("loadingOverlay");
  const text    = $("loadingText");
  if (overlay) overlay.classList.add("active");
  if (text && msg) text.textContent = msg;
}
function hideLoading() {
  $("loadingOverlay")?.classList.remove("active");
}
function disableGenBtn(state_) {
  const btn = $("generateBtn");
  if (btn) btn.disabled = state_;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const toastEl = $("appToast");
  const body    = $("toastBody");
  if (!toastEl || !body) return;
  body.textContent = msg;
  toastEl.className = `toast align-items-center text-bg-${
    type === "success" ? "success" : type === "error" ? "danger" : type === "warning" ? "warning" : "dark"
  } border-0`;
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
  toast.show();
}

// ── Helpers ────────────────────────────────────────────────────
function scrollToSection(id) {
  const el = $(id) || document.querySelector(`#${id}, .${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
