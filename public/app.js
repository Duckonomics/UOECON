const SESSION_LIMIT = 3;
const config = window.INTERACTIVE_PAPER || {};
const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const submitButton = document.querySelector("#submit");
const newChatButton = document.querySelector("#new-chat");
const messagesNode = document.querySelector("#messages");
const statusNode = document.querySelector("#status");
const contactNode = document.querySelector("#contact");
let history = [];
let remainingToday = 10;
let audience = "researcher";

applySiteConfig();

document.querySelectorAll(".audience-option").forEach((button) => {
  button.addEventListener("click", () => {
    audience = button.dataset.audience;
    document.querySelectorAll(".audience-option").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
  });
});

document.querySelectorAll(".example").forEach((button) => {
  button.addEventListener("click", () => {
    questionInput.value = button.textContent;
    questionInput.focus();
  });
});

newChatButton.addEventListener("click", () => {
  history = [];
  messagesNode.replaceChildren();
  contactNode.classList.remove("visible");
  questionInput.disabled = false;
  submitButton.disabled = false;
  updateStatus();
  questionInput.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  const used = history.filter((item) => item.role === "user").length;
  if (!question || used >= SESSION_LIMIT) return;

  addMessage("user", question);
  questionInput.value = "";
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history, audience })
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || "The assistant is unavailable.");
      error.code = data.code;
      error.contact = data.contact;
      throw error;
    }

    history.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
    remainingToday = Number.isFinite(data.remainingToday) ? data.remainingToday : remainingToday;
    addMessage("assistant", data.answer);
    if (data.figure) addFigure(data.figure);
    if (data.table) addTable(data.table);
    updateStatus();
    if (data.remainingInConversation <= 0) endConversation();
  } catch (error) {
    addMessage("error", error.message);
    if (["daily_limit", "monthly_limit"].includes(error.code)) {
      setContactLink(error.contact || config.contactEmail);
      contactNode.classList.add("visible");
      questionInput.disabled = true;
      submitButton.disabled = true;
    }
  } finally {
    setBusy(false);
  }
});

function applySiteConfig() {
  document.title = `Interactive Paper — ${config.title || "Research paper"}`;
  document.querySelector("meta[name='description']").content = config.description || "Ask questions about a research paper.";
  document.querySelector("#paper-eyebrow").textContent = config.eyebrow || "Interactive research paper";
  document.querySelector("#paper-title").textContent = config.title || "Research paper";
  document.querySelector("#paper-authors").textContent = config.authors || "Authors";
  document.querySelector("#paper-description").textContent = config.description || "Ask questions about this paper.";
  const paperLink = document.querySelector("#paper-link");
  paperLink.href = config.paperUrl || "#";
  setContactLink(config.contactEmail);

  const examplesNode = document.querySelector("#examples");
  examplesNode.replaceChildren();
  (config.examples || []).slice(0, 4).forEach((text) => {
    const button = document.createElement("button");
    button.className = "example";
    button.type = "button";
    button.textContent = text;
    examplesNode.append(button);
  });

  const featured = document.querySelector("#featured-figure");
  if (config.featuredFigure?.src) {
    featured.hidden = false;
    featured.querySelector("img").src = config.featuredFigure.src;
    featured.querySelector("img").alt = config.featuredFigure.alt || "Featured paper figure";
    featured.querySelector("figcaption").textContent = config.featuredFigure.caption || "";
  }
}

function setContactLink(email) {
  if (!email) return;
  contactNode.querySelector("a").href = `mailto:${encodeURIComponent(email)}?subject=Interactive%20Paper%20access%20request`;
}

function addMessage(role, text) {
  const node = document.createElement("div");
  node.className = `message ${role}`;
  if (role === "assistant") renderMarkdown(node, text);
  else node.textContent = text;
  messagesNode.append(node);
  node.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderMarkdown(container, text) {
  const lines = String(text || "").split(/\r?\n/);
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const node = document.createElement("p");
    appendInlineMarkdown(node, paragraph.join(" "));
    container.append(node);
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      list = null;
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const tag = ordered ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) {
        list = document.createElement(tag);
        container.append(list);
      }
      const item = document.createElement("li");
      appendInlineMarkdown(item, (ordered || unordered)[1]);
      list.append(item);
      continue;
    }
    list = null;
    paragraph.push(line);
  }
  flushParagraph();
}

function appendInlineMarkdown(container, text) {
  const token = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor = 0;
  let match;
  while ((match = token.exec(text)) !== null) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[1]) {
      const strong = document.createElement("strong");
      strong.textContent = match[1];
      container.append(strong);
    } else if (match[2]) {
      const emphasis = document.createElement("em");
      emphasis.textContent = match[2];
      container.append(emphasis);
    } else {
      const link = document.createElement("a");
      link.href = match[4];
      link.textContent = match[3];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      container.append(link);
    }
    cursor = token.lastIndex;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function addFigure(figure) {
  const card = document.createElement("figure");
  card.className = "response-figure";
  const img = document.createElement("img");
  img.src = figure.src;
  img.alt = figure.alt;
  const caption = document.createElement("figcaption");
  caption.textContent = figure.caption;
  card.append(img, caption);
  messagesNode.append(card);
}

function addTable(tableData) {
  const card = document.createElement("figure");
  card.className = "response-table";
  const caption = document.createElement("figcaption");
  const title = document.createElement("strong");
  title.textContent = tableData.title;
  const subtitle = document.createElement("span");
  subtitle.textContent = tableData.subtitle;
  caption.append(title, subtitle);
  const scroller = document.createElement("div");
  scroller.className = "table-scroll";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  tableData.headers.forEach((value) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = value;
    headRow.append(th);
  });
  thead.append(headRow);
  const tbody = document.createElement("tbody");
  tableData.rows.forEach((values) => {
    const row = document.createElement("tr");
    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = value;
      row.append(cell);
    });
    tbody.append(row);
  });
  table.append(thead, tbody);
  scroller.append(table);
  const note = document.createElement("p");
  note.textContent = tableData.note;
  card.append(caption, scroller, note);
  messagesNode.append(card);
}

function endConversation() {
  questionInput.disabled = true;
  submitButton.disabled = true;
  if (remainingToday > 0) addMessage("assistant", "This conversation has reached three questions. Start a new conversation to continue, subject to the daily limit.");
  else contactNode.classList.add("visible");
}

function updateStatus() {
  const used = history.filter((item) => item.role === "user").length;
  statusNode.textContent = `${Math.max(0, SESSION_LIMIT - used)} questions left in this conversation · ${remainingToday} left today`;
}

function setBusy(busy) {
  if (busy) {
    submitButton.disabled = true;
    submitButton.textContent = "Reading…";
  } else {
    const used = history.filter((item) => item.role === "user").length;
    submitButton.disabled = used >= SESSION_LIMIT || questionInput.disabled;
    submitButton.textContent = "Ask";
  }
}

