import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


/* -----------------------------
   ELEMENTS
----------------------------- */

const loginView = document.getElementById("loginView");
const studioView = document.getElementById("studioView");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const resetPassword = document.getElementById("resetPassword");

const logoutButton = document.getElementById("logoutButton");

const currentUser = document.getElementById("currentUser");

const topicList = document.getElementById("topicList");
const topicSearch = document.getElementById("topicSearch");

const newTopicButton = document.getElementById("newTopicButton");

const editorHeading = document.getElementById("editorHeading");

const topicForm = document.getElementById("topicForm");

const topicDocumentId = document.getElementById("topicDocumentId");
const topicTitle = document.getElementById("topicTitle");
const topicId = document.getElementById("topicId");
const topicCategory = document.getElementById("topicCategory");
const topicType = document.getElementById("topicType");
const topicReadTime = document.getElementById("topicReadTime");
const topicTags = document.getElementById("topicTags");
const topicDescription = document.getElementById("topicDescription");
const topicRelated = document.getElementById("topicRelated");

const blocksContainer =
  document.getElementById("blocksContainer");

const saveDraftButton =
  document.getElementById("saveDraftButton");

const publishButton =
  document.getElementById("publishButton");

const previewButton =
  document.getElementById("previewButton");

const editorMessage =
  document.getElementById("editorMessage");

const previewModal =
  document.getElementById("previewModal");

const previewFrame =
  document.getElementById("previewFrame");

const closePreview =
  document.getElementById("closePreview");


let allTopics = [];


/* -----------------------------
   AUTH
----------------------------- */

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  loginMessage.textContent = "Signing in...";

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginMessage.textContent = "";

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "Login failed. Check your email and password.";

  }

});


resetPassword.addEventListener("click", async () => {

  const email =
    document.getElementById("loginEmail").value.trim();

  if (!email) {

    loginMessage.textContent =
      "Enter your email first.";

    return;
  }

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    loginMessage.textContent =
      "Password reset email sent.";

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "Could not send reset email.";

  }

});


logoutButton.addEventListener("click", async () => {

  await signOut(auth);

});


/* -----------------------------
   AUTH STATE
----------------------------- */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    loginView.hidden = false;
    studioView.hidden = true;

    return;

  }

  try {

    const adminRef =
      doc(db, "admins", user.uid);

    const adminSnap =
      await getDoc(adminRef);

    if (
      !adminSnap.exists() ||
      adminSnap.data().enabled !== true
    ) {

      await signOut(auth);

      loginView.hidden = false;
      studioView.hidden = true;

      loginMessage.textContent =
        "This account is not an authorized admin.";

      return;

    }

    loginView.hidden = true;
    studioView.hidden = false;

    currentUser.textContent =
      user.email || "Admin";

    await loadTopics();

    newTopic();

  } catch (error) {

    console.error(error);

    loginView.hidden = false;
    studioView.hidden = true;

    loginMessage.textContent =
      "Could not verify admin access.";

  }

});


/* -----------------------------
   LOAD TOPICS
----------------------------- */

async function loadTopics() {

  topicList.innerHTML =
    "<p>Loading topics...</p>";

  try {

    const q = query(
      collection(db, "topics"),
      orderBy("updatedAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    allTopics =
      snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data()
      }));

    renderTopicList();

  } catch (error) {

    console.error(error);

    topicList.innerHTML =
      "<p>Could not load topics.</p>";

  }

}


function renderTopicList() {

  const search =
    topicSearch.value.trim().toLowerCase();

  const filtered =
    allTopics.filter((topic) => {

      return (
        String(topic.title || "")
          .toLowerCase()
          .includes(search)
        ||
        String(topic.id || "")
          .toLowerCase()
          .includes(search)
      );

    });

  topicList.innerHTML = "";

  if (!filtered.length) {

    topicList.innerHTML =
      "<p>No topics found.</p>";

    return;

  }

  filtered.forEach((topic) => {

    const button =
      document.createElement("button");

    button.className =
      "topic-item";

    button.dataset.firestoreId =
      topic.firestoreId;

    button.innerHTML = `
      <strong>
        ${escapeHtml(topic.title || "Untitled")}
      </strong>

      <small>
        ${escapeHtml(topic.status || "draft")}
        ·
        ${escapeHtml(topic.category || "")}
      </small>
    `;

    button.addEventListener(
      "click",
      () => loadTopicIntoEditor(topic)
    );

    topicList.appendChild(button);

  });

}


topicSearch.addEventListener(
  "input",
  renderTopicList
);


/* -----------------------------
   NEW TOPIC
----------------------------- */

newTopicButton.addEventListener(
  "click",
  newTopic
);


function newTopic() {

  topicForm.reset();

  topicDocumentId.value = "";

  topicCategory.value =
    "Mathematics";

  topicType.value =
    "Concept guide";

  topicReadTime.value =
    "8 min";

  editorHeading.textContent =
    "Create a topic";

  blocksContainer.innerHTML = `
    <div class="empty-blocks">
      Add a content block below.
    </div>
  `;

  editorMessage.textContent = "";

}


/* -----------------------------
   LOAD EXISTING TOPIC
----------------------------- */

function loadTopicIntoEditor(topic) {

  topicDocumentId.value =
    topic.firestoreId || "";

  topicTitle.value =
    topic.title || "";

  topicId.value =
    topic.id || "";

  topicCategory.value =
    topic.category || "Mathematics";

  topicType.value =
    topic.type || "Concept guide";

  topicReadTime.value =
    topic.readTime || "8 min";

  topicTags.value =
    (topic.tags || []).join(", ");

  topicDescription.value =
    topic.description || "";

  topicRelated.value =
    (topic.related || []).join(", ");

  editorHeading.textContent =
    "Edit topic";

  renderBlocks(topic.blocks || []);

  editorMessage.textContent =
    "";

}


/* -----------------------------
   BLOCK BUTTONS
----------------------------- */

document
  .querySelectorAll("[data-add-block]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const type =
          button.dataset.addBlock;

        addBlock(type);

      }
    );

  });


function addBlock(type, data = {}) {

  const empty =
    blocksContainer.querySelector(".empty-blocks");

  if (empty) {
    empty.remove();
  }

  const block =
    document.createElement("div");

  block.className =
    "content-block";

  block.dataset.type =
    type;

  block.innerHTML =
    blockTemplate(type, data);

  blocksContainer.appendChild(block);

  setupBlockButtons();

}


/* -----------------------------
   BLOCK TEMPLATES
----------------------------- */

function blockTemplate(type, data) {

  const title =
    escapeAttribute(data.title || "");

  if (type === "text") {

    const paragraphs =
      escapeHtml(
        (data.paragraphs || []).join("\n\n")
      );

    return `
      ${blockHeader("EXPLANATION")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
          placeholder="What is curvature?"
        >
      </label>

      <label>
        Paragraphs
        <textarea
          data-field="paragraphs"
          rows="7"
          placeholder="Write the explanation..."
        >${paragraphs}</textarea>
      </label>
    `;

  }


  if (type === "formula") {

    return `
      ${blockHeader("FORMULA")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
          placeholder="Curvature formula"
        >
      </label>

      <label>
        Formula
        <input
          data-field="formula"
          value="${escapeAttribute(data.formula || "")}"
          placeholder="κ = |y''| / (1 + (y')²)^(3/2)"
        >
      </label>

      <label>
        Explanation
        <textarea
          data-field="explanation"
          rows="4"
        >${escapeHtml(data.explanation || "")}</textarea>
      </label>
    `;

  }


  if (type === "note") {

    return `
      ${blockHeader("NOTE")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
        >
      </label>

      <label>
        Note
        <textarea
          data-field="text"
          rows="5"
        >${escapeHtml(data.text || "")}</textarea>
      </label>
    `;

  }


  if (type === "story") {

    const steps =
      data.steps || [];

    return `
      ${blockHeader("STORY")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
        >
      </label>

      <div
        class="story-steps"
        data-story-steps
      ></div>

      <button
        type="button"
        class="block-add add-story-step"
      >
        + Add step
      </button>
    `;

  }


  if (type === "problem") {

    return `
      ${blockHeader("PROBLEM")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
        >
      </label>

      <label>
        Question
        <textarea
          data-field="question"
          rows="4"
        >${escapeHtml(data.question || "")}</textarea>
      </label>

      <label>
        Hint
        <textarea
          data-field="hint"
          rows="3"
        >${escapeHtml(data.hint || "")}</textarea>
      </label>

      <label>
        Solution
        <textarea
          data-field="solution"
          rows="5"
        >${escapeHtml(data.solution || "")}</textarea>
      </label>
    `;

  }


  if (type === "gallery") {

    const items =
      data.items || [];

    return `
      ${blockHeader("GALLERY")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
        >
      </label>

      <label>
        Images
        <textarea
          data-field="items"
          rows="7"
          placeholder="URL | Alt text | Caption"
        >${escapeHtml(
          items.map(
            item =>
              `${item.src || ""} | ${item.alt || ""} | ${item.caption || ""}`
          ).join("\n")
        )}</textarea>
      </label>
    `;

  }


  if (type === "media") {

    return `
      ${blockHeader("MEDIA")}

      <label>
        Heading
        <input
          data-field="title"
          value="${title}"
        >
      </label>

      <label>
        Media type

        <select data-field="kind">

          <option
            ${data.kind === "video" ? "selected" : ""}
          >
            video
          </option>

          <option
            ${data.kind === "audio" ? "selected" : ""}
          >
            audio
          </option>

        </select>

      </label>

      <label>
        Media URL
        <input
          data-field="src"
          value="${escapeAttribute(data.src || "")}"
          placeholder="assets/media/example.mp4"
        >
      </label>

      <label>
        Caption
        <textarea
          data-field="caption"
          rows="3"
        >${escapeHtml(data.caption || "")}</textarea>
      </label>
    `;

  }

  return "";

}


function blockHeader(name) {

  return `
    <div class="block-top">

      <span class="block-type">
        ${name}
      </span>

      <div class="block-actions">

        <button
          type="button"
          class="move-up"
        >
          ↑
        </button>

        <button
          type="button"
          class="move-down"
        >
          ↓
        </button>

        <button
          type="button"
          class="remove-block"
        >
          Remove
        </button>

      </div>

    </div>
  `;

}


/* -----------------------------
   BLOCK CONTROLS
----------------------------- */

function setupBlockButtons() {

  document
    .querySelectorAll(".remove-block")
    .forEach((button) => {

      button.onclick = () => {

        button
          .closest(".content-block")
          .remove();

      };

    });


  document
    .querySelectorAll(".move-up")
    .forEach((button) => {

      button.onclick = () => {

        const block =
          button.closest(".content-block");

        const previous =
          block.previousElementSibling;

        if (previous) {

          block.parentNode.insertBefore(
            block,
            previous
          );

        }

      };

    });


  document
    .querySelectorAll(".move-down")
    .forEach((button) => {

      button.onclick = () => {

        const block =
          button.closest(".content-block");

        const next =
          block.nextElementSibling;

        if (next) {

          block.parentNode.insertBefore(
            next,
            block
          );

        }

      };

    });


  document
    .querySelectorAll(".add-story-step")
    .forEach((button) => {

      button.onclick = () => {

        const container =
          button
            .closest(".content-block")
            .querySelector("[data-story-steps]");

        addStoryStep(container);

      };

    });

}


/* -----------------------------
   STORY STEPS
----------------------------- */

function addStoryStep(container, data = {}) {

  const step =
    document.createElement("div");

  step.className =
    "story-step";

  step.innerHTML = `

    <div class="story-step-header">

      <strong>
        Step
      </strong>

      <button
        type="button"
        class="remove-step"
      >
        Remove
      </button>

    </div>

    <input
      data-step-title
      placeholder="Step title"
      value="${escapeAttribute(data.title || "")}"
    >

    <textarea
      data-step-text
      rows="3"
      placeholder="Explain what happens..."
    >${escapeHtml(data.text || "")}</textarea>

  `;

  container.appendChild(step);

  step
    .querySelector(".remove-step")
    .onclick = () => step.remove();

}


/* -----------------------------
   RENDER BLOCKS
----------------------------- */

function renderBlocks(blocks) {

  blocksContainer.innerHTML = "";

  if (!blocks.length) {

    blocksContainer.innerHTML = `
      <div class="empty-blocks">
        Add a content block below.
      </div>
    `;

    return;

  }

  blocks.forEach((block) => {

    addBlock(
      block.type,
      block
    );

  });

  blocks.forEach((block, index) => {

    if (block.type !== "story") return;

    const editor =
      blocksContainer.children[index];

    const container =
      editor.querySelector("[data-story-steps]");

    (block.steps || []).forEach(
      step =>
        addStoryStep(container, step)
    );

  });

}


/* -----------------------------
   COLLECT BLOCKS
----------------------------- */

function collectBlocks() {

  return [
    ...blocksContainer.querySelectorAll(
      ".content-block"
    )
  ].map((element) => {

    const type =
      element.dataset.type;

    const get =
      field =>
        element.querySelector(
          `[data-field="${field}"]`
        )?.value || "";


    if (type === "text") {

      return {
        type: "text",
        title: get("title"),
        paragraphs:
          get("paragraphs")
            .split(/\n\s*\n/)
            .map(x => x.trim())
            .filter(Boolean)
      };

    }


    if (type === "formula") {

      return {
        type: "formula",
        title: get("title"),
        formula: get("formula"),
        explanation: get("explanation")
      };

    }


    if (type === "note") {

      return {
        type: "note",
        title: get("title"),
        text: get("text")
      };

    }


    if (type === "story") {

      const steps =
        [...element.querySelectorAll(".story-step")]
          .map(step => ({
            title:
              step.querySelector(
                "[data-step-title]"
              )?.value || "",

            text:
              step.querySelector(
                "[data-step-text]"
              )?.value || ""
          }));

      return {
        type: "story",
        title: get("title"),
        steps
      };

    }


    if (type === "problem") {

      return {
        type: "problem",
        title: get("title"),
        question: get("question"),
        hint: get("hint"),
        solution: get("solution")
      };

    }


    if (type === "gallery") {

      const items =
        get("items")
          .split("\n")
          .map(line => {

            const parts =
              line.split("|").map(x => x.trim());

            return {
              src: parts[0] || "",
              alt: parts[1] || "",
              caption: parts[2] || ""
            };

          })
          .filter(item => item.src);

      return {
        type: "gallery",
        title: get("title"),
        items
      };

    }


    if (type === "media") {

      return {
        type: "media",
        title: get("title"),
        kind: get("kind"),
        src: get("src"),
        caption: get("caption")
      };

    }


    return null;

  }).filter(Boolean);

}


/* -----------------------------
   COLLECT TOPIC
----------------------------- */

function collectTopic(status) {

  const id =
    topicId.value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  return {

    id,

    title:
      topicTitle.value.trim(),

    category:
      topicCategory.value.trim(),

    type:
      topicType.value,

    readTime:
      topicReadTime.value.trim(),

    description:
      topicDescription.value.trim(),

    tags:
      topicTags.value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean),

    related:
      topicRelated.value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean),

    blocks:
      collectBlocks(),

    status,

    updatedAt:
      serverTimestamp()

  };

}


/* -----------------------------
   VALIDATION
----------------------------- */

function validateTopic(topic) {

  if (!topic.title) {

    throw new Error(
      "Title is required."
    );

  }

  if (!topic.id) {

    throw new Error(
      "Topic ID is required."
    );

  }

  if (!topic.description) {

    throw new Error(
      "Description is required."
    );

  }

}


/* -----------------------------
   SAVE DRAFT
----------------------------- */

saveDraftButton.addEventListener(
  "click",
  () => saveTopic("draft")
);


/* -----------------------------
   PUBLISH
------