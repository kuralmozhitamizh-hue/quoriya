const STORAGE = {
  saved: 'quoriya-saved',
  recent: 'quoriya-recent',
  progress: 'quoriya-progress',
  theme: 'quoriya-theme'
};


let allTopics = [];
let currentCategory = 'All';


function readJSON(key, fallback) {
  try {
    return JSON.parse(
      localStorage.getItem(key) || JSON.stringify(fallback)
    );
  } catch {
    return fallback;
  }
}


function writeJSON(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/[&<>'"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c]));
}


/* =========================
   COMMON UI
========================= */

function setupCommonUI() {

  const year = document.getElementById('year');

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }


  const searchForm =
    document.getElementById('searchForm');

  const searchInput =
    document.getElementById('searchInput');


  if (searchForm && searchInput) {

    searchForm.addEventListener(
      'submit',
      event => {

        event.preventDefault();

        const query =
          searchInput.value.trim();

        if (!query) return;

        location.href =
          `index.html?search=${encodeURIComponent(query)}#explore`;

      }
    );


    document.addEventListener(
      'keydown',
      event => {

        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'k'
        ) {

          event.preventDefault();

          searchInput.focus();

        }

      }
    );

  }


  const themeToggle =
    document.getElementById('themeToggle');


  if (themeToggle) {

    themeToggle.onclick = () => {

      document.body.classList.toggle('dark');

      localStorage.setItem(
        STORAGE.theme,
        document.body.classList.contains('dark')
          ? 'dark'
          : 'light'
      );

    };

  }


  if (
    localStorage.getItem(STORAGE.theme) === 'dark'
  ) {

    document.body.classList.add('dark');

  }


  const menuToggle =
    document.getElementById('menuToggle');

  const mobileMenu =
    document.getElementById('mobileMenu');


  if (menuToggle && mobileMenu) {

    menuToggle.onclick = () => {

      mobileMenu.classList.toggle('open');

      mobileMenu.setAttribute(
        'aria-hidden',
        mobileMenu.classList.contains('open')
          ? 'false'
          : 'true'
      );

    };

  }

}


/* =========================
   TOPIC CARD
========================= */

function topicCard(topic) {

  const saved =
    new Set(
      readJSON(STORAGE.saved, [])
    );


  const isSaved =
    saved.has(topic.id);


  return `

    <article class="topic-card">

      <div class="topic-card-top">

        <span class="topic-type">
          ${escapeHtml(topic.type || 'Guide')}
        </span>

        <button
          class="bookmark-btn"
          type="button"
          data-bookmark="${escapeHtml(topic.id)}"
          aria-label="Save topic"
        >
          ${isSaved ? '★' : '☆'}
        </button>

      </div>


      <a
        class="topic-card-link"
        href="topic.html?id=${encodeURIComponent(topic.id)}"
      >

        <span class="topic-category">
          ${escapeHtml(topic.category || '')}
        </span>

        <h3>
          ${escapeHtml(topic.title)}
        </h3>

        <p>
          ${escapeHtml(topic.description || '')}
        </p>

        <span class="topic-meta">
          ${escapeHtml(topic.readTime || '')}
        </span>

      </a>

    </article>

  `;

}


/* =========================
   BOOKMARKS
========================= */

function setupBookmarkButtons() {

  document
    .querySelectorAll('[data-bookmark]')
    .forEach(button => {

      button.onclick = event => {

        event.preventDefault();
        event.stopPropagation();


        const id =
          button.dataset.bookmark;


        const saved =
          new Set(
            readJSON(STORAGE.saved, [])
          );


        if (saved.has(id)) {

          saved.delete(id);

        } else {

          saved.add(id);

        }


        writeJSON(
          STORAGE.saved,
          [...saved]
        );


        renderTopics();
        renderSaved();
        renderRecent();
        renderProgress();

      };

    });

}


/* =========================
   EXPLORE
========================= */

function renderTopics() {

  const grid =
    document.getElementById('topicGrid');

  if (!grid) return;


  let topics =
    [...allTopics];


  if (currentCategory !== 'All') {

    topics =
      topics.filter(
        topic =>
          topic.category === currentCategory
      );

  }


  const params =
    new URLSearchParams(location.search);

  const query =
    params.get('search');


  if (query) {

    const q =
      query.toLowerCase();


    topics =
      topics.filter(topic => {

        const text = [

          topic.title,

          topic.description,

          topic.category,

          topic.type,

          ...(topic.tags || [])

        ]
          .join(' ')
          .toLowerCase();


        return text.includes(q);

      });


    const results =
      document.getElementById(
        'searchResults'
      );


    if (results) {

      results.hidden = false;

      results.innerHTML = `
        <div class="search-result-summary">
          Search results for
          <strong>
            ${escapeHtml(query)}
          </strong>
          — ${topics.length} found
        </div>
      `;

    }

  }


  if (!topics.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>No topics found.</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    topics
      .map(topicCard)
      .join('');


  setupBookmarkButtons();

}


/* =========================
   CATEGORY FILTERS
========================= */

function renderCategories() {

  const container =
    document.getElementById(
      'categoryFilters'
    );

  if (!container) return;


  const categories = [
    'All',
    ...new Set(
      allTopics
        .map(topic => topic.category)
        .filter(Boolean)
    )
  ];


  container.innerHTML =
    categories
      .map(category => `
        <button
          type="button"
          class="filter-chip ${
            category === currentCategory
              ? 'active'
              : ''
          }"
          data-category="${escapeHtml(category)}"
        >
          ${escapeHtml(category)}
        </button>
      `)
      .join('');


  container
    .querySelectorAll('[data-category]')
    .forEach(button => {

      button.onclick = () => {

        currentCategory =
          button.dataset.category;

        renderCategories();
        renderTopics();

      };

    });

}


/* =========================
   RECENTLY VIEWED
========================= */

function renderRecent() {

  const grid =
    document.getElementById(
      'recentGrid'
    );

  if (!grid) return;


  const recent =
    readJSON(
      STORAGE.recent,
      []
    );


  const topics =
    recent
      .map(id =>
        allTopics.find(
          topic => topic.id === id
        )
      )
      .filter(Boolean);


  if (!topics.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>No recently viewed topics.</h3>
        <p>
          Open a topic and it will appear here.
        </p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    topics
      .slice(0, 8)
      .map(topicCard)
      .join('');


  setupBookmarkButtons();

}


/* =========================
   PROGRESS
========================= */

function getProgress(id) {

  const progress =
    readJSON(
      STORAGE.progress,
      {}
    );


  return Number(
    progress[id] || 0
  );

}


function renderProgress() {

  const grid =
    document.getElementById(
      'progressGrid'
    );

  if (!grid) return;


  const progress =
    readJSON(
      STORAGE.progress,
      {}
    );


  const entries =
    Object.entries(progress)
      .filter(
        ([id, value]) =>
          Number(value) > 0
      )
      .map(([id, value]) => {

        const topic =
          allTopics.find(
            t => t.id === id
          );

        return {
          topic,
          value: Number(value)
        };

      })
      .filter(item => item.topic);


  if (!entries.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>No progress yet.</h3>
        <p>
          Start reading a topic to begin tracking progress.
        </p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    entries
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .map(item => `

        <article class="progress-card">

          <div class="progress-card-header">

            <a
              href="topic.html?id=${encodeURIComponent(item.topic.id)}"
            >
              ${escapeHtml(item.topic.title)}
            </a>

            <strong>
              ${item.value}%
            </strong>

          </div>

          <div class="progress-bar">

            <span
              style="width:${item.value}%"
            ></span>

          </div>

          <p>
            ${escapeHtml(
              item.topic.category || ''
            )}
          </p>

        </article>

      `)
      .join('');

}


/* =========================
   SAVED
========================= */

function renderSaved() {

  const grid =
    document.getElementById(
      'savedGrid'
    );

  if (!grid) return;


  const saved =
    readJSON(
      STORAGE.saved,
      []
    );


  const topics =
    saved
      .map(id =>
        allTopics.find(
          topic => topic.id === id
        )
      )
      .filter(Boolean);


  if (!topics.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>Your saved topics will appear here.</h3>
        <p>
          Tap ☆ on a topic to keep it close.
        </p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    topics
      .map(topicCard)
      .join('');


  setupBookmarkButtons();

}


/* =========================
   LEARNING PATHS
========================= */

async function renderPaths() {

  const container =
    document.getElementById(
      'pathList'
    );

  if (!container) return;


  try {

    const response =
      await fetch('data/paths.json');


    if (!response.ok) {
      throw new Error('paths unavailable');
    }


    const data =
      await response.json();


    const paths =
      data.paths || [];


    if (!paths.length) {

      container.innerHTML = `
        <div class="empty-state">
          <p>No learning paths yet.</p>
        </div>
      `;

      return;

    }


    container.innerHTML =
      paths
        .map(path => `

          <article class="learning-path">

            <span class="path-number">
              ${escapeHtml(
                path.number || ''
              )}
            </span>

            <div>

              <h3>
                ${escapeHtml(path.title)}
              </h3>

              <p>
                ${escapeHtml(
                  path.description || ''
                )}
              </p>

              <div class="path-topics">

                ${(path.topics || [])
                  .map((id, index) => {

                    const topic =
                      allTopics.find(
                        t => t.id === id
                      );

                    if (!topic) {
                      return '';
                    }


                    return `
                      <a
                        href="topic.html?id=${encodeURIComponent(topic.id)}"
                        class="path-topic"
                      >
                        ${index + 1}.
                        ${escapeHtml(topic.title)}
                      </a>
                    `;

                  })
                  .join('')}

              </div>

            </div>

          </article>

        `)
        .join('');

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <p>
          Learning paths could not be loaded.
        </p>
      </div>
    `;

  }

}


/* =========================
   INITIALIZE
========================= */

async function init() {

  setupCommonUI();


  try {

    const response =
      await fetch(
        'data/topics.json'
      );


    if (!response.ok) {
      throw new Error(
        'Content file unavailable'
      );
    }


    const data =
      await response.json();


    allTopics =
      Array.isArray(data.topics)
        ? data.topics
        : [];


    renderCategories();
    renderTopics();
    renderRecent();
    renderProgress();
    renderSaved();

    await renderPaths();


  } catch (error) {

    console.error(error);


    const grid =
      document.getElementById(
        'topicGrid'
      );


    if (grid) {

      grid.innerHTML = `
        <div class="empty-state">
          <h3>Could not load Quoriya content.</h3>
          <p>
            Check that data/topics.json exists.
          </p>
        </div>
      `;

    }

  }

}


init();