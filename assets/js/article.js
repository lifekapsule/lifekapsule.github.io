/* Longread — progress bar and table of contents scroll-spy */
(function () {
  "use strict";

  const bar = document.getElementById("bar");
  const links = Array.from(document.querySelectorAll(".art-toc a"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function progress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (bar) bar.style.width = Math.min(100, Math.max(0, p * 100)) + "%";
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        progress();
        spy();
        ticking = false;
      });
    },
    { passive: true }
  );

  function spy() {
    if (!sections.length) return;
    const line = window.scrollY + 140;
    let current = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= line) current = s;
    }
    links.forEach((a) =>
      a.classList.toggle("on", a.getAttribute("href") === "#" + current.id)
    );
  }

  progress();
  spy();
})();
