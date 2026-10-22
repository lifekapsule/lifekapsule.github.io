/* ============================================================
   Diamond Capsule of Life — landing behaviour
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- starfield ---------- */
  function starfield() {
    const canvas = $("#stars");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, stars = [], raf = null;
    let mx = 0, my = 0;

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.25 + 0.25,
        a: Math.random() * 0.55 + 0.15,
        tw: Math.random() * 0.02 + 0.004,
        ph: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.6 + 0.2,
      }));
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? 1 : 0.72 + 0.28 * Math.sin(t * s.tw + s.ph);
        const x = s.x + mx * 18 * s.depth;
        const y = s.y + my * 18 * s.depth;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(190,225,255," + (s.a * tw).toFixed(3) + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    build();
    if (reduce) {
      frame(0);
    } else {
      raf = requestAnimationFrame(frame);
      window.addEventListener("pointermove", (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * -1;
        my = (e.clientY / window.innerHeight - 0.5) * -1;
      }, { passive: true });
    }

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        build();
        raf = requestAnimationFrame(frame);
      }, 180);
    });
  }

  /* ---------- header ---------- */
  function header() {
    const el = $(".site-header");
    const onScroll = () => el.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  function menu() {
    const burger = $("#burger");
    const nav = $("#nav");
    if (!burger || !nav) return;
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- toast ---------- */
  function toast(text) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3400);
  }

  /* ---------- join form ---------- */
  function join() {
    const form = $("#joinForm");
    if (!form) return;
    const name = $("#jName");
    const email = $("#jEmail");
    const err = $("#jError");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      err.hidden = true;

      if (name.value.trim().length < 2) {
        err.textContent = "Please tell us your name.";
        err.hidden = false;
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        err.textContent = "That email does not look right.";
        err.hidden = false;
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "You are on the list ✓";
      toast("Thank you — the mission list is a demo, but the idea is real.");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    starfield();
    header();
    menu();
    join();
  });
})();

