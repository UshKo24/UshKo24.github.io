// МАЯК — фоновая загрузка движка Godot.
// Движок общий для всех игр, поэтому его можно скачать заранее, пока человек смотрит сайт.
// Файл попадает в кэш браузера, и игра при запуске берёт его оттуда.
window.MayakPreload = (function () {
  var ENGINE = "engine/godot-4.7.2/godot";
  var WASM_SIZE = 39514754;
  var state = { started: false, done: false, failed: false, loaded: 0, total: WASM_SIZE, waiters: [] };

  function finish(ok) {
    state.done = ok; state.failed = !ok;
    state.waiters.splice(0).forEach(function (f) { f(ok); });
  }

  function pull(url, onBytes) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      if (!r.body || !r.body.getReader) return r.arrayBuffer().then(function (b) { onBytes(b.byteLength); });
      var reader = r.body.getReader();
      return (function next() {
        return reader.read().then(function (x) {
          if (x.done) return;
          onBytes(x.value.byteLength);
          return next();
        });
      })();
    });
  }

  // base — путь к корню сайта ("" на главной, "../" на странице игры); extra — файлы игры (пакет)
  function start(base, extra) {
    if (state.started) return;
    var c = navigator.connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;   // экономия трафика
    state.started = true;
    var files = [base + ENGINE + ".js"].concat(extra || []);
    files.forEach(function (u) { pull(u, function () {}).catch(function () {}); });
    pull(base + ENGINE + ".wasm", function (n) { state.loaded += n; })
      .then(function () { finish(true); }, function () { finish(false); });
  }

  return {
    start: start,
    // запустить, когда браузер освободится (чтобы не мешать загрузке самой страницы)
    startIdle: function (base, extra, delay) {
      var go = function () { start(base, extra); };
      window.addEventListener("load", function () {
        setTimeout(function () {
          if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else go();
        }, delay || 0);
      });
    },
    busy: function () { return state.started && !state.done && !state.failed; },
    progress: function () { return Math.min(1, state.loaded / state.total); },
    // дождаться окончания фоновой загрузки (или сразу, если её нет)
    wait: function (cb) {
      if (!this.busy()) { cb(state.done); return; }
      state.waiters.push(cb);
    }
  };
})();
