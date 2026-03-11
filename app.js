/* ── Sticky nav ── */
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ── Burger menu ── */
const burger = document.getElementById('navBurger');
const mobNav = document.getElementById('mobNav');
let _scrollY = 0;

function lockBody() {
  _scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + _scrollY + 'px';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}
function unlockBody() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, _scrollY);
}

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobNav.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  open ? lockBody() : unlockBody();
});
document.querySelectorAll('.mob-nav a, .mob-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    mobNav.classList.remove('open');
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    unlockBody();
  });
});

/* ── Scroll reveal ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Hero image fallback ── */
const heroImg = document.querySelector('.browser-screen img');
if (heroImg) {
  heroImg.addEventListener('error', () => {
    heroImg.style.display = 'none';
    const fb = document.getElementById('heroScreenFallback');
    if (fb) fb.style.display = 'flex';
  });
}

/* ── Lightbox Escape ── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['heroLightbox','uniLightbox'].forEach(id => {
      const lb = document.getElementById(id);
      if (lb) lb.style.display = 'none';
    });
  }
});


/* ── Calculator (enhanced with animations) ── */
(function() {
  const fields = [
    { id: 'rMonths',  valId: 'valMonths',  fmt: v => v },
    { id: 'rSalary',  valId: 'valSalary',  fmt: v => (+v).toLocaleString('ru') + ' ₽' },
    { id: 'rMinutes', valId: 'valMinutes', fmt: v => v + ' ч' },
  ];

  // Animated number counter
  function animateCounter(el, fromVal, toVal, duration) {
    if (!el) return;
    const startTime = performance.now();
    const range = toVal - fromVal;
    if (range === 0) return;
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromVal + range * eased);
      el.setAttribute('data-raw', current);
      if (el.id === 'resSavedMoney') {
        el.textContent = current.toLocaleString('ru') + ' ₽';
      } else {
        el.textContent = current.toLocaleString('ru');
      }
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Flash card on update
  function flashCard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('updating');
    void el.offsetWidth; // force reflow
    el.classList.add('updating');
    setTimeout(() => el.classList.remove('updating'), 450);
  }

  // Update progress bar
  function setBar(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  // Track previous values for counter animation
  let prevHours = 0, prevMoney = 0;

  function calc() {
    const months      = +document.getElementById('rMonths').value;
    const hourlyRate  = +document.getElementById('rSalary').value;
    const manualHours = +document.getElementById('rMinutes').value;

    const sessionsPerYear = months * 12;
    const hoursNow   = manualHours * sessionsPerYear;
    const hoursNew   = (5 / 60) * sessionsPerYear;
    const savedHours = Math.max(0, hoursNow - hoursNew);
    const savedMoney = savedHours * hourlyRate;

    const PROGRAM_COST = 14990;
    const savedPerMonth = savedMoney / 12;
    const roiMonths = savedPerMonth > 0 ? PROGRAM_COST / savedPerMonth : 999;
    const roiText = roiMonths < 1 ? '< 1' : roiMonths > 120 ? '> 120' : Math.round(roiMonths).toLocaleString('ru');

    // Hidden compat fields
    document.getElementById('resHoursNow').textContent = Math.round(hoursNow).toLocaleString('ru');
    document.getElementById('resHoursNew').textContent = Math.round(hoursNew).toLocaleString('ru');

    // Flash cards
    flashCard('cardSavedHours');
    flashCard('cardSavedMoney');
    flashCard('cardROI');

    // Animate counters
    const targetHours = Math.round(savedHours);
    const targetMoney = Math.round(savedMoney);
    animateCounter(document.getElementById('resSavedHours'), prevHours, targetHours, 420);
    animateCounter(document.getElementById('resSavedMoney'), prevMoney, targetMoney, 420);
    prevHours = targetHours;
    prevMoney = targetMoney;

    // ROI — direct update (special formatting)
    const roiEl = document.getElementById('resROI');
    if (roiEl) roiEl.textContent = roiText;

    // Progress bars
    // Hours: 0–500 range feels representative
    setBar('barSavedHours', savedHours / 480 * 100);
    // Money: 0–1 000 000
    setBar('barSavedMoney', savedMoney / 960000 * 100);
    // ROI bar: full = fast payback (< 1 month), empty = slow (> 24 months)
    const roiBarPct = roiMonths >= 999 ? 2 : Math.max(2, (1 - (Math.min(roiMonths, 24) / 24)) * 100);
    setBar('barROI', roiBarPct);
  }

  fields.forEach(({ id, valId, fmt }) => {
    const range = document.getElementById(id);
    const val   = document.getElementById(valId);
    if (!range || !val) return;

    range.addEventListener('input', () => {
      val.textContent = fmt(range.value);
      // Pop badge
      val.classList.remove('pop');
      void val.offsetWidth;
      val.classList.add('pop');
      setTimeout(() => val.classList.remove('pop'), 220);

      calc();

      const pct = (range.value - range.min) / (range.max - range.min) * 100;
      range.style.background = `linear-gradient(90deg, rgba(255,255,255,.9) ${pct}%, rgba(255,255,255,.2) ${pct}%)`;
    });

    // Initial track fill
    const pct = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.background = `linear-gradient(90deg, rgba(255,255,255,.9) ${pct}%, rgba(255,255,255,.2) ${pct}%)`;
  });

  calc();
})();

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ── Contact form → Google Apps Script → Telegram ── */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwx02B-sEgTdtsyPZHoZUnhs0T162vB2dBLks05grDyph3CMJdA-OHAK2x-9o4aT5Sv/exec';

document.getElementById('fBtn').addEventListener('click', async function() {
  const btn      = this;
  const phone    = document.getElementById('fPhone').value.trim();
  const errBox   = document.getElementById('fErr');

  if (!phone) {
    errBox.textContent = 'Пожалуйста, введите телефон.';
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Отправка…';

  const NL   = '\n';
  const text = '🔔 Новая заявка — Прайс-менеджер' + NL + NL +
    '📞 Телефон: ' + phone + NL +
    '⏰ ' + new Date().toLocaleString('ru-RU');

  try {
    /* Content-Type: text/plain — единственный вариант, работающий
       в режиме no-cors без preflight. GAS читает через e.postData.contents */
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ phone, text })
    });
    /* no-cors всегда возвращает opaque-ответ, исключение = сеть упала */
    document.getElementById('cForm').style.display = 'none';
    document.getElementById('formOk').style.display = 'block';
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = origHTML;
    errBox.textContent = 'Ошибка отправки. Напишите напрямую в Telegram.';
    errBox.style.display = 'block';
  }
});


/* ══════════════════════════════════════════════
   FLOATING ICONS ANIMATION
   GSAP + вихревое движение внутри hero-браузера
══════════════════════════════════════════════ */
(function() {
  // Ждём полной загрузки DOM и GSAP
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── Генерация штрихкодов ──
  function buildBarcode(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const widths = [1,2,1,3,1,1,2,1,2,1,3,1,1,2,1,3,2,1,2,1];
    const heights = [20,14,20,16,20,18,20,14,20,16];
    widths.forEach((w, i) => {
      const b = document.createElement('div');
      b.className = 'bc-bar';
      b.style.cssText = `width:${w}px;height:${heights[i % heights.length]}px;`;
      el.appendChild(b);
    });
  }
  buildBarcode('bc1');
  buildBarcode('bc2');

  // ── Утилиты ──
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Получаем размеры контейнера браузер-скрин
  const screen = document.querySelector('#heroBrowserScreen');
  if (!screen) return;

  // ── Стартовые позиции иконок ──
  // Задаём явно — распределяем по всей площади изображения
  // Позиции в % от ширины/высоты контейнера
  const startPos = {
    fi1:  { left: '75%', top: '8%'  },  // XLS  — правый верх
    fi2:  { left: '12%', top: '14%' },  // XLSX — левый верх
    fi3:  { left: '78%', top: '68%' },  // XLSX — правый низ
    fi4:  { left: '55%', top: '78%' },  // CSV  — нижний центр
    fi5:  { left: '28%', top: '4%'  },  // =ЕСЛИ — верх центр
    fi6:  { left: '5%',  top: '72%' },  // =ВПР — левый низ
    fi7:  { left: '62%', top: '32%' },  // =СУММ — правый центр
    fi8:  { left: '60%', top: '15%' },  // штрихкод 1
    fi9:  { left: '8%',  top: '44%' },  // штрихкод 2
    fi10: { left: '38%', top: '54%' },  // Выгодно
    fi11: { left: '18%', top: '24%' },  // Дорого
    fi12: { left: '42%', top: '84%' },  // По штрихкодам
    fi13: { left: '85%', top: '45%' },  // -12%
    fi14: { left: '5%',  top: '86%' },  // спарклайн
    fi15: { left: '72%', top: '88%' },  // =C2-D2
  };

  // Применяем стартовые позиции
  Object.entries(startPos).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.left = pos.left;
      el.style.top  = pos.top;
    }
  });

  // ── Параметры вихря для каждой иконки ──
  // angle — начальный угол в радианах
  // radius — радиус орбиты вокруг «центра притяжения»
  // speed  — угловая скорость (рад/сек)
  // cx,cy  — центр вихря в % (смещение от стартовой позиции)
  const vortexParams = [
    { id: 'fi1',  angle: 0.2,  radius: 6,  speed: 0.55, cx: 0, cy: 0, drift: 1.2 },
    { id: 'fi2',  angle: 1.1,  radius: 8,  speed: 0.42, cx: 0, cy: 0, drift: 1.5 },
    { id: 'fi3',  angle: 2.4,  radius: 7,  speed: 0.60, cx: 0, cy: 0, drift: 1.0 },
    { id: 'fi4',  angle: 3.9,  radius: 6,  speed: 0.38, cx: 0, cy: 0, drift: 1.3 },
    { id: 'fi5',  angle: 0.8,  radius: 10, speed: 0.30, cx: 0, cy: 0, drift: 0.8 },
    { id: 'fi6',  angle: 2.0,  radius: 8,  speed: 0.45, cx: 0, cy: 0, drift: 1.1 },
    { id: 'fi7',  angle: 4.5,  radius: 7,  speed: 0.50, cx: 0, cy: 0, drift: 1.4 },
    { id: 'fi8',  angle: 1.7,  radius: 6,  speed: 0.35, cx: 0, cy: 0, drift: 0.9 },
    { id: 'fi9',  angle: 3.2,  radius: 9,  speed: 0.48, cx: 0, cy: 0, drift: 1.2 },
    { id: 'fi10', angle: 0.5,  radius: 7,  speed: 0.52, cx: 0, cy: 0, drift: 1.1 },
    { id: 'fi11', angle: 2.8,  radius: 8,  speed: 0.40, cx: 0, cy: 0, drift: 1.3 },
    { id: 'fi12', angle: 5.1,  radius: 6,  speed: 0.35, cx: 0, cy: 0, drift: 0.9 },
    { id: 'fi13', angle: 1.3,  radius: 5,  speed: 0.65, cx: 0, cy: 0, drift: 1.5 },
    { id: 'fi14', angle: 3.7,  radius: 7,  speed: 0.32, cx: 0, cy: 0, drift: 1.0 },
    { id: 'fi15', angle: 4.2,  radius: 8,  speed: 0.44, cx: 0, cy: 0, drift: 1.2 },
  ];

  // ── Сохраняем refs ──
  const icons = vortexParams.map(p => ({
    ...p,
    el: document.getElementById(p.id),
    // текущий угол (будет меняться в raf)
    a: p.angle,
    // медленный дрейф центра (чтобы орбита блуждала)
    driftAngle: rnd(0, Math.PI * 2),
    driftRadius: rnd(3, 8),
    driftSpeed: rnd(0.08, 0.18),
  })).filter(p => p.el);

  // ── Intro: плавное появление (stagger) ──
  gsap.set('.fi', { opacity: 0, scale: 0.6 });

  icons.forEach((p, i) => {
    gsap.to(p.el, {
      opacity: rnd(0.72, 0.95),
      scale: 1,
      duration: 0.6,
      delay: 1.0 + i * 0.12,
      ease: 'back.out(1.8)',
    });
  });

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0, mX = 0, mY = 0;
  screen.addEventListener('mousemove', e => {
    const r = screen.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width  - 0.5) * 2;  // −1…+1
    mouseY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  });
  screen.addEventListener('mouseleave', () => {
    mouseX = 0; mouseY = 0;
  });

  // ── Состояние скролла (для ускорения/замедления) ──
  let scrollFactor = 1.0;
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: self => {
      // При прокрутке иконки ускоряются + чуть тускнеют
      scrollFactor = 1 + self.progress * 1.8;
      const layerOpacity = 1 - self.progress * 0.5;
      gsap.to('#fiLayer', { opacity: layerOpacity, duration: 0.3, overwrite: true });
    },
  });

  // ── rAF — главный цикл вихря ──
  let lastT = null;
  const LERP = 0.055;

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); // сек, cap 50ms
    lastT = now;

    // Сглаживаем мышь
    mX += (mouseX - mX) * LERP * 6;
    mY += (mouseY - mY) * LERP * 6;

    icons.forEach(p => {
      if (!p.el) return;

      // Вращаем угол с учётом scrollFactor
      p.a += p.speed * dt * scrollFactor;

      // Дрейф центра орбиты — создаёт «вихревой» эффект
      p.driftAngle += p.driftSpeed * dt;
      const dcx = Math.cos(p.driftAngle) * p.driftRadius;
      const dcy = Math.sin(p.driftAngle) * p.driftRadius * 0.6;

      // Основная орбита (элипс для более органичного движения)
      const ox = Math.cos(p.a) * p.radius + dcx;
      const oy = Math.sin(p.a * 1.3) * p.radius * 0.65 + dcy;

      // Параллакс мыши — разный для разных иконок (глубина)
      const depth = 4 + (p.radius % 4);
      const px = mX * depth;
      const py = mY * depth * 0.7;

      // 3D-наклон
      const rX = Math.sin(p.a * 0.7) * 8;
      const rY = Math.cos(p.a * 0.5) * 10;
      const rZ = Math.sin(p.a * 0.3) * 4;

      // Пульсирующий масштаб
      const s = 0.88 + Math.sin(p.a * 1.1) * 0.12;

      // Динамический blur при быстром движении
      const blurVal = Math.abs(p.speed * scrollFactor - 0.5) * 0.6;

      gsap.set(p.el, {
        x: ox + px,
        y: oy + py,
        rotateX: rX,
        rotateY: rY,
        rotateZ: rZ,
        scale: s,
        filter: `blur(${blurVal.toFixed(2)}px)`,
      });
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── Случайное мерцание ──
  function flicker() {
    const alive = icons.filter(p => parseFloat(gsap.getProperty(p.el,'opacity')) > 0.3);
    if (!alive.length) { setTimeout(flicker, 500); return; }
    const p = alive[Math.floor(Math.random() * alive.length)];
    const cur = parseFloat(gsap.getProperty(p.el, 'opacity')) || 0.85;
    gsap.to(p.el, {
      opacity: rnd(0.15, 0.4),
      duration: 0.1,
      ease: 'none',
      onComplete: () => gsap.to(p.el, { opacity: cur, duration: 0.2, ease: 'power2.out' }),
    });
    setTimeout(flicker, rnd(700, 2800));
  }
  setTimeout(flicker, 3000);

  // ── Scan-line по изображению ──
  function scanLine() {
    const sl = document.createElement('div');
    sl.style.cssText = `
      position:absolute;left:0;right:0;height:2px;top:0;z-index:5;
      pointer-events:none;
      background:linear-gradient(90deg,transparent 0%,rgba(59,130,246,.65) 30%,rgba(140,200,255,.95) 50%,rgba(59,130,246,.65) 70%,transparent 100%);
      border-radius:1px;
      box-shadow:0 0 8px rgba(59,130,246,.45);
    `;
    screen.appendChild(sl);
    gsap.fromTo(sl,
      { top: '0%', opacity: 0 },
      {
        top: '100%', opacity: 1, duration: rnd(2.2, 3.8), ease: 'none',
        onComplete: () => { sl.remove(); setTimeout(scanLine, rnd(5000, 11000)); },
      }
    );
  }
  setTimeout(scanLine, 2500);

})();
