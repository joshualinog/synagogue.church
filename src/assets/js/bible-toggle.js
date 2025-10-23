// Client-side Bible version toggle
(function () {
  function findContainer() {
    return document.querySelector(".bible-passages");
  }

  function buildButtons(slug) {
    const wrapper = document.createElement("div");
    wrapper.className = "bible-version-switcher mb-4";
    const leb = document.createElement("button");
    leb.textContent = "LEB";
    leb.dataset.version = "leb";
    leb.className = "leb-btn px-3 py-1 rounded bg-gray-900 text-white mr-2";
    const nirv = document.createElement("button");
    nirv.textContent = "NIRV";
    nirv.dataset.version = "nirv";
    nirv.className =
      "nirv-btn px-3 py-1 rounded bg-white text-gray-900 border mr-2";
    wrapper.appendChild(leb);
    wrapper.appendChild(nirv);
    return wrapper;
  }

  function renderVerses(block, verses) {
    if (!verses || !verses.length) {
      block.innerHTML =
        '<div class="text-sm text-gray-600">No passage available.</div>';
      return;
    }
    block.innerHTML = verses
      .map(
        (v) =>
          `<div class="verse"><span class="verse-num font-bold">${v.chapter}:${v.verse}</span> <span class="verse-text">${v.text}</span></div>`
      )
      .join("");
  }

  async function loadAndApplyVersion(slug, version) {
    try {
      const url = `/assets/bible/per-reading/${slug}.json`;
      const resp = await fetch(url);
      if (!resp.ok)
        return console.warn("Failed to fetch per-reading JSON", url);
      const data = await resp.json();
      const torahBlock = document.querySelector(
        '.bible-block[data-section="torah"]'
      );
      const gospelBlock = document.querySelector(
        '.bible-block[data-section="gospel"]'
      );
      if (
        torahBlock &&
        data.torah &&
        data.torah.versions &&
        data.torah.versions[version]
      ) {
        renderVerses(torahBlock, data.torah.versions[version]);
      }
      if (
        gospelBlock &&
        data.gospel &&
        data.gospel.versions &&
        data.gospel.versions[version]
      ) {
        renderVerses(gospelBlock, data.gospel.versions[version]);
      }
    } catch (e) {
      console.warn("Error loading version", e);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const container = findContainer();
    if (!container) return;
    const slug = container.dataset.slug;
    // insert buttons before container
    const buttons = buildButtons(slug);
    container.parentNode.insertBefore(buttons, container);
    // Save the original server-rendered HTML so we can restore LEB when toggling back
    const torahBlock = document.querySelector(
      '.bible-block[data-section="torah"]'
    );
    const gospelBlock = document.querySelector(
      '.bible-block[data-section="gospel"]'
    );
    const original = {
      torah: torahBlock ? torahBlock.innerHTML : null,
      gospel: gospelBlock ? gospelBlock.innerHTML : null,
    };

    buttons.addEventListener("click", function (e) {
      if (!(e.target && e.target.dataset && e.target.dataset.version)) return;
      const ver = e.target.dataset.version;

      // Update button classes (active button gets dark bg)
      buttons.querySelectorAll("button").forEach((b) => {
        if (b.dataset && b.dataset.version === ver) {
          b.classList.remove("bg-white", "text-gray-900", "border");
          b.classList.add("bg-gray-900", "text-white");
        } else {
          b.classList.remove("bg-gray-900", "text-white");
          b.classList.add("bg-white", "text-gray-900", "border");
        }
      });

      if (ver === "leb") {
        // restore original server-rendered LEB HTML
        if (torahBlock && original.torah !== null)
          torahBlock.innerHTML = original.torah;
        if (gospelBlock && original.gospel !== null)
          gospelBlock.innerHTML = original.gospel;
        return;
      }

      // Load and render the requested version (e.g., nirv)
      loadAndApplyVersion(slug, ver);
    });
  });
})();
