// МАЯК — один сайт без перезагрузок.
// «Игры», «Обновления» и «Музыка» — разделы одной страницы (index.html): переключаются без загрузки,
// поэтому музыка играет дальше, а фон, мозаика и шапка не перерисовываются.
// Адреса разделов: ./#updates и ./#music (старые updates/ и music/ перекидывают сюда).
window.MayakView = (function () {
  var root = document.documentElement;
  var VIEWS = { home: "МАЯК — игры в браузере", updates: "Обновления · МАЯК", music: "Музыка · МАЯК" };
  var scrollPos = {};
  var listeners = [];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function viewOf(hash) {
    var h = (hash || "").replace(/^#/, "");
    return h === "updates" || h === "music" ? h : "home";
  }
  function current() { return root.dataset.view || "home"; }

  function markNav(v) {
    document.querySelectorAll(".nav a[data-view]").forEach(function (a) {
      var h = a.getAttribute("href");
      var on = v === "home" ? h === "#games" : a.dataset.view === v;
      a.classList.toggle("on", on);
    });
    document.title = VIEWS[v];
  }

  function apply(v) {
    if (v === "home") delete root.dataset.view; else root.dataset.view = v;
    markNav(v);
    listeners.forEach(function (f) { f(v); });
  }

  // показать раздел; anchor — куда прокрутить на главной (#games, #about)
  function show(v, anchor, instant) {
    var from = current();
    if (v === from) {
      if (anchor) scrollToAnchor(anchor, !instant);
      return;
    }
    scrollPos[from] = window.scrollY;
    var after = function () {
      if (anchor) scrollToAnchor(anchor, false);
      else window.scrollTo(0, v === "home" && scrollPos.home ? scrollPos.home : 0);
    };
    if (instant || reduce) { apply(v); after(); return; }
    if (document.startViewTransition) {
      document.startViewTransition(function () { apply(v); after(); });
      return;
    }
    root.classList.add("view-out");
    setTimeout(function () {
      apply(v); after();
      root.classList.remove("view-out");
      root.classList.add("view-in");
      setTimeout(function () { root.classList.remove("view-in"); }, 380);
    }, 160);
  }

  function scrollToAnchor(id, smooth) {
    var el = document.getElementById(id.replace(/^#/, ""));
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }

  // клики по ссылкам на разделы (меню, крошки, плеер)
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a) return;
    var h = a.getAttribute("href");
    var v = viewOf(h);
    var anchor = v === "home" && h.length > 1 ? h : "";
    if (v === "home" && anchor && !document.getElementById(anchor.slice(1))) return;   // обычный якорь не наш
    e.preventDefault();
    if (location.hash !== h) history.pushState({ v: v }, "", h);
    show(v, anchor);
  });

  // логотип — на главную, наверх
  var logo = document.getElementById("logo");
  if (logo) logo.addEventListener("click", function () {
    if (current() !== "home" || location.hash) history.pushState({ v: "home" }, "", location.pathname);
    scrollPos.home = 0;
    show("home");
  });

  // секретные слова («хрю», «ozra»…) ловятся только на главной, где видны карточки
  window.addEventListener("keydown", function (e) {
    if (current() !== "home" && e.code !== "Space" && e.target === document.body) e.stopPropagation();
  }, true);

  window.addEventListener("popstate", function () {
    var v = viewOf(location.hash);
    show(v, v === "home" && location.hash ? location.hash : "");
  });

  // первый показ: раздел уже выставлен в <head>, тут только меню и прокрутка к якорю
  var v0 = viewOf(location.hash);
  apply(v0);
  if (v0 === "home" && location.hash) setTimeout(function () { scrollToAnchor(location.hash, false); }, 0);

  return {
    current: current,
    go: function (v) { history.pushState({ v: v }, "", v === "home" ? location.pathname : "#" + v); show(v); },
    onChange: function (f) { listeners.push(f); }
  };
})();

// ---------- музыка: один плеер на весь сайт ----------
(function () {
  // чтобы добавить трек — допиши строку сюда и положи mp3 в папку music/
  var TRACKS = [
    { file: "razlom-menu.mp3", title: "Ангар", game: "Разлом", note: "главное меню · 84 BPM", art: "img/rz_hero_s.webp", len: "1:09" },
    { file: "razlom-battle1.mp3", title: "Пояс астероидов", game: "Разлом", note: "боевая тема · 128 BPM", art: "img/rz_cover_s.webp", len: "1:00" },
    { file: "razlom-battle2.mp3", title: "Главный калибр", game: "Разлом", note: "боевая тема · 136 BPM", art: "img/rz_titan_s.webp", len: "0:57" },
    { file: "razlom-finale.mp3", title: "Последние двое", game: "Разлом", note: "финал боя · 148 BPM", art: "img/rz_blast_s.webp", len: "0:26" },
    { file: "pulse-razogrev.mp3", title: "Разогрев", game: "Пульс", note: "уровень 1 · 128 BPM", art: "img/pl_art_razogrev.webp", len: "0:43" },
    { file: "pulse-neon-storm.mp3", title: "Неоновый шторм", game: "Пульс", note: "уровень 2 · 140 BPM", art: "img/pl_art_neon.webp", len: "1:07" },
    { file: "pulse-oskolki.mp3", title: "Осколки", game: "Пульс", note: "уровень 3 · 150 BPM", art: "img/pl_art_oskolki.webp", len: "1:35" },
    { file: "pulse-yadro.mp3", title: "Ядро", game: "Пульс", note: "финальный босс · 160 BPM", art: "img/pl_art_yadro.webp", len: "2:06" },
    { file: "dota3-menu.mp3", title: "Главная тема", game: "Дота 3", note: "из главного меню", art: "img/d3_hero.webp", len: "0:42" },
    { file: "dota3-epic.mp3", title: "Главная тема — эпичная версия", game: "Дота 3", note: "хор, оркестр и барабаны", art: "img/d3_hero.webp", len: "2:45" }
  ];
  var DIR = "music/";
  var root = document.documentElement;
  var audio = document.getElementById("audio");
  var list = document.getElementById("tracks");
  var bar = document.getElementById("nowbar");
  if (!audio || !list || !bar) return;
  var playBtn = document.getElementById("mPlay");
  var seek = document.getElementById("mSeek");
  var cur = -1, seeking = false;

  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }

  TRACKS.forEach(function (t, i) {
    var el = document.createElement("div");
    el.className = "track";
    el.innerHTML =
      '<div class="art" style="background-image:url(' + t.art + ')"></div>' +
      '<div><h3></h3><div class="from"><b></b> · <span></span></div></div>' +
      '<div class="right"><span class="eq"><i></i><i></i><i></i></span><span class="len"></span>' +
      '<a class="dl" title="Скачать mp3" download>⬇</a></div>';
    el.querySelector("h3").textContent = t.title;
    el.querySelector(".from b").textContent = t.game;
    el.querySelector(".from span").textContent = t.note;
    el.querySelector(".len").textContent = t.len;
    var dl = el.querySelector(".dl");
    dl.href = DIR + t.file;
    dl.setAttribute("download", t.game + " — " + t.title + ".mp3");
    dl.addEventListener("click", function (e) { e.stopPropagation(); });
    el.addEventListener("click", function () { if (i === cur) toggle(); else load(i, true); });
    list.appendChild(el);
  });

  function rows() { return list.querySelectorAll(".track"); }
  function load(i, play) {
    cur = (i + TRACKS.length) % TRACKS.length;
    var t = TRACKS[cur];
    audio.src = DIR + t.file;
    rows().forEach(function (r, k) { r.classList.toggle("on", k === cur); });
    var nt = document.getElementById("mTitle");
    nt.textContent = t.title;
    var sm = document.createElement("small"); sm.textContent = t.game; nt.appendChild(sm);
    root.classList.add("has-track");
    if ("mediaSession" in navigator && window.MediaMetadata) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.game, album: "МАЯК",
          artwork: [{ src: new URL(t.art, location.href).href }] });
      } catch (e) {}
    }
    if (play) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
  }
  function toggle() {
    if (cur < 0) { load(0, true); return; }
    if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } else audio.pause();
  }
  function sync() {
    var p = !audio.paused;
    playBtn.textContent = p ? "❚❚" : "▶";
    root.classList.toggle("music-on", p);
    rows().forEach(function (r, k) { r.classList.toggle("playing", p && k === cur); });
  }
  function prev() { if (audio.currentTime > 3) audio.currentTime = 0; else load(cur - 1, true); }
  function next() { load(cur + 1, true); }

  playBtn.addEventListener("click", toggle);
  document.getElementById("mPrev").addEventListener("click", prev);
  document.getElementById("mNext").addEventListener("click", next);
  var loopBtn = document.getElementById("mLoop");
  loopBtn.addEventListener("click", function () { audio.loop = !audio.loop; loopBtn.classList.toggle("on", audio.loop); });
  // ✕ — выключить музыку и спрятать мини-плеер
  document.getElementById("mClose").addEventListener("click", function () {
    audio.pause();
    audio.removeAttribute("src"); audio.load();
    cur = -1;
    rows().forEach(function (r) { r.classList.remove("on", "playing"); });
    document.getElementById("mTitle").textContent = "Выбери трек";
    document.getElementById("mCur").textContent = "0:00"; document.getElementById("mDur").textContent = "0:00"; seek.value = 0;
    root.classList.remove("has-track");
    sync();
  });

  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("ended", function () { if (cur < TRACKS.length - 1) load(cur + 1, true); else sync(); });
  audio.addEventListener("loadedmetadata", function () { document.getElementById("mDur").textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", function () {
    document.getElementById("mCur").textContent = fmt(audio.currentTime);
    if (!seeking && audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
  });
  seek.addEventListener("input", function () { seeking = true; document.getElementById("mCur").textContent = fmt(seek.value / 1000 * (audio.duration || 0)); });
  seek.addEventListener("change", function () { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; seeking = false; });

  var vol = document.getElementById("mVol");
  var saved = 80;
  try { saved = parseInt(localStorage.getItem("mayak-music-vol") || "80", 10); } catch (e) {}
  vol.value = saved; audio.volume = saved / 100;
  vol.addEventListener("input", function () {
    audio.volume = vol.value / 100;
    try { localStorage.setItem("mayak-music-vol", vol.value); } catch (e) {}
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", toggle);
      navigator.mediaSession.setActionHandler("pause", toggle);
      navigator.mediaSession.setActionHandler("previoustrack", prev);
      navigator.mediaSession.setActionHandler("nexttrack", next);
    } catch (e) {}
  }

  // пробел — пауза, но только в разделе «Музыка» (на главной пробел листает страницу)
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target === document.body && MayakView.current() === "music") { e.preventDefault(); toggle(); }
  });
})();
