import { db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// ======================================================
// QUORIYA HOMEPAGE STATE
// ======================================================

const state = {
  topics: [],
  category: "All",
  saved: new Set(
    JSON.parse(localStorage.getItem("quoriya-saved") || "[]")
  )
};


// ======================================================
// SHORT DOM HELPER
// ======================================================

const $ = (selector) => document.querySelector(selector);


// ======================================================
// ESCAPE HTML
// Prevents topic content from being interpreted as HTML
// ======================================================

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]
  );
}


// ======================================================
// LOAD PUBLISHED TOPICS FROM FIRESTORE
// ======================================================

async function loadTopics() {

  const topicsRef = collection(db, "topics");

  const publishedQuery = query(
    topicsRef,
    where("status", "==", "published")
  );

  const snapshot = await getDocs(publishedQuery);

  state.topics = snapshot.docs.map((documentSnapshot) => {

    const data = documentSnapshot.data();

    return {
      firestoreId: documentSnapshot.id,
      ...data
    };

  });

  console.log(
    `Quoriya: ${state.topics.length} published topics loaded from Firestore.`
  );
}


// ======================================================
// CREATE CATEGORY LIST
// ======================================================

function getCategories() {

  const categories = new Set();

  state.topics.forEach((topic) => {

    if (topic.category) {
      categories.add(topic.category);
    }

  });

  return ["All", ...Array.from(categories).sort()];
}


// ======================================================
// RENDER CATEGORY FILTER BUTTONS
// ======================================================

function renderFilters() {

  const categories = getCategories();

  const container = $("#categoryFilters");

  if (!container) return;

  container.innerHTML = categories
    .map((category) => {

      return `
        <button
          class="filter-btn ${category === "All" ? "active" : ""}"
          data-cat="${escapeHtml(category)}"
          type="button"
        >
          ${escapeHtml(category)}
        </button>
      `;

    })
    .join("");


  document.querySelectorAll(".filter-btn").forEach((button) => {

    button.onclick = () => {

      state.category = button.dataset.cat;

      document
        .querySelectorAll(".filter-btn")
        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      renderTopics(
        $("#searchInput")?.value.trim() || ""
      );

    };

  });

}


// ======================================================
// FILTER + RENDER TOPICS
// ======================================================

function renderTopics(queryText = "") {

  let list = [...state.topics];


  // CATEGORY FILTER

  if (state.category !== "All") {

    list = list.filter(
      (topic) => topic.category === state.category
    );

  }


  // SEARCH FILTER

  if (queryText) {

    const search = queryText.toLowerCase();

    list = list.filter((topic) => {

      const searchableText = [

        topic.title,
        topic.description,
        topic.category,
        topic.type,

        ...(Array.isArray(topic.tags)
          ? topic.tags
          : [])

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      return searchableText.includes(search);

    });

  }


  const topicGrid = $("#topicGrid");

  if (!topicGrid) return;


  if (!list.length) {

    topicGrid.innerHTML = `
      <div class="empty">
        No topics found.
        Try another search or category.
      </div>
    `;

  } else {

    topicGrid.innerHTML = list
      .map(card)
      .join("");

  }


  // SEARCH RESULT MESSAGE

  const searchResults = $("#searchResults");

  if (searchResults) {

    if (queryText) {

      searchResults.hidden = false;

      searchResults.innerHTML = `
        Showing
        <strong>${list.length}</strong>
        result${list.length === 1 ? "" : "s"}
        for “${escapeHtml(queryText)}”
      `;

    } else {

      searchResults.hidden = true;

    }

  }


  // SAVE BUTTONS

  document
    .querySelectorAll(".save-btn")
    .forEach((button) => {

      button.onclick = () => {
        toggleSave(button.dataset.id);
      };

    });

}


// ======================================================
// TOPIC CARD
// ======================================================

function card(topic) {

  const isSaved = state.saved.has(topic.id);

  return `
    <article class="topic-card">

      <a
        href="topic.html?id=${encodeURIComponent(topic.id)}"
        style="text-decoration:none;color:inherit;display:block;"
      >

        <div class="topic-cover">

          <span class="topic-icon">
            ${escapeHtml(topic.icon || "Q")}
          </span>

          <span class="topic-type">
            ${escapeHtml(topic.type || "Topic")}
          </span>

        </div>

        <div class="topic-body">

          <h3>
            ${escapeHtml(topic.title)}
          </h3>

          <p>
            ${escapeHtml(topic.description)}
          </p>

          <div class="topic-meta">

            <span>
              ${escapeHtml(topic.category || "")}
              ·
              ${escapeHtml(topic.readTime || "")}
            </span>

          </div>

        </div>

      </a>

      <div style="padding:0 20px 20px;">

        <button
          class="save-btn"
          data-id="${escapeHtml(topic.id)}"
          aria-label="Save ${escapeHtml(topic.title)}"
          type="button"
        >
          ${isSaved ? "★" : "☆"}
        </button>

      </div>

    </article>
  `;
}


// ======================================================
// LEARNING PATHS
// ======================================================

function renderPaths() {

  const pathList = $("#pathList");

  if (!pathList) return;


  const picks = state.topics.slice(0, 4);


  if (!picks.length) {

    pathList.innerHTML = `
      <div class="empty">
        Learning paths will appear here
        when published topics are available.
      </div>
    `;

    return;

  }


  pathList.innerHTML = picks
    .map((topic, index) => {

      return `
        <a
          href="topic.html?id=${encodeURIComponent(topic.id)}"
          class="path-item"
          style="text-decoration:none;color:inherit;"
        >

          <div class="path-num">
            ${index + 1}
          </div>

          <div>

            <strong>
              ${escapeHtml(topic.title)}
            </strong>

            <span>
              ${escapeHtml(topic.category || "")}
              ·
              ${escapeHtml(topic.type || "")}
            </span>

          </div>

        </a>
      `;

    })
    .join("");

}


// ======================================================
// SAVED TOPICS
// ======================================================

function renderSaved() {

  const savedGrid = $("#savedGrid");

  if (!savedGrid) return;


  const items = state.topics.filter(
    (topic) => state.saved.has(topic.id)
  );


  if (!items.length) {

    savedGrid.innerHTML = `
      <div class="empty">
        Your saved topics will appear here.
        <br>
        Tap ☆ on any topic to keep it close.
      </div>
    `;

    return;

  }


  savedGrid.innerHTML = items
    .map(card)
    .join("");


  document
    .querySelectorAll("#savedGrid .save-btn")
    .forEach((button) => {

      button.onclick = () => {
        toggleSave(button.dataset.id);
      };

    });

}


// ======================================================
// SAVE / UNSAVE TOPIC
// ======================================================

function toggleSave(id) {

  if (state.saved.has(id)) {

    state.saved.delete(id);

  } else {

    state.saved.add(id);

  }


  localStorage.setItem(
    "quoriya-saved",
    JSON.stringify([...state.saved])
  );


  renderTopics(
    $("#searchInput")?.value.trim() || ""
  );

  renderSaved();

}


// ======================================================
// SEARCH + THEME + MENU
// ======================================================

function setupUI() {

  const input = $("#searchInput");

  const searchForm = $("#searchForm");

  const themeToggle = $("#themeToggle");

  const menuToggle = $("#menuToggle");

  const mobileMenu = $("#mobileMenu");


  // SEARCH

  if (searchForm) {

    searchForm.onsubmit = (event) => {

      event.preventDefault();

      renderTopics(
        input?.value.trim() || ""
      );

    };

  }


  if (input) {

    input.addEventListener("input", () => {

      renderTopics(
        input.value.trim()
      );

    });

  }


  // CTRL + K SEARCH

  document.addEventListener("keydown", (event) => {

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      input?.focus();

    }

  });


  // DARK MODE

  if (themeToggle) {

    themeToggle.onclick = () => {

      document.body.classList.toggle("dark");

      localStorage.setItem(
        "quoriya-theme",
        document.body.classList.contains("dark")
          ? "dark"
          : "light"
      );

    };

  }


  if (
    localStorage.getItem("quoriya-theme") === "dark"
  ) {

    document.body.classList.add("dark");

  }


  // MOBILE MENU

  if (menuToggle && mobileMenu) {

    menuToggle.onclick = () => {

      mobileMenu.classList.toggle("open");

    };

  }

}


// ======================================================
// INITIALIZE QUORIYA HOMEPAGE
// ======================================================

async function init() {

  try {

    await loadTopics();

    renderFilters();

    renderTopics();

    renderPaths();

    renderSaved();

    const year = $("#year");

    if (year) {
      year.textContent = new Date().getFullYear();
    }

    setupUI();

  } catch (error) {

    console.error(
      "Quoriya Firestore error:",
      error
    );


    const topicGrid = $("#topicGrid");

    if (topicGrid) {

      topicGrid.innerHTML = `
        <div class="empty">

          <strong>
            Could not load Quoriya content.
          </strong>

          <br><br>

          Check:

          <br>
          1. Firebase configuration
          <br>
          2. Firestore database
          <br>
          3. Firestore security rules
          <br>
          4. Published topics
          <br>
          5. Browser console for the exact error

        </div>
      `;

    }

  }

}


init();