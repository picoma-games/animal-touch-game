// 日本語の読み上げ（Web Speech API）
window.Voice = (function () {
  'use strict';

  var synth = window.speechSynthesis;
  var supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
  var voice = null;
  var pending = []; // 発話中の utterance を保持（途中で GC されて onend が来ない問題の対策）
  var onState = function () {};

  var PREFERRED = ['Kyoko', 'O-ren', 'Otoya', 'Hattori', 'Google 日本語'];

  function pickVoice() {
    if (!supported) return;
    var voices = synth.getVoices().filter(function (v) {
      return /^ja(-|_|$)/i.test(v.lang);
    });
    if (!voices.length) return;
    for (var i = 0; i < PREFERRED.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].name.indexOf(PREFERRED[i]) !== -1) {
          voice = voices[j];
          return;
        }
      }
    }
    voice = voices[0];
  }

  if (supported) {
    pickVoice();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', pickVoice);
    } else {
      synth.onvoiceschanged = pickVoice;
    }
  }

  function speakNow(text, opts) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (voice) u.voice = voice;
    u.rate = opts.rate || 1.0;
    u.pitch = opts.pitch || 1.3; // 少し高めでやさしい声に
    u.volume = 1;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      var k = pending.indexOf(u);
      if (k !== -1) pending.splice(k, 1);
      if (!pending.length) onState(false);
      if (opts.onend) opts.onend();
    }
    u.onstart = function () { onState(true); };
    u.onend = finish;
    u.onerror = finish;
    pending.push(u);
    if (synth.paused) synth.resume();
    synth.speak(u);
  }

  /**
   * @param {string} text
   * @param {{interrupt?: boolean, rate?: number, pitch?: number, onend?: Function}} [opts]
   *   interrupt: 読み上げ中のものを止めてすぐ話す（false なら順番待ち）
   */
  function say(text, opts) {
    opts = opts || {};
    if (!supported) {
      if (opts.onend) setTimeout(opts.onend, 600);
      return;
    }
    if (opts.interrupt && (synth.speaking || synth.pending)) {
      pending.slice().forEach(function (u) { u.onend = u.onerror = null; });
      pending = [];
      synth.cancel();
      // iOS は cancel 直後の speak が無視されることがあるので少し待つ
      setTimeout(function () { speakNow(text, opts); }, 80);
      return;
    }
    speakNow(text, opts);
  }

  function cancel() {
    if (!supported) return;
    pending = [];
    synth.cancel();
    onState(false);
  }

  return {
    supported: supported,
    say: say,
    cancel: cancel,
    onSpeakingChange: function (fn) { onState = fn; }
  };
})();
