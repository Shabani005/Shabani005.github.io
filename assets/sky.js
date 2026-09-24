// Background sky: a twinkling star field with the occasional shooting star, drawn on a canvas
// in front of soft nebula clouds (the clouds are CSS on .bg-layer, see style.css).

// block scope: this file shares the global scope with the other page scripts
{
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SNOW = "216, 222, 233"; // nord snow
    const WARM = "235, 203, 139"; // nord yellow
    const rand = (a, b) => a + Math.random() * (b - a);

    // the sky has to look the same on every page, so switching pages doesn't swap it out:
    // stars come from a fixed seed, and twinkling / cloud drift follow the wall clock
    function seeded(seed) {
        return () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const clock = () => Date.now() / 1000;

    const start = () => {
        const layer = document.createElement("div");
        layer.className = "bg-layer";
        // start the cloud drift where it would be by now (periods: 2 x 40s and 2 x 52s, alternating)
        layer.style.setProperty("--drift-a", `${-(clock() % 80)}s`);
        layer.style.setProperty("--drift-b", `${-(clock() % 104)}s`);
        const canvas = document.createElement("canvas");
        canvas.className = "bg-canvas";
        document.body.prepend(layer, canvas);

        const ctx = canvas.getContext("2d");
        const dpr = Math.min(devicePixelRatio || 1, 2);
        let w = 0, h = 0, stars = [], meteor = null, nextMeteor = rand(800, 2500);

        const setup = () => {
            w = innerWidth;
            h = innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const r = seeded(20260924);
            const between = (a, b) => a + r() * (b - a);
            stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
                x: between(0, w),
                y: between(0, h),
                r: between(0.4, 1.7),
                phase: between(0, Math.PI * 2),
                speed: between(0.4, 1.6),
                warm: r() < 0.08,
            }));
        };
        setup();
        addEventListener("resize", setup);

        const drawStars = () => {
            const t = clock();
            for (const s of stars) {
                const tw = reduceMotion ? 0.6 : 0.45 + 0.55 * Math.sin(t * s.speed + s.phase);
                ctx.fillStyle = `rgba(${s.warm ? WARM : SNOW}, ${0.2 + 0.6 * tw})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // a streak heading down-left with a fading tail, one every 2.5-6s
        const drawMeteor = (now) => {
            if (!meteor && now > nextMeteor) {
                meteor = { x: rand(w * 0.3, w * 1.05), y: rand(-40, h * 0.35), t: 0, len: rand(120, 220), speed: rand(9, 14) };
            }
            if (!meteor) return;
            meteor.t += 1;
            const dx = -0.82, dy = 0.57;
            const hx = meteor.x + dx * meteor.speed * meteor.t, hy = meteor.y + dy * meteor.speed * meteor.t;
            const fade = Math.max(0, 1 - meteor.t / 55);
            const tail = ctx.createLinearGradient(hx, hy, hx - dx * meteor.len, hy - dy * meteor.len);
            tail.addColorStop(0, `rgba(${SNOW}, ${0.9 * fade})`);
            tail.addColorStop(1, `rgba(${SNOW}, 0)`);
            ctx.strokeStyle = tail;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx - dx * meteor.len, hy - dy * meteor.len);
            ctx.stroke();
            if (fade <= 0 || hx < -meteor.len || hy > h + meteor.len) {
                meteor = null;
                nextMeteor = now + rand(2500, 6000);
            }
        };

        // draw the first frame right away, so the stars are in the page's very first paint
        drawStars();
        if (reduceMotion) {
            addEventListener("resize", drawStars); // one still frame, no shooting stars
            return;
        }

        let last = 0;
        const tick = (now) => {
            requestAnimationFrame(tick);
            if (now - last < 16) return;
            last = now;
            ctx.clearRect(0, 0, w, h);
            drawStars();
            drawMeteor(now);
        };
        requestAnimationFrame(tick);
    };

    // loaded at the end of <body>, so document.body exists; start before the first paint
    start();
}
