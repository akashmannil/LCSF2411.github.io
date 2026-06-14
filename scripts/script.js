/*
  ArcBlade Works — Interaction layer
  Vanilla JS. No dependencies. Single rAF scroll loop + IntersectionObserver.
  Rebuilt 2026. Original author: Akash Mannil (C0952939)
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var docEl = document.documentElement;

    /* ---------------------------------------------------------
       Mobile menu  (global — referenced by inline onclick)
       --------------------------------------------------------- */
    window.hamburger = function () {
        var header = document.querySelector(".site-header");
        if (!header) return;
        var open = header.classList.toggle("menu-open");
        var toggle = document.getElementById("menuToggle");
        if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
    };

    function closeMenu() {
        var header = document.querySelector(".site-header");
        if (header && header.classList.contains("menu-open")) {
            header.classList.remove("menu-open");
            document.body.style.overflow = "";
            var toggle = document.getElementById("menuToggle");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        }
    }

    /* ---------------------------------------------------------
       Scroll-reveal — "text loads in" on scroll
       --------------------------------------------------------- */
    function setupReveals() {
        if (reduceMotion) return;

        var selector = [
            "main > section", "main > article", "main > aside", "main > div",
            ".offer-item", ".team-member", ".faq-item", ".product",
            ".testimonials blockquote", ".testimonial-item",
            ".why-choose-us li", ".about-us li", "tbody tr",
            ".reveal", "[data-reveal]"
        ].join(",");

        var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
        nodes.forEach(function (n) { if (!n.classList.contains("no-reveal")) n.classList.add("reveal"); });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

        nodes.forEach(function (n) { io.observe(n); });

        /* stagger children inside grids */
        document.querySelectorAll(".offer-items, .explore-range .products, .why-choose-us ul, .team-members").forEach(function (grid) {
            Array.prototype.slice.call(grid.children).forEach(function (child, i) {
                child.style.transitionDelay = (Math.min(i, 6) * 90) + "ms";
            });
        });
    }

    /* ---------------------------------------------------------
       Per-frame scroll effects: progress bar, nav state,
       banner parallax, hero blade rotation
       --------------------------------------------------------- */
    var progress = document.getElementById("scrollProgress");
    var header = document.querySelector(".site-header");
    var parallaxImgs = Array.prototype.slice.call(document.querySelectorAll(".main-banner .img-banner, [data-parallax]"));
    var heroBlades = Array.prototype.slice.call(document.querySelectorAll("[data-blade]"));
    var ticking = false;

    function onFrame() {
        var y = window.pageYOffset || docEl.scrollTop;
        var max = (docEl.scrollHeight - window.innerHeight) || 1;

        if (progress) progress.style.transform = "scaleX(" + Math.min(y / max, 1) + ")";
        if (header) header.classList.toggle("scrolled", y > 40);

        if (!reduceMotion) {
            for (var i = 0; i < parallaxImgs.length; i++) {
                var el = parallaxImgs[i];
                var speed = parseFloat(el.getAttribute("data-parallax")) || 0.18;
                var rect = el.getBoundingClientRect();
                var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
                el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(1.08)";
            }
            for (var j = 0; j < heroBlades.length; j++) {
                heroBlades[j].style.transform = "rotate(" + (y * 0.06).toFixed(2) + "deg)";
            }
        }
        ticking = false;
    }

    function requestFrame() {
        if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); }
    }

    /* ---------------------------------------------------------
       Heavy <video> — don't autoload; load source on demand
       --------------------------------------------------------- */
    function setupLazyVideo() {
        document.querySelectorAll("video[data-lazy-src]").forEach(function (video) {
            var loaded = false;
            video.addEventListener("play", function () {
                if (loaded) return;
                loaded = true;
                var src = document.createElement("source");
                src.src = video.getAttribute("data-lazy-src");
                src.type = video.getAttribute("data-lazy-type") || "video/mp4";
                video.appendChild(src);
                video.load();
                video.play();
            }, { once: false });
        });
    }

    /* ---------------------------------------------------------
       SHOWCASE controller — full-page scroll-driven products
       --------------------------------------------------------- */
    function setupShowcase() {
        var root = document.getElementById("showcase");
        if (!root) return;

        var panels = Array.prototype.slice.call(root.querySelectorAll(".product-panel"));
        if (!panels.length) return;

        var indexEls = document.querySelectorAll("[data-sc-index]");
        var nameEl = document.querySelector("[data-sc-name]");
        var counterTotal = document.querySelector("[data-sc-total]");
        if (counterTotal) counterTotal.textContent = String(panels.length).padStart(2, "0");

        function hexToRgb(h) {
            h = h.replace("#", "");
            return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
        }
        function mix(a, b, t) {
            var ca = hexToRgb(a), cb = hexToRgb(b);
            return "rgb(" + ca.map(function (v, i) { return Math.round(v + (cb[i] - v) * t); }).join(",") + ")";
        }

        var active = -1;
        function setActive(i) {
            if (i === active) return;
            active = i;
            var panel = panels[i];
            if (nameEl) nameEl.textContent = panel.getAttribute("data-name") || "";
            indexEls.forEach(function (el) { el.textContent = String(i + 1).padStart(2, "0"); });
            panels.forEach(function (p, k) { p.classList.toggle("is-active", k === i); });
        }

        function update() {
            var vh = window.innerHeight;
            var mid = vh / 2;
            var best = 0, bestDist = Infinity;

            panels.forEach(function (panel, i) {
                var rect = panel.getBoundingClientRect();
                /* progress through this panel: 0 entering -> 1 leaving */
                var prog = (mid - rect.top) / rect.height;
                prog = Math.max(0, Math.min(1, prog));

                var stage = panel.querySelector(".product-stage");
                if (stage && !reduceMotion) {
                    /* model fades/scales in, holds, fades out */
                    var vis = Math.sin(Math.min(prog, 1) * Math.PI);            /* 0->1->0 */
                    var media = panel.querySelector(".product-media");
                    var copy = panel.querySelector(".product-copy");
                    var blade = panel.querySelector(".sc-blade");
                    if (media) {
                        media.style.opacity = (0.15 + vis * 0.85).toFixed(3);
                        media.style.transform = "translateY(" + ((0.5 - prog) * 60).toFixed(1) +
                            "px) scale(" + (0.92 + vis * 0.12).toFixed(3) + ")";
                    }
                    if (copy) {
                        copy.style.opacity = (0.1 + vis).toFixed(3);
                        copy.style.transform = "translateY(" + ((0.5 - prog) * -40).toFixed(1) + "px)";
                    }
                    if (blade) blade.style.transform = "rotate(" + (prog * 220).toFixed(1) + "deg)";
                }

                var dist = Math.abs(rect.top + rect.height / 2 - mid);
                if (dist < bestDist) { bestDist = dist; best = i; }
            });

            setActive(best);

            /* blend the ambient background toward the active product's colour */
            var cur = panels[best];
            var rect = cur.getBoundingClientRect();
            var prog = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
            var c1 = cur.getAttribute("data-bg") || "#0E0E10";
            var nxt = panels[Math.min(best + 1, panels.length - 1)];
            var c2 = nxt.getAttribute("data-bg") || c1;
            var t = prog > 0.7 ? (prog - 0.7) / 0.3 : 0;
            root.style.background =
                "radial-gradient(120% 80% at 50% 18%, " + mix(c1, c2, t) + ", #0B0B0D 80%)";
        }

        var rafScheduled = false;
        function onScroll() {
            if (!rafScheduled) { rafScheduled = true; requestAnimationFrame(function () { update(); rafScheduled = false; }); }
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        update();
    }

    /* ---------------------------------------------------------
       Init
       --------------------------------------------------------- */
    function init() {
        setupReveals();
        setupLazyVideo();
        setupShowcase();

        window.addEventListener("scroll", requestFrame, { passive: true });
        window.addEventListener("resize", requestFrame);
        requestFrame();

        /* close mobile drawer when a link is tapped */
        document.querySelectorAll(".nav-list a").forEach(function (a) {
            a.addEventListener("click", closeMenu);
        });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
