const params =
  new URLSearchParams(location.search);

const id =
  params.get('id');

const reader =
  document.getElementById('reader');


const STORAGE = {
  saved: 'quoriya-saved',
  recent: 'quoriya-recent',
  progress: 'quoriya-progress',
  theme: 'quoriya-theme'
};


const saved =
  new Set(
    JSON.parse(
      localStorage.getItem(
        STORAGE.saved
      ) || '[]'
    )
  );


const escapeHtml =
  value =>
    String(value ?? '')
      .replace(
        /[&<>'"]/g,
        c => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[c])
      );


function readJSON(key, fallback) {

  try {

    return JSON.parse(
      localStorage.getItem(key) ||
      JSON.stringify(fallback)
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


/* =========================
   COMMON UI
========================= */

function setupCommonUI() {

  const year =
    document.getElementById('year');

  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  const input =
    document.getElementById(
      'searchInput'
    );


  const form =
    document.getElementById(
      'searchForm'
    );


  if (form && input) {

    form.addEventListener(
      'submit',
      event => {

        event.preventDefault();

        if (!input.value.trim()) {
          return;
        }

        location.href =
          `index.html?search=${encodeURIComponent(
            input.value.trim()
          )}#explore`;

      }
    );


    document.addEventListener(
      'keydown',
      event => {

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() === 'k'
        ) {

          event.preventDefault();

          input.focus();

        }

      }
    );

  }


  const themeToggle =
    document.getElementById(
      'themeToggle'
    );


  if (themeToggle) {

    themeToggle.onclick = () => {

      document.body.classList.toggle(
        'dark'
      );

      localStorage.setItem(
        STORAGE.theme,
        document.body.classList.contains(
          'dark'
        )
          ? 'dark'
          : 'light'
      );

    };

  }


  if (
    localStorage.getItem(
      STORAGE.theme
    ) === 'dark'
  ) {

    document.body.classList.add(
      'dark'
    );

  }


  const menuToggle =
    document.getElementById(
      'menuToggle'
    );


  const mobileMenu =
    document.getElementById(
      'mobileMenu'
    );


  if (menuToggle && mobileMenu) {

    menuToggle.onclick = () => {

      mobileMenu.classList.toggle(
        'open'
      );

    };

  }

}


/* =========================
   RECENTLY VIEWED
========================= */

function rememberRecentlyViewed(
  topicId
) {

  let recent =
    readJSON(
      STORAGE.recent,
      []
    );


  recent =
    recent.filter(
      id => id !== topicId
    );


  recent.unshift(topicId);


  recent =
    recent.slice(0, 12);


  writeJSON(
    STORAGE.recent,
    recent
  );

}


/* =========================
   PROGRESS
========================= */

function getProgress(topicId) {

  const progress =
    readJSON(
      STORAGE.progress,
      {}
    );


  return Number(
    progress[topicId] || 0
  );

}


function saveProgress(
  topicId,
  percentage
) {

  const progress =
    readJSON(
      STORAGE.progress,
      {}
    );


  progress[topicId] =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          percentage
        )
      )
    );


  writeJSON(
    STORAGE.progress,
    progress
  );

}


/* =========================
   PROGRESS TRACKING
========================= */

function setupProgressTracking(
  topic
) {

  const sections =
    [
      ...reader.querySelectorAll(
        '.reader-section'
      )
    ];


  if (!sections.length) {
    return;
  }


  const total =
    sections.length;


  const progress =
    getProgress(topic.id);


  const progressBar =
    document.getElementById(
      'topicProgressBar'
    );


  const progressText =
    document.getElementById(
      'topicProgressText'
    );


  let highest =
    Math.round(
      (progress / 100) *
      total
    );


  function update() {

    const percentage =
      Math.round(
        (highest / total) *
        100
      );


    saveProgress(
      topic.id,
      percentage
    );


    if (progressBar) {

      progressBar.style.width =
        `${percentage}%`;

    }


    if (progressText) {

      progressText.textContent =
        `${percentage}% complete`;

    }

  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              const index =
                sections.indexOf(
                  entry.target
                );


              if (
                index + 1 >
                highest
              ) {

                highest =
                  index + 1;

                update();

              }

            }

          }
        );

      },
      {
        threshold: 0.35
      }
    );


  sections.forEach(
    section =>
      observer.observe(section)
  );


  update();

}


/* =========================
   SECTION ID
========================= */

function sectionId(
  text,
  index
) {

  return `${String(text)
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-|-$/g,
      ''
    )}-${index}`;

}


/* =========================
   CONTENT BLOCKS
========================= */

function blockHtml(
  block,
  index
) {

  const type =
    block.type;


  if (type === 'text') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        ${(block.paragraphs || [])
          .map(
            paragraph =>
              `<p>${escapeHtml(
                paragraph
              )}</p>`
          )
          .join('')}

      </section>
    `;

  }


  if (type === 'formula') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        <div
          class="callout formula-card"
        >

          <code>
            ${escapeHtml(
              block.formula
            )}
          </code>

        </div>

        ${
          block.explanation
            ? `<p>${escapeHtml(
                block.explanation
              )}</p>`
            : ''
        }

      </section>
    `;

  }


  if (type === 'note') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <div class="callout note">

          <h2>
            ${escapeHtml(
              block.title
            )}
          </h2>

          <p>
            ${escapeHtml(
              block.text
            )}
          </p>

        </div>

      </section>
    `;

  }


  if (type === 'story') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        <div class="callout">

          ${(block.steps || [])
            .map(
              (step, i) => `
                <p>

                  <strong>
                    ${i + 1}.
                    ${escapeHtml(
                      step.title
                    )}
                  </strong>

                  <br>

                  ${escapeHtml(
                    step.text
                  )}

                </p>
              `
            )
            .join('')}

        </div>

      </section>
    `;

  }


  if (type === 'problem') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        <div class="problem">

          <p>
            <strong>
              Problem
            </strong>
          </p>

          <p>
            ${escapeHtml(
              block.question
            )}
          </p>

          ${
            block.hint
              ? `
                <details class="hint">

                  <summary>
                    Show hint
                  </summary>

                  <p>
                    ${escapeHtml(
                      block.hint
                    )}
                  </p>

                </details>
              `
              : ''
          }

          ${
            block.solution
              ? `
                <details
                  class="hint solution"
                >

                  <summary>
                    Show solution
                  </summary>

                  <p>
                    ${escapeHtml(
                      block.solution
                    )}
                  </p>

                </details>
              `
              : ''
          }

        </div>

      </section>
    `;

  }


  if (type === 'gallery') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        <div
          class="carousel"
          data-carousel
        >

          <div class="carousel-track">

            ${(block.items || [])
              .map(
                item => `
                  <div class="slide">

                    <img
                      src="${escapeHtml(
                        item.src
                      )}"
                      alt="${escapeHtml(
                        item.alt || ''
                      )}"
                    >

                    <div class="slide-caption">
                      ${escapeHtml(
                        item.caption || ''
                      )}
                    </div>

                  </div>
                `
              )
              .join('')}

          </div>

          <div class="carousel-controls">

            <button
              class="btn btn-ghost prev"
              type="button"
            >
              ← Previous
            </button>

            <span class="slide-count">
              1 /
              ${
                (block.items || [])
                  .length
              }
            </span>

            <button
              class="btn btn-ghost next"
              type="button"
            >
              Next →
            </button>

          </div>

        </div>

      </section>
    `;

  }


  if (type === 'media') {

    return `
      <section
        class="reader-section"
        id="${sectionId(
          block.title,
          index
        )}"
      >

        <h2>
          ${escapeHtml(
            block.title
          )}
        </h2>

        <div class="media-card">

          ${
            block.kind === 'video' &&
            block.src

              ? `
                <video
                  controls
                  preload="metadata"
                  src="${escapeHtml(
                    block.src
                  )}"
                ></video>
              `

              : block.kind === 'audio' &&
                block.src

              ? `
                <audio
                  controls
                  preload="metadata"
                  src="${escapeHtml(
                    block.src
                  )}"
                ></audio>
              `

              : `
                <div
                  class="media-placeholder"
                >
                  Add a
                  ${escapeHtml(
                    block.kind ||
                    'media'
                  )}
                  file in your content data.
                </div>
              `
          }

          ${
            block.caption
              ? `<p>${escapeHtml(
                  block.caption
                )}</p>`
              : ''
          }

        </div>

      </section>
    `;

  }


  return '';

}


/* =========================
   CAROUSELS
========================= */

function setupCarousels() {

  document
    .querySelectorAll(
      '[data-carousel]'
    )
    .forEach(carousel => {

      const track =
        carousel.querySelector(
          '.carousel-track'
        );


      const slides =
        carousel.querySelectorAll(
          '.slide'
        );


      if (!slides.length) {
        return;
      }


      let index = 0;


      const count =
        carousel.querySelector(
          '.slide-count'
        );


      const update = () => {

        track.style.transform =
          `translateX(-${index * 100}%)`;


        if (count) {

          count.textContent =
            `${index + 1} / ${slides.length}`;

        }

      };


      carousel
        .querySelector('.prev')
        .onclick = () => {

          index =
            (index - 1 + slides.length) %
            slides.length;

          update();

        };


      carousel
        .querySelector('.next')
        .onclick = () => {

          index =
            (index + 1) %
            slides.length;

          update();

        };

    });

}


/* =========================
   SHARE
========================= */

async function shareTopic(topic) {

  const url =
    location.href;


  const shareData = {

    title:
      `${topic.title} — Quoriya`,

    text:
      topic.description ||
      `Learn ${topic.title} on Quoriya.`,

    url

  };


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        shareData
      );

      return;

    }


    await navigator.clipboard.writeText(
      url
    );


    alert(
      'Topic link copied!'
    );

  } catch (error) {

    console.log(
      'Share cancelled or unavailable.',
      error
    );

  }

}


/* =========================
   SAVE BUTTON
========================= */

function setupSave(topic) {

  const button =
    document.getElementById(
      'saveTopic'
    );


  if (!button) return;


  function update() {

    button.textContent =
      saved.has(topic.id)
        ? '★ Saved'
        : '☆ Save topic';

  }


  button.onclick = () => {

    if (
      saved.has(topic.id)
    ) {

      saved.delete(
        topic.id
      );

    } else {

      saved.add(
        topic.id
      );

    }


    writeJSON(
      STORAGE.saved,
      [...saved]
    );


    update();

  };


  update();

}


/* =========================
   RENDER TOPIC
========================= */

function render(
  topic,
  allTopics
) {

  document.title =
    `${topic.title} — Quoriya`;


  rememberRecentlyViewed(
    topic.id
  );


  const blocks =
    topic.blocks || [];


  const toc =
    blocks
      .map(
        (block, index) => `
          <a
            href="#${sectionId(
              block.title,
              index
            )}"
          >
            ${escapeHtml(
              block.title
            )}
          </a>
        `
      )
      .join('');


  const related =
    (topic.related || [])
      .map(
        relatedId =>
          allTopics.find(
            t =>
              t.id === relatedId
          )
      )
      .filter(Boolean);


  const currentProgress =
    getProgress(
      topic.id
    );


  reader.innerHTML = `

    <div class="reader-top">

      <a
        class="back-link"
        href="index.html#explore"
      >
        ← Back to Explore
      </a>


      <div class="reader-top-actions">

        <button
          class="btn btn-ghost"
          id="shareTopic"
          type="button"
        >
          ↗ Share
        </button>


        <button
          class="btn btn-ghost"
          id="printTopic"
          type="button"
        >
          🖨 Print
        </button>


        <button
          class="btn btn-ghost"
          id="saveTopic"
          type="button"
        >
          ☆ Save topic
        </button>

      </div>

    </div>


    <section class="reader-hero">

      <div class="reader-kicker">
        ${escapeHtml(
          topic.category
        )}
        ·
        ${escapeHtml(
          topic.type
        )}
        ·
        ${escapeHtml(
          topic.readTime
        )}
      </div>


      <h1 class="reader-title">
        ${escapeHtml(
          topic.title
        )}
      </h1>


      <p class="reader-summary">
        ${escapeHtml(
          topic.description
        )}
      </p>


      <div class="reader-actions">

        <a
          class="btn btn-primary"
          href="#${
            blocks.length
              ? sectionId(
                  blocks[0].title,
                  0
                )
              : ''
          }"
        >
          Continue learning →
        </a>

      </div>


      <div
        class="topic-progress"
        aria-label="Learning progress"
      >

        <div class="progress-card-header">

          <strong>
            Your progress
          </strong>

          <span
            id="topicProgressText"
          >
            ${currentProgress}% complete
          </span>

        </div>


        <div class="progress-bar">

          <span
            id="topicProgressBar"
            style="width:${currentProgress}%"
          ></span>

        </div>

      </div>

    </section>


    <div class="reader-layout">

      <aside class="toc">

        <strong>
          On this page
        </strong>

        ${
          toc ||
          '<span class="muted">Content coming soon.</span>'
        }

      </aside>


      <div class="content-stack">

        ${blocks
          .map(
            (block, index) =>
              blockHtml(
                block,
                index
              )
          )
          .join('')}


        ${
          related.length
            ? `

              <section
                class="reader-section"
              >

                <h2>
                  Related topics
                </h2>

                <div
                  class="related-grid"
                >

                  ${related
                    .map(
                      topic => `

                        <a
                          class="related-card"
                          href="topic.html?id=${encodeURIComponent(
                            topic.id
                          )}"
                        >

                          <strong>
                            ${escapeHtml(
                              topic.title
                            )}
                          </strong>

                          <span>
                            ${escapeHtml(
                              topic.category
                            )}
                            ·
                            ${escapeHtml(
                              topic.type
                            )}
                          </span>

                        </a>

                      `
                    )
                    .join('')}

                </div>

              </section>

            `
            : ''
        }

      </div>

    </div>

  `;


  setupSave(topic);


  document
    .getElementById(
      'shareTopic'
    )
    .onclick =
      () => shareTopic(topic);


  document
    .getElementById(
      'printTopic'
    )
    .onclick =
      () => window.print();


  setupCarousels();


  setupProgressTracking(
    topic
  );


  /* Deep-link section 