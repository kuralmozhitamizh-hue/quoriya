import {
  db
} from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


const params =
  new URLSearchParams(location.search);

const id =
  params.get("id");

const preview =
  params.get("preview");

const reader =
  document.getElementById("reader");


const saved =
  new Set(
    JSON.parse(
      localStorage.getItem(
        "quoriya-saved"
      ) || "[]"
    )
  );


function saveState() {

  localStorage.setItem(
    "quoriya-saved",
    JSON.stringify([...saved])
  );

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/[&<>'"]/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[c]));

}


function sectionId(text, index) {

  return `${String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${index}`;

}


function blockHtml(block, index) {

  const id =
    sectionId(
      block.title,
      index
    );


  if (block.type === "text") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        ${
          (block.paragraphs || [])
            .map(
              paragraph =>
                `<p>${escapeHtml(paragraph)}</p>`
            )
            .join("")
        }

      </section>
    `;

  }


  if (block.type === "formula") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        <div class="callout formula-card">

          <code>
            ${escapeHtml(block.formula)}
          </code>

        </div>

        ${
          block.explanation
            ? `<p>${escapeHtml(block.explanation)}</p>`
            : ""
        }

      </section>
    `;

  }


  if (block.type === "note") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <div class="callout note">

          <h2>
            ${escapeHtml(block.title)}
          </h2>

          <p>
            ${escapeHtml(block.text)}
          </p>

        </div>

      </section>
    `;

  }


  if (block.type === "story") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        <div class="callout">

          ${
            (block.steps || [])
              .map(
                (step, i) => `
                  <p>

                    <strong>
                      ${i + 1}.
                      ${escapeHtml(step.title)}
                    </strong>

                    <br>

                    ${escapeHtml(step.text)}

                  </p>
                `
              )
              .join("")
          }

        </div>

      </section>
    `;

  }


  if (block.type === "problem") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        <div class="problem">

          <p>
            <strong>
              Problem
            </strong>
          </p>

          <p>
            ${escapeHtml(block.question)}
          </p>

          ${
            block.hint
              ? `
                <details class="hint">

                  <summary>
                    Show hint
                  </summary>

                  <p>
                    ${escapeHtml(block.hint)}
                  </p>

                </details>
              `
              : ""
          }

          ${
            block.solution
              ? `
                <details class="hint solution">

                  <summary>
                    Show solution
                  </summary>

                  <p>
                    ${escapeHtml(block.solution)}
                  </p>

                </details>
              `
              : ""
          }

        </div>

      </section>
    `;

  }


  if (block.type === "gallery") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        <div class="carousel">

          ${
            (block.items || [])
              .map(
                item => `
                  <div class="slide">

                    <img
                      src="${escapeHtml(item.src)}"
                      alt="${escapeHtml(item.alt)}"
                    >

                    <div class="slide-caption">

                      ${escapeHtml(item.caption)}

                    </div>

                  </div>
                `
              )
              .join("")
          }

        </div>

      </section>
    `;

  }


  if (block.type === "media") {

    return `
      <section
        class="reader-section"
        id="${id}"
      >

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        <div class="media-card">

          ${
            block.kind === "video"
              ? `
                <video
                  controls
                  preload="metadata"
                  src="${escapeHtml(block.src)}"
                ></video>
              `
              : `
                <audio
                  controls
                  preload="metadata"
                  src="${escapeHtml(block.src)}"
                ></audio>
              `
          }

          <p>
            ${escapeHtml(block.caption || "")}
          </p>

        </div>

      </section>
    `;

  }


  return "";

}


/* -----------------------------
   RENDER
----------------------------- */

function renderTopic(topic) {

  document.title =
    `${topic.title} — Quoriya`;


  const blocks =
    topic.blocks || [];


  const isSaved =
    saved.has(topic.id);


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
            ${escapeHtml(block.title)}
          </a>
        `
      )
      .join("");


  reader.innerHTML = `

    <div class="reader-top">

      <a
        class="back-link"
        href="index.html#explore"
      >
        ← Back to Explore
      </a>

      <button
        class="btn btn-ghost"
        id="saveTopic"
      >
        ${
          isSaved
            ? "★ Saved"
            : "☆ Save topic"
        }
      </button>

    </div>


    <section class="reader-hero">

      <div class="reader-kicker">

        ${escapeHtml(topic.category)}
        ·
        ${escapeHtml(topic.type)}
        ·
        ${escapeHtml(topic.readTime)}

      </div>


      <h1 class="reader-title">

        ${escapeHtml(topic.title)}

      </h1>


      <p class="reader-summary">

        ${escapeHtml(topic.description)}

      </p>


      <div class="reader-actions">

        <a
          class="btn btn-primary"
          href="#${blocks.length ? sectionId(blocks[0].title, 0) : ""}"
        >
          Start learning →
        </a>

      </div>

    </section>


    <div class="reader-layout">

      <aside class="toc">

        <strong>
          On this page
        </strong>

        ${toc}

      </aside>


      <div class="content-stack">

        ${
          blocks
            .map(blockHtml)
            .join("")
        }

      </div>

    </div>

  `;


  document
    .getElementById("saveTopic")
    .onclick = () => {

      if (saved.has(topic.id)) {

        saved.delete(topic.id);

      } else {

        saved.add(topic.id);

      }

      saveState();

      document
        .getElementById("saveTopic")
        .textContent =
          saved.has(topic.id)
            ? "★ Saved"
            : "☆ Save topic";

    };

}


/* -----------------------------
   LOAD
----------------------------- */

async function loadTopic() {

  try {

    let topic;


    /*
      Preview generated by Content Studio
    */

    if (preview) {

      topic =
        JSON.parse(
          decodeURIComponent(preview)
        );

    } else {

      if (!id) {

        throw new Error(
          "No topic ID."
        );

      }


      const q =
        query(
          collection(db, "topics"),
          where(
            "id",
            "==",
            id
          ),
          where(
            "status",
            "==",
            "published"
          )
        );


      const snapshot =
        await getDocs(q);


      if (snapshot.empty) {

        throw new Error(
          "Topic not found."
        );

      }


      topic =
        snapshot.docs[0].data();

    }


    renderTopic(topic);

  } catch (error) {

    console.error(error);

    reader.innerHTML = `

      <div class="reader-error">

        <h1>
          Topic not found
        </h1>

        <p>
          This topic does not exist
          or has not been published.
        </p>

        <a
          class="btn btn-primary"
          href="index.html#explore"
        >
          Back to Explore
        </a>

      </div>

    `;

  }

}


loadTopic();