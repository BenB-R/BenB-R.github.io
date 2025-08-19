// ====== Slideshow + simple reveal (kept from your base) ======
(() => {
    const slides = Array.from(document.querySelectorAll('.background-slide'));
    if (slides.length) {
      slides.forEach((el) => {
        el.style.backgroundImage = `var(--img)`;
        const start = Math.floor(Math.random() * 100);
        el.style.backgroundPosition = `${start}% 50%`;
      });
      let i = 0;
      const show = (idx) => slides.forEach((el, j) => el.classList.toggle('is-active', j === idx));
      show(i);
      const next = () => { i = (i + 1) % slides.length; show(i); };
      const timer = setInterval(next, 6000);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearInterval(timer);
      }, { once: true });
    }
  
    // CTA micro “zap”
    const ctas = document.querySelectorAll('.cta-button');
    ctas.forEach(btn => {
      btn.addEventListener('mouseenter', () => btn.animate([
        { boxShadow: getComputedStyle(btn).boxShadow, transform: 'translateY(0)' },
        { boxShadow: '0 10px 0 rgba(0,168,255,.22), 0 26px 40px rgba(7,24,46,.22)', transform: 'translateY(-2px)' }
      ], { duration: 140, easing: 'ease-out' }));
    });
  
    // Reveal on scroll
    const revealables = document.querySelectorAll('.project-card, .skill-category');
    revealables.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) {
          target.style.transition = 'opacity 260ms ease, transform 260ms ease';
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
          io.unobserve(target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(el => io.observe(el));
  })();
  
  
  // ====== Gamification (all in code, persisted via localStorage) ======
  (() => {
    const storageKey = 'bb_gamify_v1';
  
    const elements = {
      hudToggle: document.getElementById('hud-toggle'),
      hudPanel: document.getElementById('hud-panel'),
      level: document.getElementById('level'),
      xpLabel: document.getElementById('xp-label'),
      xpBar: document.querySelector('.xp-bar'),
      xpFill: document.getElementById('xp-fill'),
      streak: document.getElementById('streak'),
      badges: document.getElementById('badges'),
      questList: document.getElementById('quest-list'),
      achievementsBtn: document.getElementById('achievements-btn'),
      achievementsModal: document.getElementById('achievements-modal'),
      achievementsClose: document.getElementById('achievements-close'),
      achievementsList: document.getElementById('achievements-list'),
      resetBtn: document.getElementById('reset-progress'),
      toastContainer: document.getElementById('toast-container'),
      confetti: document.getElementById('confetti'),
    };
  
    // --- Data model ---
    const defaultState = () => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastVisit: null, // 'YYYY-MM-DD'
      achievements: {}, // id: true
      clicks: { projectsOpened: {}, socials: {}, contacted: {} },
      flags: { projectsSeen: false, skillsSeen: false, usedSkip: false, openedAchievements: false },
      daily: { date: null, quests: [] } // quests: [{id, title, target, progress, xp, done}]
    });
  
    const ACHIEVEMENTS = [
      { id:'first_visit', icon:'fas fa-bolt',   title:'Fresh Spawn',   desc:'First time here.', xp:50 },
      { id:'projects_seen',icon:'fas fa-compass', title:'Scout: Projects', desc:'Viewed the Projects section.', xp:20 },
      { id:'skills_seen',  icon:'fas fa-book',  title:'Scout: Skills', desc:'Viewed the Skills section.', xp:20 },
      { id:'triple_project',icon:'fas fa-layer-group', title:'Triple Check', desc:'Opened all 3 project links.', xp:40 },
      { id:'play_games',   icon:'fas fa-gamepad', title:'Player', desc:'Clicked “Play Games”.', xp:25 },
      { id:'email',        icon:'fas fa-envelope', title:'Connector', desc:'Clicked Email.', xp:30 },
      { id:'phone',        icon:'fas fa-phone',  title:'Caller', desc:'Clicked Phone.', xp:30 },
      { id:'social',       icon:'fab fa-linkedin', title:'Networker', desc:'Visited socials.', xp:20 },
      { id:'skipper',      icon:'fas fa-forward', title:'Speedrunner', desc:'Used the skip link.', xp:15 },
      { id:'blog',         icon:'fas fa-pen',   title:'Reader', desc:'Opened your blog.', xp:15 },
      { id:'streak_3',     icon:'fas fa-fire-alt', title:'Habit Spark', desc:'3-day streak.', xp:35 },
      { id:'streak_7',     icon:'fas fa-fire',  title:'On a Roll', desc:'7-day streak.', xp:60 },
      { id:'level_3',      icon:'fas fa-star',  title:'Level 3', desc:'Reached Level 3.', xp:0 },
      { id:'level_5',      icon:'fas fa-star-half-alt', title:'Level 5', desc:'Reached Level 5.', xp:0 },
      { id:'konami',       icon:'fas fa-keyboard', title:'Secret Input', desc:'You know the code.', xp:50 },
      { id:'daily_master', icon:'fas fa-tasks', title:'Daily Done', desc:'Completed all daily quests today.', xp:50 },
    ];
  
    const DAILY_POOL = [
      { id:'q_projects', title:'Open any project page (1)', target:1, xp:20 },
      { id:'q_all_three', title:'Open 3 different project pages (3)', target:3, xp:40 },
      { id:'q_skills', title:'View the Skills section (1)', target:1, xp:15 },
      { id:'q_games', title:'Click “Play Games” (1)', target:1, xp:25 },
      { id:'q_social', title:'Visit a social link (1)', target:1, xp:15 },
    ];
  
    const state = load();
  
    // --- Init visit / streak ---
    handleDailyVisit();
    ensureDailyQuests();
    unlock('first_visit'); // harmless if already unlocked
    renderAll();
  
    // --- Event hooks tied to your existing UI ---
    // Skip link
    const skip = document.querySelector('.skip-link');
    if (skip) {
      skip.addEventListener('click', () => {
        awardXP(15, 'Skip to content');
        unlock('skipper');
        bumpQuest('q_projects', 0); // if they skip to projects then scroll will likely trigger as well
      });
    }
  
    // Section observers
    watchSection('#projects', () => {
      if (!state.flags.projectsSeen) {
        state.flags.projectsSeen = true;
        awardXP(20, 'Viewed Projects');
        unlock('projects_seen');
        bumpQuest('q_projects', 1);
        save();
        renderAll();
      }
    });
    watchSection('#skills', () => {
      if (!state.flags.skillsSeen) {
        state.flags.skillsSeen = true;
        awardXP(20, 'Viewed Skills');
        unlock('skills_seen');
        bumpQuest('q_skills', 1);
        save();
        renderAll();
      }
    });
  
    // CTA buttons
    onClick('[data-gamify="view-work"]', () => awardXP(10, 'View My Work'));
    onClick('[data-gamify="play-games"]', () => {
      unlock('play_games');
      bumpQuest('q_games', 1);
    });
  
    // Project links (track unique)
    document.querySelectorAll('.project-link').forEach(a => {
      a.addEventListener('click', () => {
        const card = a.closest('[data-project]');
        if (!card) return;
        const id = card.getAttribute('data-project');
        if (!state.clicks.projectsOpened[id]) {
          state.clicks.projectsOpened[id] = true;
          awardXP(15, `Opened ${id.replace(/-/g,' ')}`);
          bumpQuest('q_all_three', 1);
          save();
          renderAll();
        }
        // if all three opened:
        const all = ['bear-brewery','mind-feast-mod','opengl-caves'];
        if (all.every(p => state.clicks.projectsOpened[p])) unlock('triple_project');
      });
    });
  
    // Contact buttons
    onClick('[data-gamify="email"]', () => unlock('email'));
    onClick('[data-gamify="phone"]', () => unlock('phone'));
  
    // Socials
    onClick('[data-gamify="linkedin"],[data-gamify="itch"]', () => {
      unlock('social'); bumpQuest('q_social', 1);
    });
  
    // Blog link
    onClick('a[href*="../blog/blog.html"]', () => unlock('blog'));
  
    // HUD toggling
    if (elements.hudToggle && elements.hudPanel) {
      elements.hudToggle.addEventListener('click', () => {
        const nowHidden = !elements.hudPanel.hasAttribute('hidden');
        if (nowHidden) {
          elements.hudPanel.setAttribute('hidden','');
          elements.hudToggle.setAttribute('aria-expanded','false');
        } else {
          elements.hudPanel.removeAttribute('hidden');
          elements.hudToggle.setAttribute('aria-expanded','true');
        }
      });
    }
  
    // Achievements modal
    elements.achievementsBtn?.addEventListener('click', () => {
      elements.achievementsModal.removeAttribute('hidden');
      state.flags.openedAchievements = true;
      save();
      renderAll();
    });
    elements.achievementsClose?.addEventListener('click', () => {
      elements.achievementsModal.setAttribute('hidden','');
    });
    elements.achievementsModal?.addEventListener('click', (e) => {
      if (e.target === elements.achievementsModal) elements.achievementsModal.setAttribute('hidden','');
    });
  
    // Reset
    elements.resetBtn?.addEventListener('click', () => {
      if (confirm('Reset all XP, levels, streaks, quests, and achievements?')) {
        setState(defaultState());
        toast('Progress reset.', 'fas fa-undo');
        renderAll();
      }
    });
  
    // Konami code
    konami(() => {
      unlock('konami');
      toast('Secret unlocked! +50 XP', 'fas fa-keyboard');
    });
  
    // --- Functions ---
    function xpForLevel(level) {
      // Gentle curve
      return 100 + (level - 1) * 40;
    }
  
    function awardXP(amount, reason = '') {
      const before = { xp: state.xp, level: state.level };
      state.xp += amount;
      // level ups
      while (state.xp >= xpForLevel(state.level)) {
        state.xp -= xpForLevel(state.level);
        state.level++;
        toast(`Level up! Now Level ${state.level}`, 'fas fa-star');
        confetti(700);
        if (state.level >= 3) unlock('level_3', false);
        if (state.level >= 5) unlock('level_5', false);
      }
      save();
      renderXP();
      if (amount > 0) {
        toast(`+${amount} XP ${reason ? '· ' + reason : ''}`, 'fas fa-bolt');
        pulse(elements.xpBar);
      }
      return { before, after: { xp: state.xp, level: state.level } };
    }
  
    function unlock(id, grantXp = true) {
      if (state.achievements[id]) return false;
      const meta = ACHIEVEMENTS.find(a => a.id === id);
      if (!meta) return false;
      state.achievements[id] = true;
      if (grantXp && meta.xp) awardXP(meta.xp, meta.title);
      save();
      renderBadges();
      renderAchievements();
      return true;
    }
  
    function handleDailyVisit() {
      const today = (new Date()).toISOString().slice(0,10);
      if (state.lastVisit !== today) {
        const yesterday = dateAddDays(today, -1);
        if (state.lastVisit === yesterday) state.streak += 1; else state.streak = 1;
        state.lastVisit = today;
        // daily login XP: up to +100
        const loginXp = Math.min(10 * state.streak, 100);
        awardXP(loginXp, `Daily visit (streak ${state.streak})`);
        if (state.streak >= 3) unlock('streak_3', false);
        if (state.streak >= 7) unlock('streak_7', false);
        save();
      }
    }
  
    function ensureDailyQuests() {
      const today = (new Date()).toISOString().slice(0,10);
      if (state.daily.date === today && state.daily.quests?.length) return;
      // pick 3 distinct quests
      const shuffled = DAILY_POOL.slice().sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0,3).map(q => ({ ...q, progress: 0, done: false }));
      state.daily = { date: today, quests: picked };
      save();
    }
  
    function bumpQuest(id, amount) {
      const q = state.daily.quests.find(q => q.id === id);
      if (!q || q.done) return;
      q.progress = Math.min(q.target, (q.progress || 0) + (amount ?? 1));
      if (q.progress >= q.target) {
        q.done = true;
        awardXP(q.xp, `Quest: ${q.title}`);
        // if all done today:
        if (state.daily.quests.every(x => x.done)) unlock('daily_master');
      }
      save();
      renderQuests();
    }
  
    function renderXP() {
      elements.level.textContent = `Lv ${state.level}`;
      const need = xpForLevel(state.level);
      elements.xpLabel.textContent = `${state.xp} / ${need} XP`;
      const pct = Math.max(0, Math.min(100, (state.xp / need) * 100));
      elements.xpFill.style.width = `${pct}%`;
      elements.xpBar.setAttribute('aria-valuenow', String(Math.round(pct)));
      elements.streak.textContent = state.streak;
    }
  
    function renderBadges() {
      const area = elements.badges; if (!area) return;
      area.innerHTML = '';
      // show up to 6 latest unlocked badges
      const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]).slice(-6);
      unlocked.forEach(a => {
        const el = document.createElement('span');
        el.className = 'badge';
        el.innerHTML = `<i class="${a.icon}"></i> ${a.title}`;
        area.appendChild(el);
      });
    }
  
    function renderQuests() {
      const ul = elements.questList; if (!ul) return;
      ul.innerHTML = '';
      state.daily.quests.forEach(q => {
        const li = document.createElement('li');
        li.className = `quest ${q.done ? 'done' : ''}`;
        li.innerHTML = `
          <span class="q-title">${q.title}</span>
          <span class="q-progress">${q.progress}/${q.target}</span>
        `;
        ul.appendChild(li);
      });
    }
  
    function renderAchievements() {
      const list = elements.achievementsList; if (!list) return;
      list.innerHTML = '';
      ACHIEVEMENTS.forEach(a => {
        const unlocked = !!state.achievements[a.id];
        const row = document.createElement('div');
        row.className = `achievement ${unlocked ? '' : 'locked'}`;
        row.innerHTML = `
          <i class="${a.icon}"></i>
          <div class="a-body">
            <span class="a-title">${a.title}</span>
            <span class="a-desc">${a.desc}</span>
            ${a.xp ? `<span class="a-xp">+${a.xp} XP</span>` : ''}
          </div>
        `;
        list.appendChild(row);
      });
    }
  
    function renderAll() {
      renderXP();
      renderBadges();
      renderQuests();
      renderAchievements();
    }
  
    // --- Utilities ---
    function onClick(selector, fn) {
      document.querySelectorAll(selector).forEach(el => el.addEventListener('click', fn, { passive: true }));
    }
  
    function watchSection(sel, fn) {
      const el = document.querySelector(sel);
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { fn(); obs.disconnect(); }
      }, { threshold: 0.3 });
      obs.observe(el);
    }
  
    function pulse(el) {
      if (!el) return;
      el.classList.remove('pulse'); // reset
      void el.offsetWidth;          // reflow
      el.classList.add('pulse');
    }
  
    function toast(text, icon = 'fas fa-bolt') {
      const t = document.createElement('div');
      t.className = 'toast toast-enter';
      t.innerHTML = `<i class="${icon}"></i> <span>${text}</span>`;
      elements.toastContainer.appendChild(t);
      setTimeout(() => {
        t.style.transition = 'opacity .25s ease, transform .25s ease';
        t.style.opacity = '0'; t.style.transform = 'translate(-50%,8px)';
        setTimeout(() => t.remove(), 250);
      }, 2200);
    }
  
    function confetti(durationMs = 900) {
      const canvas = elements.confetti;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { innerWidth:w, innerHeight:h } = window;
      canvas.width = w; canvas.height = h;
      canvas.hidden = false;
  
      const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * w,
        y: -20 - Math.random() * 200,
        s: 6 + Math.random() * 6,
        v: 2 + Math.random() * 3,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        shape: Math.random() < 0.5 ? 'rect' : 'tri'
      }));
  
      let raf, start = performance.now();
      (function tick(t){
        const dt = (t - start) / durationMs;
        ctx.clearRect(0,0,w,h);
        pieces.forEach(p => {
          p.y += p.v; p.r += p.vr; p.x += Math.sin(p.y * 0.02) * 0.7;
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.fillStyle = `hsl(${(p.x / w) * 360}, 90%, ${60 + Math.sin(p.y*0.1)*20}%)`;
          if (p.shape === 'rect') ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
          else {
            ctx.beginPath();
            ctx.moveTo(0,-p.s/1.2); ctx.lineTo(p.s/1.2,p.s/1.2); ctx.lineTo(-p.s/1.2,p.s/1.2); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        });
        if (t - start < durationMs) raf = requestAnimationFrame(tick);
        else { canvas.hidden = true; cancelAnimationFrame(raf); }
      })(start);
    }
  
    function save() {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* ignore */ }
    }
    function load() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw);
        // merge to avoid missing fields after updates
        return Object.assign(defaultState(), parsed);
      } catch {
        return defaultState();
      }
    }
    function setState(s) { Object.assign(state, s); save(); }
  
    function dateAddDays(isoYYYYMMDD, delta) {
      const d = new Date(isoYYYYMMDD + 'T00:00:00');
      d.setDate(d.getDate() + delta);
      return d.toISOString().slice(0,10);
    }
  
    function konami(callback) {
      const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
      let idx = 0;
      window.addEventListener('keydown', (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const expect = code[idx];
        if (key === expect || (expect==='b' && key==='b') || (expect==='a' && key==='a')) {
          idx++;
          if (idx === code.length) { idx = 0; callback(); }
        } else {
          idx = 0;
        }
      });
    }
  })();
  