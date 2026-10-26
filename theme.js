// МАЯК — темы игр. Тема хранится в sessionStorage, чтобы при возврате со страницы игры сайт оставался в её стиле.
window.MayakTheme = (function () {
  var KEY = "mayak-theme";
  var COLORS = { "": "#0e0e10", devyatyi: "#0b1029", turniket: "#f4f4f2" };
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
