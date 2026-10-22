/* ============================================================
   Life Kapsule — логика демо-проекта
   ============================================================ */
(function () {
  "use strict";

  const PRICES = { Solo: 1490, Duo: 2190, Family: 2990 };
  const STORE = "lk_bookings";
  const PAGE = document.body.dataset.page;

  /* ---------- утилиты ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const iso = (d) => d.toISOString().slice(0, 10);
  const parse = (s) => new Date(s + "T00:00:00");
  const days = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const rub = (n) => n.toLocaleString("ru-RU") + " ₽";

  const humanDate = (s) =>
    parse(s).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  function readStore() {
    try {
      const raw = localStorage.getItem(STORE);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeStore(list) {
    try {
      localStorage.setItem(STORE, JSON.stringify(list));
    } catch (e) {
      /* приватный режим — молча игнорируем */
    }
  }

  function toast(text) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- мобильное меню ---------- */
  function initMenu() {
    const burger = $("#burger");
    const nav = $("#nav");
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });

    $$("a", nav).forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ============================================================
     ЛЕНДИНГ: форма бронирования
     ============================================================ */
  function initLanding() {
    const form = $("#bookingForm");
    if (!form) return;

    const checkin = $("#checkin");
    const checkout = $("#checkout");
    const capsule = $("#capsule");
    const guests = $("#guests");
    const name = $("#name");
    const phone = $("#phone");
    const nightsEl = $("#nights");
    const sumEl = $("#totalSum");
    const errEl = $("#formError");

    const today = new Date();
    const t1 = new Date(today);
    t1.setDate(t1.getDate() + 1);

    checkin.min = iso(today);
    checkout.min = iso(t1);
    checkin.value = iso(t1);

    const t2 = new Date(t1);
    t2.setDate(t2.getDate() + 1);
    checkout.value = iso(t2);

    function recalc() {
      const a = checkin.value;
      const b = checkout.value;
      const n = a && b ? days(a, b) : 0;
      const price = PRICES[capsule.value] || 0;
      const nights = n > 0 ? n : 0;

      nightsEl.textContent = nights || 0;
      sumEl.textContent = rub(nights * price);
      errEl.hidden = true;
      return { nights, price };
    }

    [checkin, checkout, capsule].forEach((el) => el.addEventListener("change", recalc));
    [checkin, checkout].forEach((el) =>
      el.addEventListener("change", () => {
        if (checkin.value && checkout.value && days(checkin.value, checkout.value) <= 0) {
          const next = new Date(parse(checkin.value));
          next.setDate(next.getDate() + 1);
          checkout.value = iso(next);
        }
        checkout.min = checkin.value || checkout.min;
        recalc();
      })
    );

    $$(".choose").forEach((btn) =>
      btn.addEventListener("click", () => {
        capsule.value = btn.dataset.capsule;
        capsule.dispatchEvent(new Event("change"));
        document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => name.focus({ preventScroll: true }), 420);
        toast("Капсула " + btn.dataset.capsule + " выбрана");
      })
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const a = checkin.value;
      const b = checkout.value;
      const n = a && b ? days(a, b) : 0;

      if (!a || !b) return fail("Укажи даты заезда и выезда.");
      if (n <= 0) return fail("Дата выезда должна быть позже даты заезда.");
      if (name.value.trim().length < 2) return fail("Как к тебе обращаться? Укажи имя.");
      if (!/^[\d\s+()\-]{10,20}$/.test(phone.value.trim()))
        return fail("Похоже, в телефоне опечатка. Формат: +7 999 000-00-00.");

      const price = PRICES[capsule.value] || 0;
      const booking = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        code: "LK-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        capsule: capsule.value,
        guests: Number(guests.value),
        checkin: a,
        checkout: b,
        nights: n,
        total: n * price,
        name: name.value.trim(),
        phone: phone.value.trim(),
        created: new Date().toISOString(),
      };

      const list = readStore();
      list.push(booking);
      writeStore(list);

      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      btn.textContent = "Бронь создана ✓";
      toast("Готово! Бронь " + booking.code + " — в личном кабинете.");

      setTimeout(() => {
        window.location.href = "lk.html";
      }, 1400);
    });

    function fail(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
      return false;
    }

    recalc();
  }

  /* ============================================================
     ЛИЧНЫЙ КАБИНЕТ
     ============================================================ */
  function statusOf(b) {
    const now = new Date();
    const a = parse(b.checkin);
    const z = parse(b.checkout);
    if (z < new Date(now.toDateString())) return { cls: "past", label: "Завершена" };
    if (a <= now && now <= z) return { cls: "soon", label: "Идёт" };
    const inDays = Math.round((a - now) / 86400000);
    if (inDays <= 2) return { cls: "soon", label: "Скоро" };
    return { cls: "ok", label: "Подтверждена" };
  }

  function initLk() {
    const list = $("#bookings");
    if (!list) return;

    const empty = $("#emptyState");
    const tabs = $$(".tab");
    const panels = $$(".panel");

    tabs.forEach((t) =>
      t.addEventListener("click", () => {
        tabs.forEach((x) => x.classList.toggle("on", x === t));
        panels.forEach((p) => (p.hidden = p.id !== t.dataset.panel));
      })
    );

    function render() {
      const items = readStore().sort((a, b) => parse(b.checkin) - parse(a.checkin));

      list.innerHTML = "";
      empty.hidden = items.length > 0;

      items.forEach((b) => {
        const st = statusOf(b);
        const el = document.createElement("article");
        el.className = "booking-item";
        el.innerHTML = `
          <div class="bi-icon">${b.capsule.toUpperCase()}</div>
          <div>
            <div class="bi-title">${b.capsule} · ${b.guests} гост${b.guests === 1 ? "ь" : "я"}</div>
            <div class="bi-meta">${humanDate(b.checkin)} — ${humanDate(b.checkout)} · ${b.nights} ноч. · код ${b.code}</div>
          </div>
          <div class="bi-actions">
            <span class="status ${st.cls}">${st.label}</span>
            <span class="bi-price">${rub(b.total)}</span>
            <button class="link-btn" data-del="${b.id}">Отменить</button>
          </div>`;
        list.appendChild(el);
      });

      list.querySelectorAll("[data-del]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const id = btn.dataset.del;
          writeStore(readStore().filter((x) => x.id !== id));
          toast("Бронь отменена");
          render();
        })
      );

      // сводка
      const nights = items.reduce((s, b) => s + b.nights, 0);
      const total = items.reduce((s, b) => s + b.total, 0);
      $("#sumNights").textContent = nights;
      $("#sumBookings").textContent = items.length;
      $("#sumTotal").textContent = rub(total);
      $("#bonusValue").textContent = Math.round(total * 0.05) + " б.";

      // профиль
      const last = items[0];
      if (last) {
        $("#pName").textContent = last.name;
        $("#pPhone").textContent = last.phone;
        $("#pCapsule").textContent = last.capsule;
        $("#pCode").textContent = last.code;
      }
    }

    render();
  }

  /* ---------- старт ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    if (PAGE === "landing") initLanding();
    if (PAGE === "lk") initLk();
  });
})();

