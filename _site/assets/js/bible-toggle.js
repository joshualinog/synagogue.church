// Client-side Bible version toggle (build-time rendering path)
(function () {
  function findContainer() {
    return document.querySelector(".bible-passages");
  }

  function buildButtons() {
    const wrapper = document.createElement("div");
    wrapper.className = "bible-version-switcher mb-4";
    [
      { id: "leb", label: "LEB", primary: true },
      { id: "nirv", label: "NIRV", primary: false },
      { id: "interlinear", label: "INTERLINEAR", primary: false },
    ].forEach((spec) => {
      const btn = document.createElement("button");
      btn.textContent = spec.label;
      btn.dataset.version = spec.id;
      btn.className =
        spec.primary
          ? "px-3 py-1 rounded bg-gray-900 text-white mr-2"
          : "px-3 py-1 rounded bg-white text-gray-900 border mr-2";
      wrapper.appendChild(btn);
    });
    return wrapper;
  }

  function setActiveVersion(container, version) {
    container.querySelectorAll(".bible-block").forEach((block) => {
      const lebEl = block.querySelector(".version.leb");
      const nirvEl = block.querySelector(".version.nirv");
      const interlinearEl = block.querySelector(".version.interlinear");
      if (lebEl) {
        lebEl.classList.toggle("hidden", version !== "leb");
        lebEl.setAttribute("aria-hidden", version !== "leb");
      }
      if (nirvEl) {
        nirvEl.classList.toggle("hidden", version !== "nirv");
        nirvEl.setAttribute("aria-hidden", version !== "nirv");
      }
      if (interlinearEl) {
        interlinearEl.classList.toggle("hidden", version !== "interlinear");
        interlinearEl.setAttribute("aria-hidden", version !== "interlinear");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const container = findContainer();
    if (!container) return;
    let buttons = container.parentNode.querySelector('.bible-version-switcher');
    if (!buttons) {
      buttons = buildButtons();
      container.parentNode.insertBefore(buttons, container);
    }

    // Initialize: show LEB by default
    setActiveVersion(container, "leb");
    buttons.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.version === 'leb' ? 'true' : 'false');
    });

    buttons.addEventListener("click", function (e) {
      if (!(e.target && e.target.dataset && e.target.dataset.version)) return;
      const ver = e.target.dataset.version;

      buttons.querySelectorAll("button").forEach((b) => {
        const active = b.dataset && b.dataset.version === ver;
        if (active) {
          b.classList.remove("bg-white", "text-gray-900", "border");
          b.classList.add("bg-gray-900", "text-white");
          b.setAttribute('aria-pressed', 'true');
        } else {
          b.classList.remove("bg-gray-900", "text-white");
          b.classList.add("bg-white", "text-gray-900", "border");
          b.setAttribute('aria-pressed', 'false');
        }
      });

      setActiveVersion(container, ver);
    });
  });
})();

