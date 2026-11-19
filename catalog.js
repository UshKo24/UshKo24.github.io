// МАЯК — каталог: фильтр игр по жанру и меткам + лента обновлений.
// У карточки на главной: data-genre="<жанр>" и data-tags="<метка> <метка> ...".
// Жанр и метка показываются, только если есть хотя бы одна открытая игра с ними.
// Метка «Недавно обновлено» ставится сама: последнее обновление в updates.js не старше FRESH_DAYS.
(function () {
  var GENRES = [
    ["idle", "Idle / кликер"], ["roguelike", "Рогалик"], ["strategy", "Стратегия"], ["td", "Башенная защита"],
    ["horror", "Хоррор"], ["puzzle", "Головоломки"], ["chess", "Шахматы"], ["tanks", "Танки"],
    ["shooter", "Шутер"], ["arcade", "Аркада / раннер"], ["sim", "Симулятор"], ["manage", "Менеджмент"],
    ["story", "Сюжетная, с выборами"], ["casual", "Казуальная / рандом"], ["sport", "Спорт"], ["sandbox", "Песочница"]
  ];
  var TAGS = [
    ["duo", "На двоих за одним ПК"], ["bots", "Против ботов"], ["friends", "С друзьями"],
    ["short", "Короткая партия"], ["long", "Надолго, с сохранением"], ["endings", "Несколько концовок"],
    ["browser", "В браузере"], ["pc", "Скачать для ПК"], ["phone", "На телефон"],
    ["3d", "3D"], ["pixel", "Пиксель-арт"], ["fresh", "Недавно обновлено"],
    ["wip", "В разработке"], ["fav", "Любимое автора"]
  ];
  var FRESH_DAYS = 14;
  var KEY = "mayak-filter";
  var UPD = window.MAYAK_UPDATES || [];
  var COLORS = { site: "var(--accent)", turniket: "#e8e3d6", metro: "#e2412f", golf: "#ffd23f", arsenal: "#e9b44c",
    kot: "#f5b061", mazomus: "#ff8fb0", budka: "#ffd98a", dota: "#9fb3ff", pulse: "#3ef0ff", dispatcher: "#f2555a", razlom: "#ff9a3c", nextstop: "#ff9f1c", ozrapad: "#ffc93a", vladblast: "#ff7ac8", vpital: "#5865f2" };

  var grid = document.querySelector(".games");
  if (!grid) return;
  var cards = [].slice.call(grid.querySelectorAll(".card[data-game]"));
  var soon = grid.querySelector(".card.soon");

  // автометка «недавно обновлено»
  var now = Date.now();
  var lastByGame = {};
  UPD.forEach(function (u) { var t = Date.parse(u.d); if (!lastByGame[u.g] || t > lastByGame[u.g]) lastByGame[u.g] = t; });
  function tagsOf(c) {
    var t = (c.dataset.tags || "").trim().split(/\s+/).filter(Boolean);
    var last = lastByGame[c.dataset.game];
    if (last && now - last < FRESH_DAYS * 864e5 && t.indexOf("fresh") < 0) t.push("fresh");
    return t;
  }

  // ---------- метки на карточке: только настоящие (жанр и метки из фильтра), строятся сами из data-genre / data-tags ----------
  var SHORT_G = { idle: "idle", roguelike: "рогалик", strategy: "стратегия", td: "башенная защита", horror: "хоррор",
    puzzle: "головоломка", chess: "шахматы", tanks: "танки", shooter: "шутер", arcade: "аркада", sim: "симулятор",
    manage: "менеджмент", story: "сюжетная", casual: "казуальная", sport: "спорт", sandbox: "песочница" };
  var SHORT_T = [["3d", "3D"], ["pixel", "пиксель-арт"], ["duo", "на двоих"], ["bots", "против ботов"], ["friends", "с друзьями"],
    ["endings", "несколько концовок"], ["wip", "в разработке"], ["short", "короткие партии"], ["long", "надолго"]];
  var MAX_TAGS = 5;
  cards.forEach(function (c) {
    var box = c.querySelector(".tags");
    if (!box) return;
    var t = (c.dataset.tags || "").split(/\s+/);
    var has = function (x) { return t.indexOf(x) >= 0; };
    var out = [];
    if (SHORT_G[c.dataset.genre]) out.push(SHORT_G[c.dataset.genre]);
    if (c.hasAttribute("data-secret") || c.querySelector(".flag.secret")) out.push("секретная");
    // платформа одной меткой
    if (!has("browser")) out.push("только скачать");
    else if (has("phone")) out.push("ПК и телефон");
    else out.push("только ПК");
    SHORT_T.forEach(function (x) { if (has(x[0])) out.push(x[1]); });
    box.innerHTML = "";
    out.slice(0, MAX_TAGS).forEach(function (label) {
      var s = document.createElement("span"); s.className = "tag"; s.textContent = label; box.appendChild(s);
    });
  });

  var state = { genre: "", tags: [] };
  try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s) state = { genre: s.genre || "", tags: s.tags || [] }; } catch (e) {}

  // ---------- фильтры: одна рамка справа над играми, по стрелке выпадают жанры и метки ----------
  var head = grid.parentNode.querySelector(".section-title") || grid.parentNode;
  head.classList.add("has-filter");
  var fbox = document.createElement("div");
  fbox.className = "fbox";
  fbox.innerHTML =
    '<button class="ftoggle" type="button" aria-expanded="false" aria-controls="fPanel">' +
      '<svg class="f-ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M6 10h8M8.5 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>' +
      '<span class="f-sum">Жанры и метки</span><span class="f-count"></span>' +
      '<svg class="f-arrow" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '</button>' +
    '<button class="fclear" type="button" title="Сбросить фильтры" hidden>✕</button>';
  var chipsRow = head.querySelector(".chips");
  (chipsRow || head).appendChild(fbox);
  var panel = document.createElement("div");
  panel.className = "fpanel";
  panel.id = "fPanel";
  panel.innerHTML =
    '<div class="f-row"><span class="f-label">Жанр</span><div class="f-chips" id="fGenres"></div></div>' +
    '<div class="f-row"><span class="f-label">Метки</span><div class="f-chips" id="fTags"></div></div>' +
    '<div class="f-foot"><span class="f-found"></span><button class="chip f-reset" type="button">Сбросить всё</button></div>';
  head.appendChild(panel);
  var toggleBtn = fbox.querySelector(".ftoggle");
  function setOpen(on) {
    panel.classList.toggle("open", on);
    fbox.classList.toggle("open", on);
    toggleBtn.setAttribute("aria-expanded", on ? "true" : "false");
  }
  toggleBtn.addEventListener("click", function (e) { e.stopPropagation(); setOpen(!panel.classList.contains("open")); });
  fbox.querySelector(".fclear").addEventListener("click", function (e) { e.stopPropagation(); reset(); });
  panel.querySelector(".f-reset").addEventListener("click", reset);
  panel.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  if (window.MayakView) MayakView.onChange(function () { setOpen(false); });

  var empty = document.createElement("div");
  empty.className = "f-empty";
  empty.innerHTML = 'Под такие фильтры игр пока нет. <button class="chip" type="button">Сбросить</button>';
  empty.hidden = true;
  grid.parentNode.insertBefore(empty, grid.nextSibling);
  empty.querySelector("button").addEventListener("click", reset);

  function open(c) { return !c.hidden; }
  function match(c, genre, tags) {
    if (genre && c.dataset.genre !== genre) return false;
    var t = tagsOf(c);
    for (var i = 0; i < tags.length; i++) if (t.indexOf(tags[i]) < 0) return false;
    return true;
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function reset() { state = { genre: "", tags: [] }; save(); render(); }

  function chip(label, n, on, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (on ? " on" : "");
    b.innerHTML = label + (n !== null ? ' <span class="n">' + n + "</span>" : "");
    b.addEventListener("click", onClick);
    return b;
  }

  function render() {
    var vis = cards.filter(open);
    // убрать из выбора то, чего больше нет
    if (state.genre && !vis.some(function (c) { return c.dataset.genre === state.genre; })) state.genre = "";
    state.tags = state.tags.filter(function (t) { return vis.some(function (c) { return tagsOf(c).indexOf(t) >= 0; }); });

    var gBox = document.getElementById("fGenres"), tBox = document.getElementById("fTags");
    gBox.innerHTML = ""; tBox.innerHTML = "";
    gBox.appendChild(chip("Все", vis.filter(function (c) { return match(c, "", state.tags); }).length, !state.genre, function () { state.genre = ""; save(); render(); }));
    GENRES.forEach(function (g) {
      var total = vis.filter(function (c) { return c.dataset.genre === g[0]; }).length;
      if (!total) return;
      var n = vis.filter(function (c) { return match(c, g[0], state.tags); }).length;
      var on = state.genre === g[0];
      var b = chip(g[1], n, on, function () { state.genre = on ? "" : g[0]; save(); render(); });
      if (!n && !on) b.classList.add("dim");
      gBox.appendChild(b);
    });
    var anyTag = false;
    TAGS.forEach(function (t) {
      var total = vis.filter(function (c) { return tagsOf(c).indexOf(t[0]) >= 0; }).length;
      if (!total) return;
      anyTag = true;
      var on = state.tags.indexOf(t[0]) >= 0;
      var others = state.tags.filter(function (x) { return x !== t[0]; });
      var n = vis.filter(function (c) { return match(c, state.genre, others.concat([t[0]])); }).length;
      var b = chip(t[1], n, on, function () {
        if (on) state.tags = others; else state.tags = state.tags.concat([t[0]]);
        save(); render();
      });
      if (!n && !on) b.classList.add("dim");
      tBox.appendChild(b);
    });
    tBox.parentNode.hidden = !anyTag;

    var shown = 0;
    cards.forEach(function (c) {
      var ok = match(c, state.genre, state.tags);
      c.classList.toggle("filtered", !ok);
      if (ok && open(c)) shown++;
    });
    var active = !!(state.genre || state.tags.length);
    if (soon) soon.classList.toggle("filtered", active);
    empty.hidden = shown > 0;
    // что видно в самой рамке: выбранные жанр и метки и сколько игр под них подходит
    var names = [];
    if (state.genre) GENRES.forEach(function (g) { if (g[0] === state.genre) names.push(g[1]); });
    state.tags.forEach(function (t) { TAGS.forEach(function (x) { if (x[0] === t) names.push(x[1]); }); });
    fbox.querySelector(".f-sum").textContent = names.length ? names.join(" · ") : "Жанры и метки";
    fbox.querySelector(".f-count").textContent = shown;
    fbox.classList.toggle("active", active);
    fbox.querySelector(".fclear").hidden = !active;
    panel.querySelector(".f-found").textContent = active ? "Подходит игр: " + shown + " из " + vis.length : "Всего игр: " + vis.length;
    panel.querySelector(".f-reset").hidden = !active;
    renderFeed();
  }

  // ---------- лента обновлений ----------
  var feed = document.getElementById("feed");
  var feedChips = document.getElementById("feedChips");
  var feedMore = document.getElementById("feedMore");
  var feedGame = "";
  var feedLimit = 15;
  var MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  function cardOf(g) { return grid.querySelector('.card[data-game="' + g + '"]'); }
  function gameVisible(g) { if (g === "site") return true; var c = cardOf(g); return !!(c && !c.hidden); }
  function gameName(g) { if (g === "site") return "Сайт"; var c = cardOf(g); var h = c && c.querySelector("h3"); return h ? h.textContent.trim() : g; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }

  function renderFeed() {
    if (!feed) return;
    var list = UPD.filter(function (u) { return gameVisible(u.g); });
    if (feedGame && !list.some(function (u) { return u.g === feedGame; })) feedGame = "";
    // кнопки «по игре»
    if (feedChips) {
      feedChips.innerHTML = "";
      var seen = [];
      list.forEach(function (u) { if (seen.indexOf(u.g) < 0) seen.push(u.g); });
      feedChips.appendChild(chip("Всё", null, !feedGame, function () { feedGame = ""; feedLimit = 15; renderFeed(); }));
      seen.forEach(function (g) {
        var on = feedGame === g;
        feedChips.appendChild(chip(esc(gameName(g)), null, on, function () { feedGame = on ? "" : g; feedLimit = 15; renderFeed(); }));
      });
    }
    var rows = list.filter(function (u) { return !feedGame || u.g === feedGame; });
    feed.innerHTML = "";
    rows.slice(0, feedLimit).forEach(function (u) {
      var d = new Date(u.d + "T12:00:00");
      var el = document.createElement("article");
      el.className = "upd";
      var c = cardOf(u.g);
      var name = esc(gameName(u.g));
      var title = u.g === "site" ? name : (c ? '<a href="' + esc(c.dataset.href) + '">' + name + "</a>" : name);
      var ver = u.v ? ' <span class="v">' + esc(u.v) + "</span>" : "";
      var nm = u.n ? ' <span class="nm">«' + esc(u.n) + "»</span>" : (u.g === "site" ? "" : ' <span class="nm fix">исправления</span>');
      if (u.g === "site" && u.n) nm = ' <span class="nm">' + esc(u.n) + "</span>";
      var fresh = now - d.getTime() < 3 * 864e5 ? '<span class="fresh">новое</span>' : "";
      el.innerHTML =
        '<div class="u-date"><b>' + d.getDate() + "</b>" + MONTHS[d.getMonth()] + "</div>" +
        '<div class="u-body"><div class="u-head"><i class="dot" style="background:' + (COLORS[u.g] || "var(--accent)") + '"></i>' +
        title + ver + nm + fresh + "</div>" +
        "<ul>" + (u.i || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
      feed.appendChild(el);
    });
    if (feedMore) {
      feedMore.hidden = rows.length <= feedLimit;
      feedMore.textContent = "Показать ещё (" + (rows.length - feedLimit) + ")";
    }
  }
  if (feedMore) feedMore.addEventListener("click", function () { feedLimit += 20; renderFeed(); });

  // секретная игра открылась — пересчитать фильтры и ленту
  var mo = new MutationObserver(render);
  cards.forEach(function (c) { mo.observe(c, { attributes: true, attributeFilter: ["hidden"] }); });


  // ---------- метки «новое» и «новое обновление» ----------
  // «новое» — игра вышла не раньше NEW_DAYS дней назад (первая запись в updates.js) и человек её ещё не видел.
  // «новое обновление» — в игре вышло обновление за NEW_DAYS дней, а человек видел её до этого обновления.
  // «Видел» = карточка пробыла на экране SEEN_MS (хотя бы наполовину). Тогда метка плавно гаснет и больше не появляется.
  // Проверка: ./?new — «новое» на всех играх, ./?upd — «новое обновление» на всех (просмотры не запоминаются).
  var NEW_DAYS = 7, SEEN_MS = 500;
  var DEMO_UNTIL = Date.parse("2026-11-22T00:00:00");   // до этой даты «новое» показывается на всех играх, которые человек ещё не видел
  var SEEN_KEY = "mayak-seen", DEMO_KEY = "mayak-seen-demo";
  var firstByGame = {}, keyByGame = {};
  UPD.forEach(function (u) {
    var t = Date.parse(u.d);
    if (!firstByGame[u.g] || t < firstByGame[u.g]) firstByGame[u.g] = t;
    if (!keyByGame[u.g] && t === lastByGame[u.g]) keyByGame[u.g] = u.d + "|" + (u.v || "") + "|" + (u.n || "");
  });
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function store(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  var seen = load(SEEN_KEY), demoSeen = load(DEMO_KEY);
  var qs = location.search;
  var force = /[?&]new\b/.test(qs) ? "new" : /[?&]upd\b/.test(qs) ? "upd" : "";
  var demo = !force && now < DEMO_UNTIL;

  function badgeFor(c) {
    var g = c.dataset.game;
    if (force) return force;
    var added = c.dataset.added ? Date.parse(c.dataset.added) : firstByGame[g];
    var last = lastByGame[g];
    if (demo && !demoSeen[g]) return "new";
    if (added && now - added < NEW_DAYS * 864e5 && !(g in seen)) return "new";
    if (last && added && last > added && now - last < NEW_DAYS * 864e5 && seen[g] !== keyByGame[g]) return "upd";
    return "";
  }
  function markSeen(g) {
    if (force) return;
    seen[g] = keyByGame[g] || "1"; store(SEEN_KEY, seen);
    if (demo) { demoSeen[g] = 1; store(DEMO_KEY, demoSeen); }
  }

  var watching = [];
  cards.forEach(function (c) {
    var kind = badgeFor(c);
    var cover = c.querySelector(".cover");
    if (!cover) return;
    var flags = document.createElement("div");
    flags.className = "flags";
    var sec = cover.querySelector(".flag.secret");
    if (sec) flags.appendChild(sec);
    cover.appendChild(flags);
    if (!kind) {
      if (!(c.dataset.game in seen) && !force) markSeen(c.dataset.game);   // старые игры сразу считаются просмотренными
      return;
    }
    var b = document.createElement("span");
    b.className = "flag fresh-" + kind;
    b.innerHTML = kind === "new" ? "<i></i>новое" : "<i></i>новое обновление";
    flags.appendChild(b);
    watching.push({ card: c, badge: b, timer: 0, done: false });
  });

  // «просмотрел»: карточка видна хотя бы наполовину SEEN_MS подряд, на главной и при открытой вкладке
  var order = 0, orderReset = 0;
  function fade(w) {
    if (w.done) return;
    w.done = true;
    markSeen(w.card.dataset.game);
    // несколько карточек на экране гаснут по очереди, а не все разом
    var delay = (order++) * 140;
    clearTimeout(orderReset); orderReset = setTimeout(function () { order = 0; }, 600);
    setTimeout(function () {
      w.badge.classList.add("gone");
      setTimeout(function () { w.badge.remove(); }, 1300);
    }, delay);
  }
  if (watching.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var w = null;
        watching.forEach(function (x) { if (x.card === en.target) w = x; });
        if (!w || w.done) return;
        clearTimeout(w.timer);
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          w.timer = setTimeout(function () {
            if (document.visibilityState === "visible" && (!window.MayakView || MayakView.current() === "home")) fade(w);
          }, SEEN_MS);
        }
      });
    }, { threshold: [0, 0.5, 1] });
    watching.forEach(function (w) { io.observe(w.card); });
  }

  render();
})();
