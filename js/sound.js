// 効果音（Web Audio API で合成。音声ファイル不要）
window.Sound = (function () {
  'use strict';

  var ctx = null;
  var master = null;

  // iOS Safari はユーザー操作の中で AudioContext を作成・再開する必要がある
  function unlock() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) {
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      // 無音バッファを鳴らして iOS の再生制限を解除
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(master);
      src.start(0);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, at, dur, opts) {
    if (!ctx) return;
    opts = opts || {};
    var t = ctx.currentTime + (at || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    var vol = opts.vol == null ? 0.4 : opts.vol;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  return {
    unlock: unlock,

    // 動物が出てくる「ぽんっ」
    appear: function (i) {
      var f = 520 + (i || 0) * 140;
      tone(f, 0, 0.16, { slide: f * 1.8, vol: 0.25 });
    },

    // ボタンを押した「ぷにっ」
    tap: function () {
      tone(880, 0, 0.08, { slide: 1320, vol: 0.2, type: 'triangle' });
    },

    // 正解「ぴろりろりん♪」
    correct: function () {
      var notes = [784, 988, 1175, 1568];
      notes.forEach(function (f, i) {
        tone(f, i * 0.07, 0.35, { type: 'triangle', vol: 0.32 });
      });
      tone(2093, 0.3, 0.5, { type: 'sine', vol: 0.18 });
    },

    // まちがい：責めない、やわらかい「ぽよん」
    soft: function () {
      tone(330, 0, 0.22, { slide: 440, vol: 0.28 });
      tone(440, 0.12, 0.22, { slide: 330, vol: 0.2 });
    },

    // 星が入る「きらーん」
    star: function (n) {
      var f = 1046 + (n || 0) * 120;
      tone(f, 0, 0.3, { type: 'sine', vol: 0.25 });
      tone(f * 1.5, 0.06, 0.4, { type: 'sine', vol: 0.18 });
    },

    // ごほうびのファンファーレ
    fanfare: function () {
      var seq = [
        [523, 0, 0.15], [523, 0.16, 0.15], [523, 0.32, 0.15], [659, 0.48, 0.5],
        [587, 1.0, 0.15], [659, 1.16, 0.15], [784, 1.32, 0.9]
      ];
      seq.forEach(function (n) {
        tone(n[0], n[1], n[2] + 0.1, { type: 'square', vol: 0.12 });
        tone(n[0] * 2, n[1], n[2] + 0.1, { type: 'triangle', vol: 0.16 });
      });
      [1046, 1318, 1568, 2093].forEach(function (f, i) {
        tone(f, 1.4 + i * 0.08, 0.8, { type: 'sine', vol: 0.12 });
      });
    }
  };
})();
