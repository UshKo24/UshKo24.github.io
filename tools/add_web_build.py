#!/usr/bin/env python3
"""Подключает веб-экспорт Godot к общему движку сайта.

Использование:
    python3 tools/add_web_build.py <папка с веб-экспортом Godot> <имя-игры> [цвет фона загрузки]

Из экспорта берутся только index.pck и иконки — движок (wasm/js) общий: engine/godot-<версия>/.
Если версии движка ещё нет на сайте, она копируется из экспорта один раз.
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]
    bg = sys.argv[3] if len(sys.argv) > 3 else "#000000"
    html = open(os.path.join(src, "index.html"), encoding="utf-8").read()
    wasm = open(os.path.join(src, "index.wasm"), "rb").read()
    m = re.search(rb"Godot Engine v(\d+\.\d+(?:\.\d+)?)\.stable", wasm)
    if not m:
        sys.exit("Не удалось определить версию Godot в index.wasm")
    ver = m.group(1).decode()
    eng = os.path.join(ROOT, "engine", "godot-" + ver)
    if not os.path.isdir(eng):
        os.makedirs(eng)
        for a, b in [("index.js", "godot.js"), ("index.wasm", "godot.wasm"),
                     ("index.audio.worklet.js", "godot.audio.worklet.js"),
                     ("index.audio.position.worklet.js", "godot.audio.position.worklet.js")]:
            shutil.copy(os.path.join(src, a), os.path.join(eng, b))
        print("Новая версия движка:", eng)
    out = os.path.join(ROOT, "games", name)
    os.makedirs(out, exist_ok=True)
    for f in ["index.pck", "index.icon.png", "index.apple-touch-icon.png", "index.png"]:
        if os.path.exists(os.path.join(src, f)):
            shutil.copy(os.path.join(src, f), os.path.join(out, f))
    rel = "../../engine/godot-" + ver + "/godot"
    cfg = json.loads(re.search(r"const GODOT_CONFIG = (\{.*?\});", html).group(1))
    cfg["executable"] = rel
    cfg["mainPack"] = "index.pck"
    cfg["fileSizes"] = {"index.pck": os.path.getsize(os.path.join(out, "index.pck")),
                        rel + ".wasm": os.path.getsize(os.path.join(eng, "godot.wasm"))}
    cfg["gdextensionLibs"] = []
    html = re.sub(r"const GODOT_CONFIG = \{.*?\};", lambda _: "const GODOT_CONFIG = " + json.dumps(cfg, ensure_ascii=False) + ";", html)
    html = html.replace('<script src="index.js"></script>', '<script src="' + rel + '.js"></script>')
    html = re.sub(r"(#status \{[^}]*?background-color: )#[0-9a-fA-F]+", lambda m: m.group(1) + bg, html, count=1)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    for f in ["index.js", "index.wasm", "index.audio.worklet.js", "index.audio.position.worklet.js"]:
        p = os.path.join(out, f)
        if os.path.exists(p):
            os.remove(p)
    print("Готово: games/%s → движок Godot %s" % (name, ver))

main()
