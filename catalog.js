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
    kot: "#f5b061", mazomus: "#ff8fb0", budka: "#ffd98a", dota: "#9fb3ff" };

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

  var state = { genre: "", tags: [] };
  try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s) state = { genre: s.genre || "", tags: s.tags || [] }; } catch (e) {}

  // панель фильтров
  var box = document.createElement("div");
  box.className = "filters";
  box.innerHTML =
    '<div class="f-row"><span class="f-label">Жанр</span><div class="f-chips" id="fGenres"></div></div>' +
    '<div class="f-row"><span class="f-label">Метки</span><div class="f-chips" id="fTags"></div></div>';
  grid.parentNode.insertBefore(box, grid);
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
    if (state.genre || state.tags.length) {
      var r = chip("✕ сбросить", null, false, reset);
      r.classList.add("reset");
      tBox.appendChild(r);
    }

    var shown = 0;
    cards.forEach(function (c) {
      var ok = match(c, state.genre, state.tags);
      c.classList.toggle("filtered", !ok);
      if (ok && open(c)) shown++;
    });
    var active = !!(state.genre || state.tags.length);
    if (soon) soon.classList.toggle("filtered", active);
    empty.hidden = shown > 0;
    renderFeed();
  }

  // ---------- лента обновлений ----------
  var feed = document.getElementById("feed");
  var feedChips = document.getElementById("feedChips");
  var feedMore = document.getElementById("feedMore");
  var feedGame = "";
  var feedLimit = 6;
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
      feedChips.appendChild(chip("Всё", null, !feedGame, function () { feedGame = ""; feedLimit = 6; renderFeed(); }));
      seen.forEach(function (g) {
        var on = feedGame === g;
        feedChips.appendChild(chip(esc(gameName(g)), null, on, function () { feedGame = on ? "" : g; feedLimit = 6; renderFeed(); }));
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
  if (feedMore) feedMore.addEventListener("click", function () { feedLimit += 10; renderFeed(); });

  // секретная игра открылась — пересчитать фильтры и ленту
  var mo = new MutationObserver(render);
  cards.forEach(function (c) { mo.observe(c, { attributes: true, attributeFilter: ["hidden"] }); });

  render();
})();
