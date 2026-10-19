МАЯК — сайт с играми (статический, без сервера)

index.html                 — главная со списком игр
devyatyi-val/index.html    — страница «Девятого вала» (плеер, описание, управление)
games/devyatyi-val/        — веб-сборка игры из Godot (index.html, .wasm, .pck, .js)
img/                       — обложки и скриншоты
downloads/                 — версии для Windows и Android
style.css, fonts/          — оформление и шрифты (Oswald, Rubik — SIL OFL)

Как добавить новую игру:
1. В Godot: Проект → Экспорт → Web, выключить «Thread Support», экспортировать в games/<имя-игры>/index.html
2. Скопировать папку devyatyi-val/ в <имя-игры>/ и поменять тексты, картинки и путь в frame.src
3. Добавить карточку на главную (index.html, блок class="games")

Сайт работает на любом бесплатном статическом хостинге: GitHub Pages, Netlify, itch.io.
