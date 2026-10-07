(function () {
  'use strict';

  var POPS = ['💖', '⭐', '✨', '💛'];
  var audioCtx = null;

  // iOS Safari はユーザー操作の中でないと音が鳴らないため、初回タップで作成する
  function getAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // 「ぽよん」という短くやさしい音
  function playBoing(baseFreq) {
    var ctx = getAudio();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.3);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  function jump(face) {
    face.classList.remove('is-jumping');
    // 連打しても毎回アニメーションが最初から再生されるようにリフローさせる
    void face.offsetWidth;
    face.classList.add('is-jumping');
  }

  function spawnPops(button, x, y) {
    var rect = button.getBoundingClientRect();
    var cx = x - rect.left;
    var cy = y - rect.top;
    for (var i = 0; i < 4; i++) {
      var el = document.createElement('span');
      el.className = 'pop';
      el.textContent = POPS[Math.floor(Math.random() * POPS.length)];
      var angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.8;
      var dist = 60 + Math.random() * 40;
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      el.addEventListener('animationend', function () {
        this.remove();
      });
      button.appendChild(el);
    }
  }

  function onPress(e) {
    var button = e.currentTarget;
    var face = button.querySelector('.animal__face');
    e.preventDefault();

    button.classList.add('is-pressed');
    jump(face);
    playBoing(Number(button.dataset.pitch) || 330);
    spawnPops(button, e.clientX, e.clientY);

    if (navigator.vibrate) navigator.vibrate(20);
  }

  function onRelease(e) {
    e.currentTarget.classList.remove('is-pressed');
  }

  var animals = document.querySelectorAll('.animal');
  for (var i = 0; i < animals.length; i++) {
    var a = animals[i];
    // pointerdown なら指が触れた瞬間に反応する（幼児の短いタップにも対応）
    a.addEventListener('pointerdown', onPress);
    a.addEventListener('pointerup', onRelease);
    a.addEventListener('pointercancel', onRelease);
    a.addEventListener('pointerleave', onRelease);
    a.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // ピンチズームやスクロールで画面が動かないようにする
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
})();
