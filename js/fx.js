// 紙吹雪・星・ハートのパーティクル（canvas）
window.FX = (function () {
  'use strict';

  var COLORS = ['#ff5c8a', '#ffcf3a', '#4cc9f0', '#7ae582', '#b388ff', '#ff9f43', '#ffffff'];
  var MAX = 900;

  var canvas = document.getElementById('fx');
  var ctx = canvas.getContext('2d');
  var dpr = 1;
  var W = 0;
  var H = 0;
  var parts = [];
  var running = false;
  var last = 0;
  var rainUntil = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function add(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function make(x, y, angle, speed, kind) {
    var size = kind === 'confetti' ? rand(8, 14) : rand(14, 26);
    return {
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      g: kind === 'confetti' ? 0.18 : 0.22,
      drag: kind === 'confetti' ? 0.965 : 0.975,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.25, 0.25),
      flip: rand(0, Math.PI * 2),
      vflip: rand(0.1, 0.3),
      wobble: rand(0.5, 1.6),
      size: size,
      color: kind === 'heart' ? pick(['#ff5c8a', '#ff7eb3', '#ff3d6e']) :
             kind === 'star' ? pick(['#ffcf3a', '#ffe066', '#fff3a8']) : pick(COLORS),
      kind: kind,
      life: 0,
      max: rand(90, 150)
    };
  }

  function kindOf(mix) {
    var r = Math.random();
    if (r < mix.confetti) return 'confetti';
    if (r < mix.confetti + mix.star) return 'star';
    return 'heart';
  }

  var MIX = { confetti: 0.55, star: 0.25, heart: 0.2 };

  // 中心から放射状に（やや上向き）
  function burst(x, y, count, power) {
    count = count || 120;
    power = power || 14;
    for (var i = 0; i < count; i++) {
      var a = rand(0, Math.PI * 2);
      var s = rand(power * 0.35, power);
      var p = make(x, y, a, s, kindOf(MIX));
      p.vy -= rand(3, 7);
      add(p);
    }
  }

  // 下の角からクラッカー
  function cannon(x, y, angle, count) {
    for (var i = 0; i < count; i++) {
      add(make(x, y, angle + rand(-0.35, 0.35), rand(14, 28), kindOf(MIX)));
    }
  }

  // 上から降らせる
  function rain(ms) {
    rainUntil = Math.max(rainUntil, performance.now() + ms);
    add(make(rand(0, W), -20, Math.PI / 2, 1, 'confetti'));
  }

  function star(c, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 === 0 ? r : r * 0.48;
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    c.fill();
  }

  function heart(c, r) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.35);
    ctx.bezierCurveTo(-r * 1.1, -r * 0.35, -r * 0.5, -r * 1.05, 0, -r * 0.45);
    ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 1.1, -r * 0.35, 0, r * 0.35);
    ctx.closePath();
    c.fill();
  }

  function loop(now) {
    var dt = Math.min((now - last) / 16.67, 3);
    last = now;

    if (now < rainUntil) {
      for (var k = 0; k < 3; k++) {
        var p0 = make(rand(0, W), -20, Math.PI / 2, rand(1, 3), Math.random() < 0.75 ? 'confetti' : pick(['star', 'heart']));
        p0.max = 400;
        add(p0);
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      if (p.kind === 'confetti') p.vy = Math.min(p.vy, 4.5); // ひらひら落ちる
      p.flip += p.vflip * dt;
      p.x += (p.vx + Math.sin(p.flip) * p.wobble) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      if (p.life > p.max || p.y > H + 40) {
        parts.splice(i, 1);
        continue;
      }

      var fade = p.life > p.max * 0.7 ? 1 - (p.life - p.max * 0.7) / (p.max * 0.3) : 1;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'confetti') {
        ctx.scale(1, Math.cos(p.flip)); // 裏返るような立体感
        ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
      } else if (p.kind === 'star') {
        star(ctx, 0, 0, p.size / 2);
      } else {
        heart(ctx, p.size / 2);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (parts.length || now < rainUntil) {
      requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  return {
    burst: burst,
    cannon: cannon,
    rain: rain,
    size: function () { return { w: W, h: H }; }
  };
})();
