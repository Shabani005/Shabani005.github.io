(() => {
    const nav = document.querySelector(".header-top");
    const tabs = [...nav.querySelectorAll("a")];
    const currentTab = tabs.findIndex((a) => a.getAttribute("aria-current") === "page");
    const path = `~/${tabs[currentTab].textContent.trim().toLowerCase()}`;
    const items = [...document.querySelectorAll(".grid > li")];
    const cardOf = (li) => (li.classList.contains("card") ? li : li.querySelector(".card"));
    const names = items.map((li) => cardOf(li).querySelector("h2").textContent.trim());
    const visible = () => items.filter((li) => !li.classList.contains("is-filtered-out"));

    let sel = -1;
    let mode = "NORMAL";
    let message = "";
    let messageTimer = 0;

    const statusEl = document.createElement("div");
    statusEl.className = "statusline";
    statusEl.innerHTML =
        '<span class="mode"></span><span class="path"></span><span class="fill"></span>' +
        '<span class="pos"></span><span class="hint">? help</span>';
    document.body.append(statusEl);

    function status() {
        const vis = visible();
        const m = statusEl.querySelector(".mode");
        m.textContent = mode;
        m.dataset.mode = mode;
        statusEl.querySelector(".path").textContent = path;
        statusEl.querySelector(".fill").textContent = message || (sel >= 0 ? names[sel] : "");
        const at = sel >= 0 ? vis.indexOf(items[sel]) + 1 : 0;
        statusEl.querySelector(".pos").textContent = `${at}/${vis.length}`;
    }

    function flash(text) {
        message = text;
        status();
        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => {
            message = "";
            status();
        }, 2000);
    }

    function select(i, scroll = true) {
        if (sel >= 0) cardOf(items[sel]).classList.remove("is-selected");
        sel = i;
        if (sel >= 0) {
            const card = cardOf(items[sel]);
            card.classList.add("is-selected");
            if (scroll) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        status();
        document.dispatchEvent(new CustomEvent("site:select", { detail: { index: sel, item: sel >= 0 ? items[sel] : null } }));
    }

    function step(delta) {
        const vis = visible();
        if (!vis.length) return;
        const at = sel >= 0 ? vis.indexOf(items[sel]) : -1;
        const next = at < 0 ? (delta > 0 ? 0 : vis.length - 1) : Math.min(vis.length - 1, Math.max(0, at + delta));
        select(items.indexOf(vis[next]));
    }

    function open() {
        if (sel < 0) return;
        const card = cardOf(items[sel]);
        if (card.tagName === "A") card.click();
    }

    const help = document.createElement("div");
    help.className = "keys-help";
    help.hidden = true;
    help.innerHTML = `<div class="keys-help-box"><h3>KEYS</h3><dl>
        <dt>j / k</dt><dd>next / previous item</dd>
        <dt>gg / G</dt><dd>first / last item</dd>
        <dt>enter</dt><dd>open selected item</dd>
        <dt>h / l</dt><dd>previous / next tab</dd>
        <dt>1 2 3</dt><dd>jump to tab</dd>
        <dt>:</dt><dd>command line</dd>
        <dt>/</dt><dd>search this page</dd>
        <dt>esc</dt><dd>clear / close</dd>
        </dl></div>`;
    help.addEventListener("click", () => (help.hidden = true));
    document.body.append(help);

    document.addEventListener("pointerover", (e) => {
        const li = e.target.closest && e.target.closest(".grid > li");
        if (li && items.indexOf(li) !== sel) select(items.indexOf(li), false);
    });

    const cmd = document.createElement("div");
    cmd.className = "cmdline";
    cmd.hidden = true;
    cmd.innerHTML =
        '<ul></ul><div class="cmdline-row"><span class="cmdline-prefix"></span>' +
        '<input spellcheck="false" autocomplete="off" aria-label="command"></div>';
    document.body.append(cmd);
    const input = cmd.querySelector("input");
    const list = cmd.querySelector("ul");
    let prefix = ":";
    let suggestions = [];
    let active = 0;

    const entries = [
        ...tabs.map((a) => ({ label: a.textContent.trim().toLowerCase(), kind: "page", go: () => a.click() })),
        ...items.map((li, i) => ({
            label: names[i],
            kind: cardOf(li).tagName === "A" ? "open" : "item",
            go: () => {
                select(i);
                if (cardOf(li).tagName === "A") cardOf(li).click();
            },
        })),
    ];

    function openCmd(p) {
        prefix = p;
        mode = p === ":" ? "COMMAND" : "SEARCH";
        cmd.querySelector(".cmdline-prefix").textContent = p;
        cmd.hidden = false;
        input.value = "";
        render();
        input.focus();
        status();
    }

    function closeCmd(clearSearch) {
        cmd.hidden = true;
        mode = "NORMAL";
        if (clearSearch) filter("");
        input.blur();
        status();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    }

    function highlight(el, q) {
        const extra = [...el.querySelectorAll(".repo-stats")];
        extra.forEach((x) => x.remove());
        if (el.dataset.plain === undefined) el.dataset.plain = el.textContent.trim();
        const text = el.dataset.plain;
        if (!q) el.textContent = text;
        else {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
            el.innerHTML = `<span>${escapeHtml(text).replace(re, (m) => `<mark>${m}</mark>`)}</span>`;
        }
        el.append(...extra);
    }

    function filter(q) {
        q = q.trim().toLowerCase();
        for (const li of items) {
            const card = cardOf(li);
            const hit = !q || card.textContent.toLowerCase().includes(q);
            li.classList.toggle("is-filtered-out", !hit);
            card.querySelectorAll("h2, p").forEach((el) => highlight(el, hit ? q : ""));
        }
        if (sel >= 0 && items[sel].classList.contains("is-filtered-out")) select(-1);
        status();
    }

    function render() {
        const q = input.value.trim().toLowerCase();
        if (prefix === "/") {
            filter(q);
            list.innerHTML = "";
            return;
        }
        suggestions = entries.filter((e) => e.label.toLowerCase().includes(q)).slice(0, 8);
        active = 0;
        list.innerHTML = suggestions
            .map((e, i) => `<li class="${i === active ? "is-active" : ""}"><span>${escapeHtml(e.label)}</span><span class="kind">${e.kind}</span></li>`)
            .join("");
        [...list.children].forEach((li, i) =>
            li.addEventListener("mousedown", (ev) => {
                ev.preventDefault();
                suggestions[i].go();
                closeCmd(false);
            }),
        );
    }

    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            closeCmd(prefix === "/");
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (prefix === ":" && suggestions[active]) suggestions[active].go();
            if (prefix === "/" && visible().length) select(items.indexOf(visible()[0]));
            closeCmd(false);
        } else if ((e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp") && prefix === ":") {
            e.preventDefault();
            if (!suggestions.length) return;
            const d = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey) ? -1 : 1;
            active = (active + d + suggestions.length) % suggestions.length;
            [...list.children].forEach((li, i) => li.classList.toggle("is-active", i === active));
        } else if (e.key === "Backspace" && !input.value) {
            closeCmd(prefix === "/");
        }
    });

    let lastG = 0;
    document.addEventListener("keydown", (e) => {
        if (e.defaultPrevented || e.target === input || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;

        if (k === ":" || k === "/") {
            help.hidden = true;
            openCmd(k);
        } else if (k === "?") help.hidden = !help.hidden;
        else if (k === "Escape") {
            help.hidden = true;
            select(-1);
            filter("");
        } else if (k === "j" || k === "ArrowDown") step(1);
        else if (k === "k" || k === "ArrowUp") step(-1);
        else if (k === "G") select(items.indexOf(visible().at(-1)));
        else if (k === "g") {
            if (Date.now() - lastG < 500) select(items.indexOf(visible()[0]));
            lastG = Date.now();
        } else if (k === "Enter" || k === "o") open();
        else if (k === "h" || k === "ArrowLeft") tabs[Math.max(0, currentTab - 1)].click();
        else if (k === "l" || k === "ArrowRight") tabs[Math.min(tabs.length - 1, currentTab + 1)].click();
        else if (k >= "1" && k <= String(tabs.length)) tabs[Number(k) - 1].click();
        else return;
        e.preventDefault();
    });

    status();

    const LANG_COLORS = { C: "#a8b9cc", "Jupyter Notebook": "#da5b0b", Rust: "#dea584", JavaScript: "#f1e05a", Python: "#3572a5", Go: "#00add8", "C++": "#f34b7d" };

    function ago(iso) {
        const s = (Date.now() - new Date(iso)) / 1000;
        for (const [n, u] of [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"]]) {
            if (s >= n) return `${Math.floor(s / n)}${u} ago`;
        }
        return "just now";
    }

    function repoOf(href) {
        let m = href.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
        if (m) return { host: "github", owner: m[1], name: m[2], api: `https://api.github.com/repos/${m[1]}/${m[2]}`, stars: "stargazers_count", when: "pushed_at" };
        m = href.match(/^https:\/\/codeberg\.org\/([^/]+)\/([^/#?]+)/);
        if (m) return { host: "codeberg", owner: m[1], name: m[2], api: `https://codeberg.org/api/v1/repos/${m[1]}/${m[2]}`, stars: "stars_count", when: "updated_at" };
        return null;
    }

    for (const a of document.querySelectorAll("a.card")) {
        const repo = repoOf(a.href);
        if (!repo) continue;
        const key = `repo:${repo.api}`;
        const cached = JSON.parse(localStorage.getItem(key) || "null");
        const fresh = cached && Date.now() - cached.t < 3600e3;
        const got = fresh ? Promise.resolve(cached.d) : fetch(repo.api).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
        got.then((d) => {
            const keep = { language: d.language, default_branch: d.default_branch, [repo.stars]: d[repo.stars], [repo.when]: d[repo.when] };
            if (!fresh) localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: keep }));
            a.dataset.branch = keep.default_branch || "";
            const span = document.createElement("span");
            span.className = "repo-stats";
            const lang = d.language || "";
            span.innerHTML =
                (lang ? `<i class="lang-dot" style="--lang:${LANG_COLORS[lang] || "var(--fg-dim)"}"></i><span>${escapeHtml(lang)}</span>` : "") +
                `<span>★ ${Number(d[repo.stars]) || 0}</span><span class="when">${ago(d[repo.when])}</span>`;
            a.querySelector("h2").append(span);
        }).catch(() => {});
    }

    window.site = { items, names, cardOf, select, flash, repoOf, escapeHtml, selected: () => sel };
    document.dispatchEvent(new Event("site:ready"));
})();
