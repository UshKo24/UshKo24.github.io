// МАЯК — темы игр. Тема хранится в sessionStorage, чтобы при возврате со страницы игры сайт оставался в её стиле.
window.MayakTheme = (function () {
  var KEY = "mayak-theme";
  var COLORS = { "": "#0e0e10", devyatyi: "#0b1029", turniket: "#f4f4f2", metro: "#f4f2ec", golf: "#1f4d31", arsenal: "#15121a", kot: "#2b2033", mazomus: "#24325c", budka: "#10142e", dota: "#0b0e16", dispatcher: "#0a0d0c", pulse: "#090718" };
  var root = document.documentElement;
  var timer = 0;
  var api = {
    onChange: null,
    get: function () { return root.dataset.theme || ""; },
    set: function (t, instant) {
      t = t || "";
      if (t === api.get()) { if (api.onChange) api.onChange(t); return; }
      if (!instant) {
        root.classList.add("theming");
        clearTimeout(timer);
        timer = setTimeout(function () { root.classList.remove("theming"); }, 750);
      }
      if (t) root.dataset.theme = t; else delete root.dataset.theme;
      try { sessionStorage.setItem(KEY, t); } catch (e) {}
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute("content", COLORS[t] || COLORS[""]);
      if (api.onChange) api.onChange(t);
    },
    remember: function (t) { try { sessionStorage.setItem(KEY, t || ""); } catch (e) {} }
  };
  var m0 = document.querySelector('meta[name="theme-color"]');
  if (m0) m0.setAttribute("content", COLORS[api.get()] || COLORS[""]);
  return api;
})();

// Плавные переходы: в Chrome/Edge работает CSS @view-transition, в остальных браузерах — мягкий fade.
(function () {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if ("onpagereveal" in window) return;            // браузер сам делает view transition
  var root = document.documentElement;
  root.classList.add("fade-in");
  setTimeout(function () { root.classList.remove("fade-in"); }, 450);
  window.addEventListener("pageshow", function () { root.classList.remove("fade-out"); });
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;   // якорь на этой же странице
    if (/\.(zip|apk|mp3|exe)$/i.test(url.pathname)) return;
    e.preventDefault();
    root.classList.add("fade-out");
    setTimeout(function () { location.href = a.href; }, 200);
  });
})();
