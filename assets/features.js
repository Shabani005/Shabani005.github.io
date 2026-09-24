// More keyboard features on top of assets/site.js: README preview pane, relative line numbers,
// link hints (f) and yank (y).

// block scope: this file shares the global scope with the other page scripts
{
    const root = document.documentElement;

    const run = () => {
        const site = window.site;
        const { items, names, cardOf } = site;

        // list the extra keys in the "?" help
        document.querySelector(".keys-help dl").insertAdjacentHTML(
            "beforeend",
            '<dt>f</dt><dd>follow a link (hints)</dd>' +
                '<dt>y</dt><dd>yank link of selected item</dd>',
        );

        /* ---------- numbers: vim's relativenumber ---------- */

        function numbers() {
            const sel = site.selected();
            const vis = items.filter((li) => !li.classList.contains("is-filtered-out"));
            const at = sel >= 0 ? vis.indexOf(items[sel]) : -1;
            vis.forEach((li, i) => {
                li.dataset.rn = at < 0 ? String(i + 1) : i === at ? String(i + 1) : String(Math.abs(i - at));
                li.classList.toggle("is-current-line", i === at);
            });
        }

        /* ---------- preview: README pane for the selected project ---------- */

        // indices of the items that link to a GitHub / Codeberg repo
        const repoItems = items.map((li, i) => i).filter((i) => cardOf(items[i]).tagName === "A" && site.repoOf(cardOf(items[i]).href));
        let pane = null;
        let shown = -1;

        if (repoItems.length) {
            pane = document.createElement("aside");
            pane.className = "readme-pane";
            pane.innerHTML =
                '<div class="readme-head"><span class="readme-file">README.md</span><a class="readme-repo" target="_blank" rel="noopener"></a></div>' +
                '<div class="readme-body"></div>';
            document.querySelector("main").append(pane);
            root.classList.add("has-readme-pane");

            // fit the pane between its current top edge and the statusline, so the whole
            // README box stays on screen at any scroll position (it starts lower at the top of the page)
            let fitQueued = false;
            const fit = () => {
                fitQueued = false;
                const statusH = document.querySelector(".statusline")?.offsetHeight || 0;
                const top = Math.max(pane.getBoundingClientRect().top, 0);
                pane.style.maxHeight = `${Math.max(240, innerHeight - top - statusH - 16)}px`;
            };
            const queueFit = () => {
                if (!fitQueued) requestAnimationFrame(fit);
                fitQueued = true;
            };
            addEventListener("scroll", queueFit, { passive: true });
            addEventListener("resize", queueFit);
            fit();
        }

        // marked + DOMPurify are only needed here, so load them on demand
        let renderer = null;
        function loadRenderer() {
            if (renderer) return renderer;
            const base = document.querySelector('script[src*="assets/features.js"]').src.replace(/features\.js.*$/, "vendor/");
            const load = (name) =>
                new Promise((resolve, reject) => {
                    const s = document.createElement("script");
                    s.src = base + name;
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.append(s);
                });
            renderer = Promise.all([load("marked.min.js"), load("purify.min.js")]);
            return renderer;
        }

        // where a README's relative links and images point to
        function repoBases(repo, card) {
            if (repo.host === "github") {
                return {
                    raw: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/HEAD/`,
                    page: `https://github.com/${repo.owner}/${repo.name}/blob/HEAD/`,
                    home: `https://github.com/${repo.owner}/${repo.name}`,
                };
            }
            const branch = card.dataset.branch || "main";
            return {
                raw: `https://codeberg.org/${repo.owner}/${repo.name}/raw/branch/${branch}/`,
                page: `https://codeberg.org/${repo.owner}/${repo.name}/src/branch/${branch}/`,
                home: `https://codeberg.org/${repo.owner}/${repo.name}`,
            };
        }

        async function readmeText(repo) {
            const key = `readme:${repo.host}/${repo.owner}/${repo.name}`;
            const cached = sessionStorage.getItem(key);
            if (cached !== null) return cached;
            const urls =
                repo.host === "github"
                    ? [`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/HEAD/README.md`, `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/HEAD/readme.md`]
                    : [`https://codeberg.org/api/v1/repos/${repo.owner}/${repo.name}/raw/README.md`];
            for (const u of urls) {
                const r = await fetch(u).catch(() => null);
                if (r && r.ok) {
                    const t = await r.text();
                    sessionStorage.setItem(key, t);
                    return t;
                }
            }
            return "";
        }

        function renderReadme(md, bases) {
            const html = window.DOMPurify.sanitize(window.marked.parse(md, { gfm: true }));
            const tpl = document.createElement("template");
            tpl.innerHTML = html;
            const absolute = /^([a-z][a-z0-9+.-]*:|#|\/\/)/i;
            for (const img of tpl.content.querySelectorAll("img[src]")) {
                const src = img.getAttribute("src");
                if (!absolute.test(src)) img.src = new URL(src.replace(/^\//, ""), bases.raw).href;
                img.loading = "lazy";
            }
            // GitHub alerts ("> [!WARNING]" etc.), which marked leaves as plain blockquotes
            for (const quote of tpl.content.querySelectorAll("blockquote")) {
                const first = quote.firstElementChild;
                const text = first && first.firstChild;
                const m = text && text.nodeType === Node.TEXT_NODE && text.data.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
                if (!m) continue;
                text.data = text.data.slice(m[0].length);
                if (!first.textContent.trim()) first.remove();
                const kind = m[1].toLowerCase();
                quote.classList.add("md-alert", `md-alert-${kind}`);
                const title = document.createElement("p");
                title.className = "md-alert-title";
                title.textContent = kind;
                quote.prepend(title);
            }
            for (const a of tpl.content.querySelectorAll("a[href]")) {
                const href = a.getAttribute("href");
                if (href.startsWith("#")) continue;
                if (!absolute.test(href)) a.href = new URL(href.replace(/^\//, ""), bases.page).href;
                a.target = "_blank";
                a.rel = "noopener";
            }
            return tpl.content;
        }

        // shows the selected project; with nothing (or a non-repo item) selected it keeps the last one,
        // starting with the first project, so the pane is never empty
        async function preview() {
            if (!pane) return;
            const sel = site.selected();
            const i = repoItems.includes(sel) ? sel : shown >= 0 ? shown : repoItems[0];
            if (i === shown) return;
            shown = i;
            const card = cardOf(items[i]);
            const repo = site.repoOf(card.href);
            const bases = repoBases(repo, card);
            const head = pane.querySelector(".readme-repo");
            head.textContent = `${repo.owner}/${repo.name}`;
            head.href = bases.home;
            const body = pane.querySelector(".readme-body");
            // the finished HTML is cached per session, so revisiting (or switching back to this page)
            // shows it immediately, without loading the markdown renderer again
            const htmlKey = `readme-html:${repo.host}/${repo.owner}/${repo.name}`;
            const cachedHtml = sessionStorage.getItem(htmlKey);
            if (cachedHtml !== null) {
                body.innerHTML = cachedHtml;
                body.scrollTop = 0;
                return;
            }
            body.innerHTML = '<span class="md-empty">loading…</span>';
            const [text] = await Promise.all([readmeText(repo), loadRenderer()]).catch(() => [""]);
            if (shown !== i) return;
            body.replaceChildren();
            if (text) body.append(renderReadme(text, bases));
            else body.innerHTML = '<span class="md-empty">no README</span>';
            if (text) sessionStorage.setItem(htmlKey, body.innerHTML);
            body.scrollTop = 0;
        }

        /* ---------- yank: copy the selected item's link ---------- */

        async function yank() {
            const sel = site.selected();
            if (sel < 0) {
                site.flash("nothing selected");
                return;
            }
            const card = cardOf(items[sel]);
            const url = card.tagName === "A" ? card.href : location.href;
            try {
                await navigator.clipboard.writeText(url);
                site.flash(`yanked ${url}`);
            } catch {
                // older copy path for when the async clipboard API is blocked (e.g. file://)
                const t = document.createElement("textarea");
                t.value = url;
                t.style.cssText = "position:fixed;opacity:0";
                document.body.append(t);
                t.select();
                const ok = document.execCommand("copy");
                t.remove();
                site.flash(ok ? `yanked ${url}` : "clipboard not available here");
            }
        }

        /* ---------- hints: press f, then a letter to follow a link ---------- */

        const LETTERS = "asdfghjklqwertyuiopzxcvbnm";
        let hints = null;

        function showHints() {
            const links = [...document.querySelectorAll(".header-top a, main a.card")].filter((a) => {
                const li = a.closest(".grid > li");
                return !li || !li.classList.contains("is-filtered-out");
            });
            const labels = links.length <= LETTERS.length ? [...LETTERS] : [...LETTERS].flatMap((a) => [...LETTERS].map((b) => a + b));
            hints = { typed: "", marks: [] };
            links.forEach((a, i) => {
                const r = a.getBoundingClientRect();
                if (r.bottom < 0 || r.top > innerHeight) return;
                const m = document.createElement("span");
                m.className = "link-hint";
                m.textContent = labels[i];
                m.style.left = `${r.left + scrollX}px`;
                m.style.top = `${(a.matches(".card") ? a.querySelector("h2").getBoundingClientRect().top : r.top) + scrollY - 4}px`;
                document.body.append(m);
                hints.marks.push({ label: labels[i], a, m });
            });
            site.flash("follow link: type a hint, esc to cancel");
        }

        function clearHints() {
            if (!hints) return;
            hints.marks.forEach((h) => h.m.remove());
            hints = null;
        }

        /* ---------- keys (capture phase, so they run before site.js) ---------- */

        addEventListener(
            "keydown",
            (e) => {
                if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.("input, textarea")) return;
                if (hints) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (e.key === "Escape") return clearHints();
                    if (e.key.length !== 1) return;
                    hints.typed += e.key.toLowerCase();
                    const matches = hints.marks.filter((h) => h.label.startsWith(hints.typed));
                    hints.marks.forEach((h) => h.m.classList.toggle("is-dim", !h.label.startsWith(hints.typed)));
                    if (matches.length === 1 && matches[0].label === hints.typed) {
                        const a = matches[0].a;
                        clearHints();
                        a.click();
                    } else if (!matches.length) clearHints();
                    return;
                }
                if (e.key === "f") {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    showHints();
                } else if (e.key === "y") {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    yank();
                }
            },
            true,
        );
        addEventListener("scroll", clearHints, { passive: true });
        addEventListener("resize", clearHints);

        document.addEventListener("site:select", () => {
            numbers();
            preview();
        });
        // search changes which lines are visible, so renumber after each keystroke in the command line
        document.addEventListener("input", numbers);

        /* ---------- more below: "↓3" at the list's right edge while entries are hidden ---------- */

        const status = document.querySelector(".statusline");
        const more = document.createElement("button");
        more.type = "button";
        more.className = "more-below";
        more.setAttribute("aria-label", "scroll to the next entry");
        more.innerHTML = "↓<b></b>";
        document.body.append(more);
        let firstHidden = null;
        more.addEventListener("click", () => firstHidden && firstHidden.scrollIntoView({ block: "center", behavior: "smooth" }));

        function moreBelow() {
            const bottom = innerHeight - (status?.offsetHeight || 0);
            const vis = items.filter((li) => !li.classList.contains("is-filtered-out"));
            // an entry counts as hidden when its name is below the visible area
            const hidden = vis.filter((li) => li.querySelector("h2").getBoundingClientRect().top > bottom - 20);
            firstHidden = hidden[0] || null;
            root.classList.toggle("has-more-below", hidden.length > 0);
            if (!hidden.length) return;
            more.querySelector("b").textContent = hidden.length;
            // right-aligned with the list (under the column of arrows), just below the last visible
            // entry, and always clear of the statusline
            const list = document.querySelector(".grid").getBoundingClientRect();
            const lastRule = vis.filter((li) => !hidden.includes(li)).at(-1)?.querySelector("p")?.getBoundingClientRect();
            const lowest = bottom - more.offsetHeight - 10;
            more.style.right = `${innerWidth - list.right}px`;
            more.style.top = `${Math.min(lowest, (lastRule?.bottom ?? lowest) + 8)}px`;
        }
        addEventListener("scroll", moreBelow, { passive: true });
        addEventListener("resize", moreBelow);
        document.addEventListener("input", () => setTimeout(moreBelow));

        numbers();
        preview();
        moreBelow();
    };

    // loaded right after site.js at the end of <body>, so window.site is normally ready already
    if (window.site) run();
    else document.addEventListener("site:ready", run);
}
