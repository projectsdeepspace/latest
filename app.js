(() => {
  "use strict";

  const stage = document.getElementById("stage");
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d", { alpha: true });

  const state = {
    screen: 1,              // 1..6
    picks: { 2: null, 3: null, 4: null, 5: null },
    canNext: false,
    introPlayed: false
  };

  // --- Screens config ---
  const screens = {
    1: {
      type: "intro",
      title: "Небольшое путешествие начинается…",
      sub: "Пара шагов — и сюрприз."
    },
    2: {
      type: "drag",
      title: "Перед тем как получить сюрприз, давай убедимся — ты действительно та самая Алёна?",
      options: [
        { id: "flowers", label: "", icon: "🌸", ghost: "🌸" },
        { id: "paint",   label: "", icon: "🎨", ghost: "🎨" },
        { id: "book",    label: "", icon: "📖", ghost: "📖" },
      ],
      toast: "Перетащи любую иконку на Алёну ✨"
    },
    3: {
      type: "drag",
      title: "Какой ужин тебе ближе?",
      options: [
        { id: "together", label: "Готовим вместе", icon: `<svg class="miniIcon" viewBox="0 0 64 40" aria-hidden="true">
  <g fill="none" stroke="rgba(31,31,43,.18)" stroke-width="1">
    <rect x="0.5" y="0.5" width="63" height="39" rx="12" fill="rgba(255,255,255,.65)"/>
  </g>
  <!-- girl chef -->
  <circle cx="22" cy="22" r="7" fill="#ffe6d4"/>
  <path d="M15 19 C16 13, 28 13, 29 19 C28 26, 16 26, 15 19Z" fill="#fff"/>
  <path d="M16 17 C16 11, 28 11, 28 17" fill="#fff"/>
  <path d="M18 28 C20 26, 24 26, 26 28" stroke="rgba(31,31,43,.20)" stroke-width="3" stroke-linecap="round"/>
  <!-- boy chef -->
  <circle cx="42" cy="22" r="7" fill="#ffe6d4"/>
  <path d="M35 19 C36 13, 48 13, 49 19 C48 26, 36 26, 35 19Z" fill="#fff"/>
  <path d="M36 17 C36 11, 48 11, 48 17" fill="#fff"/>
  <path d="M38 28 C40 26, 44 26, 46 28" stroke="rgba(31,31,43,.20)" stroke-width="3" stroke-linecap="round"/>
  <!-- tiny hearts -->
  <circle cx="32" cy="10" r="2" fill="rgba(255,122,168,.55)"/>
</svg>`, ghost: "Готовим вместе" },
        { id: "me",       label: "Готовлю я",     icon: `<svg class="miniIcon" viewBox="0 0 64 40" aria-hidden="true">
  <g fill="none" stroke="rgba(31,31,43,.18)" stroke-width="1">
    <rect x="0.5" y="0.5" width="63" height="39" rx="12" fill="rgba(255,255,255,.65)"/>
  </g>
  <circle cx="32" cy="22" r="8" fill="#ffe6d4"/>
  <path d="M24 19 C25 12, 39 12, 40 19 C39 28, 25 28, 24 19Z" fill="#fff"/>
  <path d="M25 17 C25 10, 39 10, 39 17" fill="#fff"/>
  <path d="M28 30 C30 28, 34 28, 36 30" stroke="rgba(31,31,43,.20)" stroke-width="3" stroke-linecap="round"/>
</svg>`, ghost: "Готовлю я" },
      ],
      toast: "Перетащи выбор на Алёну ✨"
    },
    4: {
      type: "drag",
      title: "Атмосфера вечера — это скорее…",
      options: [
        { id: "cozy",    label: "", icon: "🕯", ghost: "🕯" },
        { id: "elegant", label: "", icon: "✨", ghost: "✨" },
        { id: "free",    label: "", icon: "🌿", ghost: "🌿" },
      ],
      toast: "Перетащи выбор на Алёну ✨"
    },
    5: {
      type: "drag",
      title: "Кажется, вечер сложился. Хочешь узнать детали?",
      options: [
        { id: "want",        label: "Хочу",         icon: "", ghost: "Хочу" },
        { id: "wantSure",    label: "Хочу конечно", icon: "", ghost: "Хочу конечно" },
      ],
      toast: "Один жест — и детали открываются ✨"
    },
    6: {
      type: "final",
      title: "Финал",
      finalText:
`Ты приглашена на домашний ужин.

📅 Дата: с 22 февраля
🕖 Время: обговаривается
🏠 Место: моя квартира

Буду рад провести этот вечер вместе.`
    }
  };

  // --- Resize canvas ---
  function resizeCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Simple particle engine ---
  const particles = [];
  let rafId = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function burstConfetti(x, y, count = 70) {
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: "confetti",
        x, y,
        vx: rand(-3.2, 3.2),
        vy: rand(-5.5, -1.0),
        g: rand(0.09, 0.16),
        r: rand(2, 4),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.22, 0.22),
        life: rand(55, 95),
        t: 0,
        shape: Math.random() < 0.5 ? "rect" : "circle",
        // soft palette
        color: [ "rgba(255,122,168,.9)", "rgba(182,147,255,.9)", "rgba(255,211,106,.9)", "rgba(127,240,215,.9)" ][(Math.random()*4)|0]
      });
    }
    kickLoop();
  }

  function petalsFall(x, y, count = 55) {
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: "petal",
        x: x + rand(-40, 40),
        y: y + rand(-10, 10),
        vx: rand(-0.6, 0.6),
        vy: rand(0.8, 2.0),
        g: rand(0.01, 0.03),
        r: rand(4, 7),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.07, 0.07),
        life: rand(85, 140),
        t: 0,
        color: [ "rgba(255,122,168,.55)", "rgba(255,122,168,.38)", "rgba(255,211,106,.42)" ][(Math.random()*3)|0]
      });
    }
    kickLoop();
  }

  function sparkles(x, y, count = 45) {
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: "sparkle",
        x: x + rand(-18, 18),
        y: y + rand(-18, 18),
        vx: rand(-1.4, 1.4),
        vy: rand(-2.2, 0.9),
        g: rand(0.05, 0.09),
        r: rand(1.4, 2.6),
        rot: 0,
        vr: 0,
        life: rand(35, 65),
        t: 0,
        color: [ "rgba(255,255,255,.95)", "rgba(255,211,106,.9)", "rgba(182,147,255,.75)" ][(Math.random()*3)|0]
      });
    }
    kickLoop();
  }

  function kickLoop() {
    if (rafId) return;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.rot += p.vr;

        const alpha = 1 - (p.t / p.life);
        if (alpha <= 0 || p.y > window.innerHeight + 40) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (p.kind === "confetti") {
          ctx.fillStyle = p.color;
          if (p.shape === "rect") {
            ctx.fillRect(-p.r * 1.4, -p.r, p.r * 2.8, p.r * 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.kind === "petal") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.1, p.r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // sparkle
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-p.r * 2.2, 0);
          ctx.lineTo(p.r * 2.2, 0);
          ctx.moveTo(0, -p.r * 2.2);
          ctx.lineTo(0, p.r * 2.2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (particles.length === 0) {
        cancelAnimationFrame(rafId);
        rafId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    rafId = requestAnimationFrame(tick);
  }

    // --- Avatar SVG (blonde girl in dress) ---
  function girlSVG() {
    return `
<svg class="avatarSvg" viewBox="0 0 240 320" role="img" aria-label="Алёна">
  <defs>
    <linearGradient id="dress" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7aa8" stop-opacity=".98"/>
      <stop offset="1" stop-color="#b693ff" stop-opacity=".98"/>
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff0b8"/>
      <stop offset="1" stop-color="#ffd36a"/>
    </linearGradient>
    <linearGradient id="sock" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,.92)"/>
      <stop offset="1" stop-color="rgba(255,255,255,.55)"/>
    </linearGradient>
  </defs>

  <!-- мягкий фон-пузырьки -->
  <circle cx="120" cy="135" r="105" fill="rgba(255,255,255,.65)"/>
  <circle cx="68" cy="80" r="16" fill="rgba(255,122,168,.18)"/>
  <circle cx="176" cy="68" r="13" fill="rgba(182,147,255,.18)"/>
  <circle cx="180" cy="170" r="14" fill="rgba(127,240,215,.14)"/>

  <!-- волосы (объемные, блонд) -->
  <path d="M72,132
           C62,92 88,56 120,56
           C154,56 178,92 170,134
           C166,156 156,176 142,186
           C150,164 150,138 142,122
           C132,96 122,90 120,90
           C118,90 108,96 98,122
           C90,140 90,164 98,186
           C84,176 76,154 72,132Z"
        fill="url(#hair)"/>

  <!-- голова -->
  <circle cx="120" cy="110" r="34" fill="#ffe6d4"/>
  <!-- щечки -->
  <circle cx="102" cy="118" r="7" fill="rgba(255,122,168,.22)"/>
  <circle cx="138" cy="118" r="7" fill="rgba(255,122,168,.22)"/>

  <!-- глаза -->
  <circle cx="108" cy="106" r="4.2" fill="#1f1f2b"/>
  <circle cx="132" cy="106" r="4.2" fill="#1f1f2b"/>
  <circle cx="106.5" cy="104.6" r="1.4" fill="#fff"/>
  <circle cx="130.5" cy="104.6" r="1.4" fill="#fff"/>

  <!-- улыбка -->
  <path d="M108,126 C114,132 126,132 132,126"
        fill="none" stroke="rgba(31,31,43,.55)" stroke-width="3" stroke-linecap="round"/>

  <!-- шея -->
  <rect x="112" y="138" width="16" height="16" rx="7" fill="#ffe6d4"/>

  <!-- туловище / платье -->
  <path d="M120,152
           C98,152 78,170 74,198
           C70,224 82,250 106,260
           C114,263 126,263 134,260
           C158,250 170,224 166,198
           C162,170 142,152 120,152Z"
        fill="url(#dress)"/>

  <!-- пояс -->
  <path d="M92,204 C106,194 134,194 148,204"
        fill="none" stroke="rgba(255,255,255,.60)" stroke-width="7" stroke-linecap="round"/>

  <!-- рукава (короткие) -->
  <path d="M86,186 C74,190 68,202 72,214"
        fill="none" stroke="rgba(255,255,255,.55)" stroke-width="10" stroke-linecap="round"/>
  <path d="M154,186 C166,190 172,202 168,214"
        fill="none" stroke="rgba(255,255,255,.55)" stroke-width="10" stroke-linecap="round"/>

  <!-- руки -->
  <path d="M76,214 C66,226 68,242 82,248"
        fill="none" stroke="#ffe6d4" stroke-width="10" stroke-linecap="round"/>
  <path d="M164,214 C174,226 172,242 158,248"
        fill="none" stroke="#ffe6d4" stroke-width="10" stroke-linecap="round"/>

  <!-- ладошки -->
  <circle cx="84" cy="249" r="7" fill="#ffe6d4"/>
  <circle cx="156" cy="249" r="7" fill="#ffe6d4"/>

  <!-- ноги -->
  <path d="M112,260 C108,276 110,292 112,300"
        fill="none" stroke="#ffe6d4" stroke-width="10" stroke-linecap="round"/>
  <path d="M128,260 C132,276 130,292 128,300"
        fill="none" stroke="#ffe6d4" stroke-width="10" stroke-linecap="round"/>

  <!-- носочки -->
  <path d="M108,298 C104,305 108,308 114,308 C118,308 120,306 120,304"
        fill="url(#sock)" stroke="rgba(31,31,43,.10)" stroke-width="1"/>
  <path d="M132,298 C136,305 132,308 126,308 C122,308 120,306 120,304"
        fill="url(#sock)" stroke="rgba(31,31,43,.10)" stroke-width="1"/>

  <!-- туфельки -->
  <path d="M104,308 C106,313 112,316 120,316 C118,312 114,308 108,306 Z"
        fill="rgba(31,31,43,.14)"/>
  <path d="M136,308 C134,313 128,316 120,316 C122,312 126,308 132,306 Z"
        fill="rgba(31,31,43,.14)"/>
</svg>`;
  }

// --- Render helpers ---
  function progressDots(current) {
    const wrap = document.createElement("div");
    wrap.className = "dots";
    for (let i = 1; i <= 6; i++) {
      const d = document.createElement("span");
      d.className = "dot" + (i === current ? " on" : "");
      wrap.appendChild(d);
    }
    return wrap;
  }

  function makeFooter(toastText) {
    const foot = document.createElement("div");
    foot.className = "footer";
    foot.appendChild(progressDots(state.screen));

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = toastText || "";
    foot.appendChild(toast);
    return foot;
  }

  // --- Drag & Drop (pointer-based) ---
  let ghost = null;
  let dragging = null;

  function ensureGhost() {
    if (ghost) return ghost;
    ghost = document.createElement("div");
    ghost.className = "dragGhost";
    document.body.appendChild(ghost);
    return ghost;
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function bindDragAndDrop({ dropEl, onDrop, onHotChange }) {
    const opts = stage.querySelectorAll(".opt");
    opts.forEach((el) => {
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);

        dragging = { value: el.dataset.value, pointerId: e.pointerId };
        const g = ensureGhost();
        g.textContent = el.dataset.ghost || el.dataset.value;
        g.style.transform = `translate(${e.clientX - 32}px, ${e.clientY - 32}px)`;
        g.style.opacity = "1";

        el.classList.add("selected");

        let hot = false;

        const move = (ev) => {
          if (!dragging || ev.pointerId !== dragging.pointerId) return;
          g.style.transform = `translate(${ev.clientX - 32}px, ${ev.clientY - 32}px)`;

          const r = dropEl.getBoundingClientRect();
          const isHot = pointInRect(ev.clientX, ev.clientY, r);
          if (isHot !== hot) {
            hot = isHot;
            onHotChange?.(hot);
          }
        };

        const up = (ev) => {
          if (!dragging || ev.pointerId !== dragging.pointerId) return;

          const r = dropEl.getBoundingClientRect();
          const ok = pointInRect(ev.clientX, ev.clientY, r);

          // cleanup
          window.removeEventListener("pointermove", move, { passive: false });
          window.removeEventListener("pointerup", up, { passive: false });
          window.removeEventListener("pointercancel", up, { passive: false });

          g.style.opacity = "0";
          g.style.transform = "translate(-9999px,-9999px)";
          onHotChange?.(false);

          dragging = null;

          // remove all selected marks (so only state shows progression)
          stage.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));

          if (ok) onDrop(el.dataset.value);
        };

        window.addEventListener("pointermove", move, { passive: false });
        window.addEventListener("pointerup", up, { passive: false });
        window.addEventListener("pointercancel", up, { passive: false });
      }, { passive: false });

      // optional: tap-to-autoselect (но лучше drag) — сделаем мягко:
      el.addEventListener("click", () => {
        // на мобилке иногда click после drag — не мешаем
        // если еще не выбран и пользователь просто тапнул — засчитаем как "drop"
        const s = screens[state.screen];
        if (s?.type !== "drag") return;
        const already = state.picks[state.screen];
        if (already) return;
        // имитируем drop
        onTapSelect(el.dataset.value);
      });
    });

    function onTapSelect(val) {
      const r = dropEl.getBoundingClientRect();
      const x = r.left + r.width * 0.5;
      const y = r.top + r.height * 0.45;
      onHotChange?.(true);
      setTimeout(() => onHotChange?.(false), 220);
      onDrop(val, { tap: true, x, y });
    }
  }

  // --- Screen actions ---
  function goTo(n) {
    state.screen = n;
    state.canNext = (n === 1 || n === 6) ? true : Boolean(state.picks[n]);
    if (n === 1) state.introPlayed = false;
    render();
  }

  function next() {
    const n = Math.min(6, state.screen + 1);
    goTo(n);
  }

  function playEffectForScreen(screenNo, val, dropEl) {
    const r = dropEl.getBoundingClientRect();
    const x = r.left + r.width * 0.5;
    const y = r.top + r.height * 0.38;

    // defaults
    if (screenNo === 2) {
      if (val === "flowers") {
        burstConfetti(x, y, 75);
        petalsFall(x, y, 60);
      } else if (val === "paint") {
        dropEl.classList.add("glowOn");
        sparkles(x, y, 36);
        setTimeout(() => dropEl.classList.remove("glowOn"), 1250);
      } else if (val === "book") {
        dropEl.classList.add("shimmerOn");
        sparkles(x, y, 28);
        setTimeout(() => dropEl.classList.remove("shimmerOn"), 1200);
      } else {
        sparkles(x, y, 40);
      }
      return;
    }

    if (screenNo === 3 || screenNo === 4 || screenNo === 5) {
      burstConfetti(x, y, 55);
      sparkles(x, y, 30);
    }
  }

  // --- Render ---
  function render() {
    const s = screens[state.screen];
    stage.innerHTML = "";

    const root = document.createElement("div");
    root.className = "screen";

    // title/sub
    if (state.screen === 1) {
      root.appendChild(renderIntro());
      stage.appendChild(root);
      return;
    }

    if (state.screen === 6) {
      root.appendChild(renderFinal());
      stage.appendChild(root);
      // мягкое конфетти при появлении
      setTimeout(() => {
        burstConfetti(window.innerWidth * 0.5, window.innerHeight * 0.25, 85);
        sparkles(window.innerWidth * 0.5, window.innerHeight * 0.25, 40);
      }, 120);
      return;
    }

    const h1 = document.createElement("h1");
    h1.className = "h1";
    h1.textContent = s.title;
    root.appendChild(h1);

    if (s.sub) {
      const sub = document.createElement("p");
      sub.className = "sub";
      sub.textContent = s.sub;
      root.appendChild(sub);
    }

    // interactive grid
    const row = document.createElement("div");
    row.className = "row";

    // drop side
    const dropWrap = document.createElement("div");
    dropWrap.className = "dropWrap";

    const dropZone = document.createElement("div");
    dropZone.className = "dropZone";
    dropZone.innerHTML = `
      <div class="glowPulse"></div>
      <div class="shimmer"></div>
      ${girlSVG()}
      <p class="dropLabel">перетащи сюда ✨</p>
    `;
    dropWrap.appendChild(dropZone);

    row.appendChild(dropWrap);

    // options side
    const options = document.createElement("div");
    options.className = "options";

    const grid = document.createElement("div");
    grid.className = "optGrid";

    s.options.forEach((opt) => {
      const o = document.createElement("button");
      o.className = "opt" + (opt.label ? "" : " opt-iconOnly");
      o.type = "button";
      o.dataset.value = opt.id;
      o.dataset.ghost = opt.ghost || opt.label || opt.icon || "";
      o.setAttribute("aria-label", opt.label ? opt.label : `Выбор ${opt.icon}`);

      // content: icon + label (label optional)
      if (opt.icon && opt.icon.trim().startsWith("<svg")) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "optIcon";
        iconWrap.innerHTML = opt.icon;
        o.appendChild(iconWrap);
      } else if (opt.icon) {
        const em = document.createElement("span");
        em.className = "optEmoji";
        em.textContent = opt.icon;
        o.appendChild(em);
      }

      if (opt.label) {
        const lab = document.createElement("span");
        lab.className = "optLabel";
        lab.textContent = opt.label;
        o.appendChild(lab);
      }

      grid.appendChild(o);
    });

    options.appendChild(grid);

    // next button (appears after drop)
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.type = "button";
    nextBtn.textContent = "Дальше";
    nextBtn.disabled = !state.canNext;
    nextBtn.addEventListener("click", next);
    options.appendChild(nextBtn);

    row.appendChild(options);
    root.appendChild(row);

    // footer
    root.appendChild(makeFooter(s.toast || ""));

    stage.appendChild(root);

    // bind dnd
    bindDragAndDrop({
      dropEl: dropZone,
      onHotChange: (hot) => dropZone.classList.toggle("hot", hot),
      onDrop: (val) => {
        // any choice is "correct"
        state.picks[state.screen] = val;
        state.canNext = true;
        nextBtn.disabled = false;

        playEffectForScreen(state.screen, val, dropZone);
      }
    });
  }

  function renderIntro() {
    const s = screens[1];

    const h1 = document.createElement("h1");
    h1.className = "h1";
    h1.textContent = s.title;

    const sub = document.createElement("p");
    sub.className = "sub";
    sub.textContent = s.sub;

    const grid = document.createElement("div");
    grid.className = "introGrid";

    const left = document.createElement("div");
    left.className = "artBox";
    left.innerHTML = girlSVG();

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.flexDirection = "column";
    right.style.gap = "12px";
    right.style.alignItems = "flex-start";
    right.style.justifyContent = "center";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = "Алёна путешественница ✈️";

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.type = "button";
    startBtn.textContent = "Начать";
    startBtn.addEventListener("click", () => goTo(2));

    right.appendChild(badge);
    right.appendChild(startBtn);

    grid.appendChild(left);
    grid.appendChild(right);

    const wrap = document.createElement("div");
    wrap.className = "screen";
    wrap.appendChild(h1);
    wrap.appendChild(sub);
    wrap.appendChild(grid);
    wrap.appendChild(makeFooter("Никаких неправильных ответов — только настроение ✨"));

    // анимация на первом экране
    if (!state.introPlayed) {
      state.introPlayed = true;
      setTimeout(() => {
        burstConfetti(window.innerWidth * 0.5, window.innerHeight * 0.22, 80);
        sparkles(window.innerWidth * 0.5, window.innerHeight * 0.22, 55);
      }, 140);
    }

    return wrap;
  }

  function renderFinal() {
    const s = screens[6];

    const wrap = document.createElement("div");
    wrap.className = "screen";

    const h1 = document.createElement("h1");
    h1.className = "h1";
    h1.textContent = "Готово 💫";
    wrap.appendChild(h1);

    const block = document.createElement("div");
    block.className = "finalText";
    block.textContent = s.finalText;
    wrap.appendChild(block);

    const btns = document.createElement("div");
    btns.className = "finalBtns";

    const shareBtn = document.createElement("button");
    shareBtn.className = "btn btn-primary";
    shareBtn.type = "button";
    shareBtn.textContent = "Поделиться";
    shareBtn.addEventListener("click", shareLink);

    const restartBtn = document.createElement("button");
    restartBtn.className = "btn btn-ghost";
    restartBtn.type = "button";
    restartBtn.textContent = "С начала";
    restartBtn.addEventListener("click", () => {
      state.picks = { 2: null, 3: null, 4: null, 5: null };
      goTo(1);
    });

    btns.appendChild(shareBtn);
    btns.appendChild(restartBtn);
    wrap.appendChild(btns);

    wrap.appendChild(makeFooter("Можно поделиться ссылкой ✨"));

    return wrap;
  }

  async function shareLink() {
    const url = location.href;
    const text = "Микро-квест 🙂";

    try {
      if (navigator.share) {
        await navigator.share({ title: "Микро-Квиз", text, url });
        burstConfetti(window.innerWidth * 0.5, window.innerHeight * 0.2, 70);
        return;
      }
    } catch (_) {
      // user cancelled / not available
    }

    try {
      await navigator.clipboard.writeText(url);
      sparkles(window.innerWidth * 0.5, window.innerHeight * 0.2, 55);
      // маленький UX без алертов: меняем подпись на секунду
      const btn = [...stage.querySelectorAll("button")].find(b => b.textContent.includes("Поделиться"));
      if (btn) {
        const old = btn.textContent;
        btn.textContent = "Ссылка скопирована ✓";
        setTimeout(() => btn.textContent = old, 1200);
      }
    } catch (_) {
      // fallback
      prompt("Скопируй ссылку:", url);
    }
  }

  // start
  render();

})(); 
