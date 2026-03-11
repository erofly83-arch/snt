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
   FLOATING ICONS ANIMATION v2
   Быстрый вихрь + белые мелкие элементы
   Только внутри .browser-screen
══════════════════════════════════════════════ */
(function() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const screen = document.querySelector('#heroBrowserScreen');
  if (!screen) return;

  // На мобильных не запускаем анимацию — она тормозит скролл
  if (window.innerWidth <= 768) return;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  const PI2 = Math.PI * 2;

  // ── Стартовые позиции (% от размера контейнера) ──
  // Равномерно покрываем всю площадь изображения
  const startPos = {
    // файлы
    fi1:  { left:'76%', top:'6%'  }, // XLS
    fi2:  { left:'10%', top:'10%' }, // XLSX
    fi3:  { left:'82%', top:'72%' }, // XLSX
    fi4:  { left:'52%', top:'82%' }, // CSV
    // цветные формулы
    fi5:  { left:'22%', top:'3%'  }, // =ЕСЛИ длинная
    fi6:  { left:'4%',  top:'68%' }, // =ВПР
    fi7:  { left:'58%', top:'28%' }, // =СУММ
    fi8:  { left:'68%', top:'88%' }, // =C2-D2
    fi9:  { left:'3%',  top:'32%' }, // =ИНДЕКС длинная
    fi10: { left:'40%', top:'48%' }, // =СРЗНАЧ
    fi11: { left:'62%', top:'52%' }, // =СЧЁТЕСЛИ
    fi12: { left:'28%', top:'76%' }, // =МИНЕСЛИ
    // бейджи
    fi13: { left:'44%', top:'16%' }, // Выгодно
    fi14: { left:'16%', top:'56%' }, // Дорого
    fi15: { left:'56%', top:'64%' }, // По штрихкодам
    // белые мелкие
    fi16: { left:'33%', top:'36%' }, // A2
    fi17: { left:'72%', top:'18%' }, // B14
    fi18: { left:'88%', top:'38%' }, // C7
    fi19: { left:'8%',  top:'88%' }, // D3
    fi20: { left:'48%', top:'6%'  }, // 352.8
    fi21: { left:'86%', top:'18%' }, // 423.9
    fi22: { left:'6%',  top:'50%' }, // 193.7
    fi23: { left:'74%', top:'44%' }, // 1740.2
    fi24: { left:'30%', top:'92%' }, // 282.5
    fi25: { left:'20%', top:'44%' }, // dot white
    fi26: { left:'50%', top:'36%' }, // dot blue
    fi27: { left:'90%', top:'58%' }, // dot green
    fi28: { left:'36%', top:'60%' }, // dot white
    fi29: { left:'88%', top:'84%' }, // -12%
    fi30: { left:'4%',  top:'20%' }, // спарклайн
    fi31: { left:'58%', top:'94%' }, // ghost =ВПР
    fi32: { left:'14%', top:'78%' }, // ghost =ЕСЛИ
    fi33: { left:'78%', top:'8%'  }, // ghost СУММ
    fi34: { left:'46%', top:'72%' }, // ×
    fi35: { left:'22%', top:'62%' }, // ✓
    // доп. файлы
    fi36: { left:'36%', top:'22%' }, // XLS
    fi37: { left:'68%', top:'58%' }, // CSV
    fi38: { left:'14%', top:'92%' }, // XLS
    fi39: { left:'90%', top:'26%' }, // CSV
  };

  Object.entries(startPos).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (el) { el.style.left = pos.left; el.style.top = pos.top; }
  });

  // ── Параметры вихря ──
  // speed — БЫСТРЕЕ чем раньше (базовый 0.8–1.8 рад/сек)
  // radius — орбита (px от стартовой точки)
  // type: 'orbit' | 'figure8' | 'spiral' — тип траектории
  const params = [
    // файлы — крупные, средняя скорость, большой радиус
    { id:'fi1',  spd:0.90, r:9,  type:'orbit',   da:0.14, dr:6  },
    { id:'fi2',  spd:1.10, r:11, type:'figure8',  da:0.18, dr:7  },
    { id:'fi3',  spd:0.85, r:10, type:'orbit',   da:0.12, dr:5  },
    { id:'fi4',  spd:1.00, r:8,  type:'figure8',  da:0.16, dr:6  },
    // цветные формулы — быстрее
    { id:'fi5',  spd:0.75, r:14, type:'orbit',   da:0.10, dr:8  },
    { id:'fi6',  spd:1.20, r:12, type:'figure8',  da:0.20, dr:7  },
    { id:'fi7',  spd:1.35, r:10, type:'spiral',  da:0.22, dr:6  },
    { id:'fi8',  spd:1.50, r:9,  type:'orbit',   da:0.24, dr:5  },
    { id:'fi9',  spd:0.80, r:15, type:'figure8',  da:0.11, dr:9  },
    { id:'fi10', spd:1.25, r:11, type:'spiral',  da:0.19, dr:6  },
    { id:'fi11', spd:1.40, r:10, type:'orbit',   da:0.21, dr:7  },
    { id:'fi12', spd:1.10, r:12, type:'figure8',  da:0.17, dr:6  },
    // бейджи
    { id:'fi13', spd:1.30, r:10, type:'orbit',   da:0.20, dr:5  },
    { id:'fi14', spd:1.45, r:11, type:'figure8',  da:0.23, dr:6  },
    { id:'fi15', spd:1.00, r:13, type:'spiral',  da:0.15, dr:7  },
    // белые мелкие — очень быстрые, малый радиус
    { id:'fi16', spd:1.80, r:6,  type:'orbit',   da:0.30, dr:4  },
    { id:'fi17', spd:2.10, r:5,  type:'figure8',  da:0.35, dr:3  },
    { id:'fi18', spd:1.65, r:7,  type:'orbit',   da:0.28, dr:4  },
    { id:'fi19', spd:2.20, r:5,  type:'spiral',  da:0.36, dr:3  },
    { id:'fi20', spd:1.70, r:6,  type:'figure8',  da:0.27, dr:4  },
    { id:'fi21', spd:1.90, r:5,  type:'orbit',   da:0.32, dr:3  },
    { id:'fi22', spd:2.00, r:6,  type:'figure8',  da:0.33, dr:4  },
    { id:'fi23', spd:1.60, r:7,  type:'spiral',  da:0.26, dr:5  },
    { id:'fi24', spd:1.85, r:5,  type:'orbit',   da:0.31, dr:3  },
    { id:'fi25', spd:2.50, r:4,  type:'orbit',   da:0.40, dr:3  },
    { id:'fi26', spd:2.80, r:4,  type:'figure8',  da:0.45, dr:2  },
    { id:'fi27', spd:2.60, r:4,  type:'orbit',   da:0.42, dr:3  },
    { id:'fi28', spd:2.40, r:5,  type:'figure8',  da:0.38, dr:3  },
    { id:'fi29', spd:1.55, r:7,  type:'spiral',  da:0.25, dr:5  },
    { id:'fi30', spd:0.95, r:9,  type:'orbit',   da:0.15, dr:6  },
    { id:'fi31', spd:2.30, r:4,  type:'figure8',  da:0.37, dr:3  },
    { id:'fi32', spd:2.15, r:5,  type:'orbit',   da:0.34, dr:3  },
    { id:'fi33', spd:2.45, r:4,  type:'figure8',  da:0.39, dr:2  },
    { id:'fi34', spd:2.70, r:5,  type:'spiral',  da:0.43, dr:3  },
    { id:'fi35', spd:2.55, r:5,  type:'orbit',   da:0.41, dr:3  },
    // доп. файлы
    { id:'fi36', spd:0.95, r:10, type:'figure8', da:0.16, dr:6  },
    { id:'fi37', spd:1.15, r:9,  type:'orbit',   da:0.18, dr:5  },
    { id:'fi38', spd:0.80, r:11, type:'spiral',  da:0.13, dr:7  },
    { id:'fi39', spd:1.05, r:8,  type:'figure8', da:0.17, dr:5  },
  ];

  // ── Строим массив объектов ──
  const icons = params.map(p => ({
    ...p,
    el: document.getElementById(p.id),
    a:  rnd(0, PI2),                    // стартовый угол
    driftA: rnd(0, PI2),                // угол дрейфа центра
    driftR: rnd(p.dr * 0.6, p.dr * 1.4),
    driftSpd: rnd(p.da * 0.7, p.da * 1.3),
    // для spiral — нарастающий радиус
    spiralT: 0,
  })).filter(p => p.el);

  // ── Стартовая opacity по типу элемента ──
  function targetOpacity(id) {
    const n = parseInt(id.replace('fi',''));
    if (n >= 16 && n <= 24) return rnd(0.55, 0.80); // числа
    if (n >= 25 && n <= 28) return rnd(0.60, 0.85); // точки
    if (n >= 31 && n <= 35) return rnd(0.25, 0.45); // ghost / крестики
    return rnd(0.72, 0.95);
  }

  // Скрываем и плавно показываем со stagger
  gsap.set('.fi', { opacity: 0, scale: 0.5 });
  icons.forEach((p, i) => {
    gsap.to(p.el, {
      opacity: targetOpacity(p.id),
      scale: 1,
      duration: 0.5,
      delay: 0.8 + i * 0.06,  // быстрый stagger
      ease: 'back.out(2)',
    });
  });

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0, mX = 0, mY = 0;
  screen.addEventListener('mousemove', e => {
    const r = screen.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    mouseY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  });
  screen.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

  // ── Hover: ускоряем при наведении ──
  let hoverBoost = 1.0;
  screen.addEventListener('mouseenter', () => {
    gsap.to({v:hoverBoost}, { v: 1.6, duration: 0.4, onUpdate: function() { hoverBoost = this.targets()[0].v; } });
  });
  screen.addEventListener('mouseleave', () => {
    gsap.to({v:hoverBoost}, { v: 1.0, duration: 0.6, onUpdate: function() { hoverBoost = this.targets()[0].v; } });
  });

  // ── ScrollTrigger ──
  let scrollF = 1.0;
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top',
    onUpdate: self => {
      scrollF = 1 + self.progress * 2.2;
      gsap.to('#fiLayer', { opacity: 1 - self.progress * 0.55, duration: 0.3, overwrite: true });
    },
  });

  // ── rAF главный цикл ──
  let lastT = null;
  const LERP_M = 0.10; // более отзывчивый mouse lerp

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    // Lerp мыши
    mX += (mouseX - mX) * LERP_M * 6;
    mY += (mouseY - mY) * LERP_M * 6;

    const speed = scrollF * hoverBoost;

    icons.forEach(p => {
      // Шаг угла
      p.a += p.spd * dt * speed;

      // Дрейф центра
      p.driftA += p.driftSpd * dt * speed;
      const dcx = Math.cos(p.driftA) * p.driftR;
      const dcy = Math.sin(p.driftA * 1.4) * p.driftR * 0.55;

      let ox, oy;

      if (p.type === 'figure8') {
        // Фигура восьмёрка — Лиссажу 2:1
        ox = Math.sin(p.a)       * p.r * 1.1 + dcx;
        oy = Math.sin(p.a * 2 + 0.6) * p.r * 0.55 + dcy;

      } else if (p.type === 'spiral') {
        // Спираль: радиус пульсирует синусоидой
        p.spiralT += dt * speed * 0.4;
        const rr = p.r * (0.75 + Math.sin(p.spiralT) * 0.35);
        ox = Math.cos(p.a) * rr + dcx;
        oy = Math.sin(p.a) * rr * 0.7 + dcy;

      } else {
        // Обычная эллиптическая орбита
        ox = Math.cos(p.a) * p.r + dcx;
        oy = Math.sin(p.a * 1.25) * p.r * 0.65 + dcy;
      }

      // Глубина для параллакса мыши
      const depth = 2 + (p.r % 5);
      ox += mX * depth;
      oy += mY * depth * 0.65;

      // 3D-вращение (чуть сильнее для живости)
      const rX = Math.sin(p.a * 0.65) * 10;
      const rY = Math.cos(p.a * 0.45) * 13;
      const rZ = Math.sin(p.a * 0.28) * 5;

      // Пульсирующий scale
      const sc = 0.86 + Math.sin(p.a * 1.3 + 0.5) * 0.14;

      // Blur только на быстрых элементах при высокой скорости
      const blurV = (p.spd > 1.5 && speed > 1.5)
        ? ((p.spd * speed - 1.5) * 0.15).toFixed(2)
        : '0';

      gsap.set(p.el, {
        x: ox, y: oy,
        rotateX: rX, rotateY: rY, rotateZ: rZ,
        scale: sc,
        filter: blurV !== '0' ? `blur(${blurV}px)` : 'none',
      });
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── Мерцание — чаще для белых элементов ──
  function flicker() {
    const pool = icons.filter(p => {
      const n = parseInt(p.id.replace('fi',''));
      return n >= 16; // белые + мелкие мигают чаще
    });
    const all  = icons;
    // 60% шанс взять из белых, 40% из всех
    const src  = Math.random() < 0.6 ? pool : all;
    const p    = src[Math.floor(Math.random() * src.length)];
    if (!p || !p.el) { setTimeout(flicker, 400); return; }

    const curOp = parseFloat(gsap.getProperty(p.el, 'opacity')) || 0.8;
    gsap.to(p.el, {
      opacity: rnd(0.05, 0.3),
      duration: 0.08,
      ease: 'none',
      onComplete: () => gsap.to(p.el, { opacity: curOp, duration: 0.15, ease: 'power2.out' }),
    });
    setTimeout(flicker, rnd(300, 1800)); // быстрее чем раньше
  }
  setTimeout(flicker, 2000);



})();
