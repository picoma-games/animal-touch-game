(function () {
  'use strict';

  // ---------- データ ----------

  // 最初の3匹 + 問題を重ねるごとに1匹ずつ仲間がふえる
  var ANIMALS = [
    { id: 'cat',      name: 'ねこさん',     emoji: '🐱', color: '#ffd1dc' },
    { id: 'dog',      name: 'いぬさん',     emoji: '🐶', color: '#ffe1b8' },
    { id: 'elephant', name: 'ぞうさん',     emoji: '🐘', color: '#cfe7ff' },
    { id: 'lion',     name: 'ライオンさん', emoji: '🦁', color: '#ffe89a' },
    { id: 'rabbit',   name: 'うさぎさん',   emoji: '🐰', color: '#f3dcff' },
    { id: 'panda',    name: 'パンダさん',   emoji: '🐼', color: '#d9f7d0' },
    { id: 'monkey',   name: 'おさるさん',   emoji: '🐵', color: '#ffd9b3' },
    { id: 'giraffe',  name: 'きりんさん',   emoji: '🦒', color: '#fff2b3' },
    { id: 'pig',      name: 'ぶたさん',     emoji: '🐷', color: '#ffd6e6' },
    { id: 'bear',     name: 'くまさん',     emoji: '🐻', color: '#f0dcc8' },
    { id: 'frog',     name: 'かえるさん',   emoji: '🐸', color: '#d6f5c4' },
    { id: 'chick',    name: 'ひよこさん',   emoji: '🐤', color: '#fff6b0' },
    { id: 'penguin',  name: 'ペンギンさん', emoji: '🐧', color: '#d4ecff' },
    { id: 'tiger',    name: 'とらさん',     emoji: '🐯', color: '#ffe0a8' },
    { id: 'koala',    name: 'コアラさん',   emoji: '🐨', color: '#e4e8f0' }
  ];

  var START_COUNT = 3;
  var GOAL = 5;
  var NEXT_DELAY = 1100; // 正解から次の問題まで
  var PRAISE = ['すごーい！', 'せいかい！', 'やったね！', 'じょうず！', 'ぴんぽーん！', 'あたり！'];
  var STAR_PATH = 'M50 6 L62 37 L95 38 L69 59 L78 92 L50 73 L22 92 L31 59 L5 38 L38 37 Z';

  // ---------- 要素 ----------

  var $ = function (id) { return document.getElementById(id); };
  var screens = { start: $('start'), game: $('game'), finale: $('finale') };
  var stage = $('stage');
  var starsEl = $('stars');
  var askBtn = $('askBtn');

  // ---------- 状態 ----------

  var state = {
    unlocked: START_COUNT,
    totalCorrect: 0,
    score: 0,
    target: null,
    prevTarget: null,
    newcomer: null,
    misses: 0,
    locked: true,
    lastWrongAt: 0,
    choices: [],
    roundTargets: [],
    timers: []
  };

  // ---------- ユーティリティ ----------

  function rand(a, b) { return a + Math.random() * (b - a); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('is-active', k === name);
    });
  }

  function starSvg() {
    return '<svg viewBox="0 0 100 100"><path d="' + STAR_PATH + '"/></svg>';
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ---------- 背景の生成 ----------

  function buildScene() {
    var grass = $('grass');
    var n = Math.ceil(window.innerWidth / 16) + 2;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'blade';
      b.style.left = (i * 16 - 8 + rand(-4, 4)) + 'px';
      b.style.height = rand(26, 54) + 'px';
      b.style.animationDelay = rand(-3, 0) + 's';
      b.style.animationDuration = rand(2.2, 3.6) + 's';
      grass.appendChild(b);
    }

    var flowers = $('flowers');
    ['🌼', '🌷', '🌸', '🌼', '🌷'].forEach(function (f, i, arr) {
      var el = document.createElement('span');
      el.className = 'flower';
      el.textContent = f;
      el.style.left = (6 + (i * 88) / (arr.length - 1) + rand(-3, 3)) + '%';
      el.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + ' + rand(4, 26) + 'px)';
      el.style.animationDelay = rand(-2, 0) + 's';
      flowers.appendChild(el);
    });

    var tw = $('twinkles');
    for (var t = 0; t < 9; t++) {
      var s = document.createElement('span');
      s.className = 'twinkle';
      s.textContent = '✦';
      s.style.left = rand(4, 92) + '%';
      s.style.top = rand(8, 45) + '%';
      s.style.fontSize = rand(12, 24) + 'px';
      s.style.animationDelay = rand(-2.4, 0) + 's';
      tw.appendChild(s);
    }
  }

  function buildStars() {
    starsEl.innerHTML = '';
    for (var i = 0; i < GOAL; i++) {
      var s = document.createElement('span');
      s.className = 'star';
      s.innerHTML = starSvg();
      starsEl.appendChild(s);
    }
  }

  // ---------- 配置 ----------

  // ステージ内に重ならないようにランダム配置
  function layout(n) {
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    var size = Math.min(w * 0.46, h * 0.31, 250);
    for (var shrink = 0; shrink < 8; shrink++) {
      var minD = size * 1.04;
      for (var attempt = 0; attempt < 200; attempt++) {
        var pts = [];
        for (var i = 0; i < n; i++) {
          var ok = false;
          for (var tries = 0; tries < 40 && !ok; tries++) {
            var p = { x: rand(size / 2, w - size / 2), y: rand(size / 2, h - size / 2) };
            ok = pts.every(function (q) {
              return Math.hypot(p.x - q.x, p.y - q.y) >= minD;
            });
            if (ok) pts.push(p);
          }
          if (!ok) break;
        }
        if (pts.length === n) return { size: size, pts: pts };
      }
      size *= 0.92;
    }
    // 念のための固定配置
    return {
      size: size,
      pts: [
        { x: w * 0.3, y: h * 0.2 },
        { x: w * 0.7, y: h * 0.5 },
        { x: w * 0.3, y: h * 0.8 }
      ].slice(0, n)
    };
  }

  function placeAll() {
    var els = stage.querySelectorAll('.animal:not(.is-leaving)');
    if (!els.length) return;
    var L = layout(els.length);
    for (var i = 0; i < els.length; i++) {
      setPos(els[i], L.pts[i], L.size);
    }
  }

  function setPos(el, p, size) {
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.setProperty('--size', size + 'px');
  }

  // ---------- 問題 ----------

  function pool() {
    return ANIMALS.slice(0, state.unlocked);
  }

  function questionText(a) {
    return a.name + '、どーこだ？';
  }

  function ask(interrupt) {
    if (!state.target) return;
    Voice.say(questionText(state.target), { interrupt: !!interrupt, rate: 0.95 });
  }

  function nextQuestion() {
    state.misses = 0;
    state.locked = false;

    var all = pool();
    var target;
    if (state.newcomer) {
      // 新しく仲間になった動物を優先して出題
      target = state.newcomer;
      state.newcomer = null;
    } else {
      var candidates = all.filter(function (a) { return a !== state.prevTarget; });
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }
    var others = shuffle(all.filter(function (a) { return a !== target; })).slice(0, 2);
    var choices = shuffle([target].concat(others));

    state.target = target;
    state.prevTarget = target;
    state.choices = choices;
    stage.dataset.target = target.id;

    renderAnimals(choices);
    ask(false);
  }

  function renderAnimals(choices) {
    stage.innerHTML = '';
    var L = layout(choices.length);
    choices.forEach(function (a, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal';
      btn.dataset.id = a.id;
      btn.setAttribute('aria-label', a.name);
      btn.style.setProperty('--c', a.color);
      btn.style.setProperty('--delay', (i * 0.12) + 's');
      btn.style.setProperty('--bob', rand(1.5, 2.1).toFixed(2) + 's');
      btn.style.setProperty('--bob-delay', rand(-2, 0).toFixed(2) + 's');
      btn.innerHTML =
        '<span class="animal__pop">' +
          '<span class="animal__shadow"></span>' +
          '<span class="animal__bob">' +
            '<span class="animal__halo"></span>' +
            '<span class="animal__body"><span class="animal__emoji">' + a.emoji + '</span></span>' +
          '</span>' +
        '</span>';
      setPos(btn, L.pts[i], L.size);
      btn.addEventListener('pointerdown', function (e) { onAnimal(e, btn, a); });
      stage.appendChild(btn);
      later(function () { Sound.appear(i); }, i * 120 + 80);
    });
  }

  // ---------- タップ ----------

  function ripple(e) {
    var r = stage.getBoundingClientRect();
    var el = document.createElement('span');
    el.className = 'ripple';
    el.style.left = (e.clientX - r.left) + 'px';
    el.style.top = (e.clientY - r.top) + 'px';
    el.addEventListener('animationend', function () { el.remove(); });
    stage.appendChild(el);
  }

  function bodyOf(btn) {
    return btn.querySelector('.animal__body');
  }

  function animateBody(btn, frames, opts) {
    var body = bodyOf(btn);
    if (!body.animate) return null;
    body.getAnimations().forEach(function (an) { an.cancel(); });
    return body.animate(frames, opts);
  }

  function onAnimal(e, btn, animal) {
    e.preventDefault();
    if (state.locked || btn.classList.contains('is-leaving')) return;
    Sound.unlock();
    ripple(e);
    if (animal === state.target) {
      correct(btn);
    } else {
      wrong(btn);
    }
  }

  function correct(btn) {
    state.locked = true;
    btn.classList.remove('is-hint');
    btn.style.zIndex = 5;

    Sound.tap();
    Sound.correct();
    Voice.say(PRAISE[Math.floor(Math.random() * PRAISE.length)], { interrupt: true, pitch: 1.4 });

    // ぎゅっ → びよーん → くるっと一回転 → どしん → ぷるん
    animateBody(btn, [
      { transform: 'translateY(0) scale(1, 1) rotate(0deg)', offset: 0 },
      { transform: 'translateY(4%) scale(1.25, 0.72) rotate(0deg)', offset: 0.1, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      { transform: 'translateY(-70%) scale(0.85, 1.22) rotate(0deg)', offset: 0.38, easing: 'ease-in-out' },
      { transform: 'translateY(-78%) scale(1.05, 1.05) rotate(360deg)', offset: 0.6, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
      { transform: 'translateY(4%) scale(1.3, 0.7) rotate(360deg)', offset: 0.78, easing: 'ease-out' },
      { transform: 'translateY(-12%) scale(0.93, 1.08) rotate(360deg)', offset: 0.88 },
      { transform: 'translateY(0) scale(1, 1) rotate(360deg)', offset: 1 }
    ], { duration: 1000, fill: 'forwards' });

    var c = center(btn);
    FX.burst(c.x, c.y, 140, 15);
    later(function () { FX.burst(c.x, c.y - btn.offsetHeight * 0.6, 90, 12); }, 320);

    // ほかの動物はぽんっと消える
    later(function () {
      stage.querySelectorAll('.animal').forEach(function (el) {
        if (el !== btn) el.classList.add('is-leaving');
      });
    }, 180);

    flyStar(c, state.score);
    state.score += 1;
    state.totalCorrect += 1;
    state.roundTargets.push(state.target);

    // 2問正解するごとに新しい動物が仲間入り（次の問題で登場）
    if (state.totalCorrect % 2 === 0 && state.unlocked < ANIMALS.length) {
      state.unlocked += 1;
      state.newcomer = ANIMALS[state.unlocked - 1];
    }

    later(function () {
      btn.classList.add('is-leaving');
    }, NEXT_DELAY - 250);

    later(function () {
      if (state.score >= GOAL) {
        finale();
      } else {
        nextQuestion();
      }
    }, NEXT_DELAY);
  }

  function wrong(btn) {
    var now = Date.now();
    Sound.tap();
    // ぷるぷるっと首をふる（失敗表示は出さない）
    animateBody(btn, [
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.15, 0.85) rotate(0deg)', offset: 0.12 },
      { transform: 'scale(1) rotate(-12deg)', offset: 0.3 },
      { transform: 'scale(1) rotate(10deg)', offset: 0.5 },
      { transform: 'scale(1) rotate(-6deg)', offset: 0.7 },
      { transform: 'scale(1) rotate(3deg)', offset: 0.85 },
      { transform: 'scale(1) rotate(0deg)' }
    ], { duration: 650, easing: 'ease-out' });

    if (now - state.lastWrongAt < 700) return; // 連打で声が重ならないように
    state.lastWrongAt = now;
    state.misses += 1;
    Sound.soft();
    Voice.say('もういっかい！ ' + questionText(state.target), { interrupt: true, rate: 0.95 });

    if (state.misses >= 2) {
      var right = stage.querySelector('.animal[data-id="' + state.target.id + '"]');
      if (right) right.classList.add('is-hint');
    }
  }

  // 星がHUDまで飛んでいく
  function flyStar(from, index) {
    var slot = starsEl.children[index];
    if (!slot) return;
    var to = center(slot);
    var el = document.createElement('div');
    el.className = 'fly-star';
    el.innerHTML = starSvg();
    document.body.appendChild(el);

    var done = function () {
      el.remove();
      slot.classList.add('is-on');
      Sound.star(index);
      FX.burst(to.x, to.y, 24, 6);
    };

    if (!el.animate) {
      done();
      return;
    }
    var midX = (from.x + to.x) / 2 - 40;
    var midY = (from.y + to.y) / 2;
    var anim = el.animate([
      { transform: 'translate(' + from.x + 'px,' + from.y + 'px) scale(0.4) rotate(0deg)' },
      { transform: 'translate(' + from.x + 'px,' + (from.y - 40) + 'px) scale(1.6) rotate(90deg)', offset: 0.25 },
      { transform: 'translate(' + midX + 'px,' + midY + 'px) scale(1.3) rotate(240deg)', offset: 0.6 },
      { transform: 'translate(' + to.x + 'px,' + to.y + 'px) scale(0.8) rotate(360deg)' }
    ], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = done;
  }

  // ---------- ごほうび ----------

  function finale() {
    state.locked = true;
    stage.innerHTML = '';

    var colors = ['#ff5c8a', '#ff9f1c', '#2ec4b6', '#3a86ff', '#8e5cff'];
    var yatta = $('yatta');
    yatta.innerHTML = '';
    'やったー！'.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.setProperty('--c', colors[i % colors.length]);
      s.style.setProperty('--d', (0.15 + i * 0.1) + 's');
      yatta.appendChild(s);
    });

    var parade = $('parade');
    parade.innerHTML = '';
    state.roundTargets.forEach(function (a, i) {
      var s = document.createElement('span');
      s.textContent = a.emoji;
      s.style.setProperty('--d', (0.9 + i * 0.12) + 's');
      parade.appendChild(s);
    });

    var replay = $('replayBtn');
    replay.classList.remove('is-shown');
    show('finale');

    Sound.fanfare();
    Voice.say('やったー！ ぜんぶ できたね！ すごーい！', { pitch: 1.4 });

    var sz = FX.size();
    FX.rain(4500);
    FX.cannon(0, sz.h, -Math.PI / 3, 120);
    FX.cannon(sz.w, sz.h, -Math.PI * 2 / 3, 120);
    for (var i = 1; i <= 6; i++) {
      (function (i) {
        later(function () {
          FX.burst(rand(sz.w * 0.15, sz.w * 0.85), rand(sz.h * 0.15, sz.h * 0.55), 90, 13);
          Sound.star(i % 4);
        }, i * 450);
      })(i);
    }
    later(function () {
      FX.cannon(0, sz.h, -Math.PI / 3, 100);
      FX.cannon(sz.w, sz.h, -Math.PI * 2 / 3, 100);
    }, 1800);

    later(function () { replay.classList.add('is-shown'); }, 2600);
  }

  // ---------- 開始 ----------

  function startRound() {
    clearTimers();
    state.score = 0;
    state.roundTargets = [];
    buildStars();
    show('game');
    // 画面切り替え後にステージの大きさが決まるので、ここで出題
    nextQuestion();
  }

  $('startBtn').addEventListener('click', function () {
    Sound.unlock();
    Sound.tap();
    // iOS ではユーザー操作の中で最初の読み上げを開始する必要があるため同期で出題する
    startRound();
  });

  $('replayBtn').addEventListener('click', function () {
    Sound.unlock();
    Sound.tap();
    startRound();
  });

  askBtn.addEventListener('click', function () {
    Sound.unlock();
    if (!state.locked) ask(true);
    if (askBtn.animate) {
      askBtn.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.15) rotate(-6deg)' }, { transform: 'scale(1)' }
      ], { duration: 350, easing: 'ease-out' });
    }
  });

  Voice.onSpeakingChange(function (on) {
    askBtn.classList.toggle('is-speaking', on);
  });

  // ---------- 誤操作対策など ----------

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placeAll, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Voice.cancel();
  });

  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  buildScene();
  buildStars();
})();
