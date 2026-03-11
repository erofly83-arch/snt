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

    // Loss-framing block
    const lossMoneyEl = document.getElementById('calcLossMoney');
    const lossROIEl   = document.getElementById('calcLossROI');
    if (lossMoneyEl) {
      const perMonth = Math.round(savedMoney / 12);
      lossMoneyEl.textContent = perMonth > 0
        ? perMonth.toLocaleString('ru') + ' ₽'
        : '—';
    }
    if (lossROIEl) {
      lossROIEl.textContent = roiText === '—' ? '—' : roiText + ' мес.';
    }

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
   FLOATING ICONS ANIMATION v3
   Orbit + cursor attraction + ripple waves
══════════════════════════════════════════════ */
(function() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const screen = document.querySelector('#heroBrowserScreen');
  if (!screen) return;
  if (window.innerWidth <= 768) return;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  const PI2 = Math.PI * 2;

  // ── Стартовые позиции ──
  const startPos = {
    fi1:  { left:'76%', top:'6%'  },
    fi2:  { left:'10%', top:'10%' },
    fi3:  { left:'82%', top:'72%' },
    fi4:  { left:'52%', top:'82%' },
    fi36: { left:'36%', top:'22%' },
    fi37: { left:'68%', top:'58%' },
    fi38: { left:'14%', top:'92%' },
    fi39: { left:'90%', top:'26%' },
    fi40: { left:'48%', top:'44%' },
  };

  Object.entries(startPos).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (el) { el.style.left = pos.left; el.style.top = pos.top; }
  });

  // ── Параметры вихря ──
  const params = [
    { id:'fi1',  spd:0.90, r:9,  type:'orbit',   da:0.14, dr:6 },
    { id:'fi2',  spd:1.10, r:11, type:'figure8',  da:0.18, dr:7 },
    { id:'fi3',  spd:0.85, r:10, type:'orbit',   da:0.12, dr:5 },
    { id:'fi4',  spd:1.00, r:8,  type:'figure8',  da:0.16, dr:6 },
    { id:'fi36', spd:0.95, r:10, type:'figure8', da:0.16, dr:6 },
    { id:'fi37', spd:1.15, r:9,  type:'orbit',   da:0.18, dr:5 },
    { id:'fi38', spd:0.80, r:11, type:'spiral',  da:0.13, dr:7 },
    { id:'fi39', spd:1.05, r:8,  type:'figure8', da:0.17, dr:5 },
    { id:'fi40', spd:0.88, r:12, type:'orbit',   da:0.14, dr:7 },
  ];

  // ── Размер контейнера ──
  let cW = screen.offsetWidth, cH = screen.offsetHeight;
  const ro = new ResizeObserver(() => { cW = screen.offsetWidth; cH = screen.offsetHeight; });
  ro.observe(screen);

  // ── Строим иконки ──
  const icons = params.map(p => {
    const sp = startPos[p.id];
    return {
      ...p,
      el: document.getElementById(p.id),
      a:        rnd(0, PI2),
      driftA:   rnd(0, PI2),
      driftR:   rnd(p.dr * 0.6, p.dr * 1.4),
      driftSpd: rnd(p.da * 0.7, p.da * 1.3),
      spiralT:  0,
      homeLeft: sp ? parseFloat(sp.left) / 100 : 0.5,
      homeTop:  sp ? parseFloat(sp.top)  / 100 : 0.5,
      // уникальная «парковочная» точка вокруг курсора
      clusterAngle: rnd(0, PI2),
      clusterR:     rnd(10, 45),
    };
  }).filter(p => p.el);

  // ── Базовая opacity ──
  function targetOpacity() {
    return rnd(0.72, 0.95);
  }

  gsap.set('.fi', { opacity: 0, scale: 0.5 });
  icons.forEach((p, i) => {
    gsap.to(p.el, {
      opacity: targetOpacity(),
      scale: 1, duration: 0.5,
      delay: 0.8 + i * 0.06,
      ease: 'back.out(2)',
    });
  });

  // ── Состояние курсора ──
  // attraction: 0 = свободный полёт, 1 = притянуты к курсору
  let attraction = 0;
  let curPxX = cW / 2, curPxY = cH / 2; // курсор в px внутри контейнера
  let mouseX = 0, mouseY = 0, mX = 0, mY = 0; // нормализованный для параллакса

  screen.addEventListener('mousemove', e => {
    const r = screen.getBoundingClientRect();
    curPxX  = e.clientX - r.left;
    curPxY  = e.clientY - r.top;
    mouseX  = (curPxX / r.width  - 0.5) * 2;
    mouseY  = (curPxY / r.height - 0.5) * 2;
  });

  screen.addEventListener('mouseenter', () => {
    gsap.to({ v: attraction }, {
      v: 1, duration: 0.65, ease: 'power2.out',
      onUpdate: function() { attraction = this.targets()[0].v; },
    });
    startRipple();
  });

  screen.addEventListener('mouseleave', () => {
    mouseX = 0; mouseY = 0;
    gsap.to({ v: attraction }, {
      v: 0, duration: 0.9, ease: 'power2.out',
      onUpdate: function() { attraction = this.targets()[0].v; },
    });
    stopRipple();
  });

  // ── Ripple волны ──
  const rippleWrap = document.createElement('div');
  rippleWrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:20;border-radius:inherit;';
  screen.appendChild(rippleWrap);

  let rippleTimer = null;
  let rippleCount = 0;

  function spawnRipple() {
    const ring = document.createElement('div');
    const hue = rippleCount % 2 === 0 ? '200,230,255' : '120,200,120';
    ring.style.cssText = `
      position:absolute;
      border-radius:50%;
      border:1.5px solid rgba(${hue},0.55);
      box-shadow:0 0 6px rgba(${hue},0.25);
      width:20px;height:20px;
      left:${curPxX}px;top:${curPxY}px;
      transform:translate(-50%,-50%) scale(0);
      pointer-events:none;
    `;
    rippleWrap.appendChild(ring);
    rippleCount++;
    gsap.to(ring, {
      scale: 14, opacity: 0,
      duration: 1.4,
      ease: 'power1.out',
      onComplete: () => ring.remove(),
    });
  }

  function startRipple() {
    spawnRipple();
    rippleTimer = setInterval(spawnRipple, 380);
  }
  function stopRipple() {
    clearInterval(rippleTimer);
    rippleTimer = null;
  }

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
  const LERP_M = 0.10;

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    mX += (mouseX - mX) * LERP_M * 6;
    mY += (mouseY - mY) * LERP_M * 6;

    const speed = scrollF * (1 + attraction * 0.4); // лёгкое ускорение при притяжении

    icons.forEach(p => {
      p.a      += p.spd      * dt * speed;
      p.driftA += p.driftSpd * dt * speed;

      const dcx = Math.cos(p.driftA) * p.driftR;
      const dcy = Math.sin(p.driftA * 1.4) * p.driftR * 0.55;

      let ox, oy;
      if (p.type === 'figure8') {
        ox = Math.sin(p.a)           * p.r * 1.1 + dcx;
        oy = Math.sin(p.a * 2 + 0.6) * p.r * 0.55 + dcy;
      } else if (p.type === 'spiral') {
        p.spiralT += dt * speed * 0.4;
        const rr = p.r * (0.75 + Math.sin(p.spiralT) * 0.35);
        ox = Math.cos(p.a) * rr + dcx;
        oy = Math.sin(p.a) * rr * 0.7 + dcy;
      } else {
        ox = Math.cos(p.a) * p.r + dcx;
        oy = Math.sin(p.a * 1.25) * p.r * 0.65 + dcy;
      }

      // Параллакс мыши (только при свободном полёте)
      const depth = 2 + (p.r % 5);
      ox += mX * depth * (1 - attraction);
      oy += mY * depth * 0.65 * (1 - attraction);

      // ── Притяжение к курсору ──
      if (attraction > 0.001) {
        const homeX = p.homeLeft * cW;
        const homeY = p.homeTop  * cH;

        // точка кластера вокруг курсора (уникальна для каждой иконки)
        const clX = Math.cos(p.clusterAngle) * p.clusterR;
        const clY = Math.sin(p.clusterAngle) * p.clusterR * 0.6;

        const attrX = (curPxX - homeX) + clX;
        const attrY = (curPxY - homeY) + clY;

        ox = ox * (1 - attraction) + attrX * attraction;
        oy = oy * (1 - attraction) + attrY * attraction;
      }

      // 3D-вращение
      const rX = Math.sin(p.a * 0.65) * 10;
      const rY = Math.cos(p.a * 0.45) * 13;
      const rZ = Math.sin(p.a * 0.28) * 5;

      // ── Пульс-волна от курсора (расстояние = фаза) ──
      let sc = 0.86 + Math.sin(p.a * 1.3 + 0.5) * 0.14;
      if (attraction > 0.05) {
        // расстояние от «домашней» точки до курсора
        const dx = p.homeLeft * cW - curPxX;
        const dy = p.homeTop  * cH - curPxY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wavePhase = dist * 0.025; // дальше = позже
        const wave = Math.sin(now * 0.005 - wavePhase) * 0.22 * attraction;
        sc += wave;
      }

      const blurV = (p.spd > 1.5 && speed > 1.5)
        ? ((p.spd * speed - 1.5) * 0.15).toFixed(2)
        : '0';

      gsap.set(p.el, {
        x: ox, y: oy,
        rotateX: rX, rotateY: rY, rotateZ: rZ,
        scale: Math.max(0.3, sc),
        filter: blurV !== '0' ? `blur(${blurV}px)` : 'none',
      });
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── Мерцание ──
  function flicker() {
    const p = icons[Math.floor(Math.random() * icons.length)];
    if (!p || !p.el) { setTimeout(flicker, 400); return; }

    // не мерцаем при активном притяжении
    if (attraction > 0.5) { setTimeout(flicker, rnd(600, 2000)); return; }

    const curOp = parseFloat(gsap.getProperty(p.el, 'opacity')) || 0.8;
    gsap.to(p.el, {
      opacity: rnd(0.05, 0.3), duration: 0.08, ease: 'none',
      onComplete: () => gsap.to(p.el, { opacity: curOp, duration: 0.15, ease: 'power2.out' }),
    });
    setTimeout(flicker, rnd(300, 1800));
  }
  setTimeout(flicker, 2000);

})();
