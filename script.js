/* ============================================================
   Julianna Head — Portfolio interactions
   ============================================================ */

(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  /* ---- Year ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav background on scroll + progress bar ---- */
  function onScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle("is-scrolled", y > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  function closeMenu() {
    if (!navToggle || !mobileMenu) return;
    navToggle.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      const open = mobileMenu.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Stagger hero reveals slightly ---- */
  document.querySelectorAll(".hero .reveal").forEach(function (el, i) {
    el.style.transitionDelay = i * 0.09 + "s";
  });

  /* ---- Hero lava lamp (WebGL metaballs; push with the cursor, drag to move) ---- */
  (function () {
    const canvas = document.getElementById("heroBlobs");
    const hero = canvas && canvas.closest(".hero");
    if (!hero) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const MAX = 8;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    const vert = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const frag = [
      "precision highp float;",
      "uniform vec3 u_b[" + MAX + "];",
      "uniform int u_n;",
      "uniform float u_h;",
      "void main(){",
      "  vec2 c=vec2(gl_FragCoord.x,u_h-gl_FragCoord.y);",
      "  float f=0.;",
      "  for(int i=0;i<" + MAX + ";i++){",
      "    if(i>=u_n)break;",
      "    vec2 d=c-u_b[i].xy;",
      "    f+=u_b[i].z*u_b[i].z/dot(d,d);",
      "  }",
      "  float a=smoothstep(.96,1.04,f);",
      "  vec3 top=vec3(.169,.435,1.);",   // --accent #2b6fff
      "  vec3 bot=vec3(.62,.75,1.);",
      "  vec3 col=mix(top,bot,clamp(c.y/u_h,0.,1.));",
      "  gl_FragColor=vec4(col*a,a);",
      "}"
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uB = gl.getUniformLocation(prog, "u_b");
    const uN = gl.getUniformLocation(prog, "u_n");
    const uH = gl.getUniformLocation(prog, "u_h");

    let w = 0, h = 0, dpr = 1, top = 0;
    let blobs = [];
    const data = new Float32Array(MAX * 3);
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };
    let dragged = null;

    // Blobs live mostly in the empty right side on desktop, behind the copy on mobile
    function seed() {
      const desktop = w > 860;
      const n = desktop ? 7 : 4;
      const unit = Math.min(w, h) * (desktop ? 0.075 : 0.1);
      blobs = [];
      for (let i = 0; i < n; i++) {
        const r = unit * (0.7 + Math.random() * 0.8);
        blobs.push({
          x: desktop ? w * (0.55 + Math.random() * 0.4) : w * (0.5 + Math.random() * 0.45),
          y: top + r + Math.random() * Math.max(h - top - 2 * r, 1),
          vx: 0, vy: 0, r: r,
          phase: Math.random() * Math.PI * 2,
          speed: 0.00015 + Math.random() * 0.0002
        });
      }
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const first = !w;
      const sx = first ? 1 : rect.width / w, sy = first ? 1 : rect.height / h;
      w = rect.width; h = rect.height;
      top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64) + 16;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (first) seed();
      else blobs.forEach(function (b) { b.x *= sx; b.y *= sy; });
    }

    function step(t, dt) {
      const k = dt / 16.67;
      blobs.forEach(function (b) {
        if (b === dragged) {
          b.vx = (pointer.x - b.x) * 0.25;
          b.vy = (pointer.y - b.y) * 0.25;
        } else {
          // Slow lava-lamp rise and fall plus a little sideways sway
          const ty = Math.sin(t * b.speed + b.phase) * 0.35;
          const tx = Math.cos(t * b.speed * 0.7 + b.phase * 1.3) * 0.18;
          b.vx += (tx - b.vx) * 0.01 * k;
          b.vy += (ty - b.vy) * 0.01 * k;
          // Cursor pushes nearby blobs away
          if (pointer.inside && !dragged) {
            const dx = b.x - pointer.x, dy = b.y - pointer.y;
            const reach = b.r * 2.2;
            const d2 = dx * dx + dy * dy;
            if (d2 < reach * reach && d2 > 1) {
              const d = Math.sqrt(d2);
              const f = (1 - d / reach) * 0.9 * k;
              b.vx += (dx / d) * f;
              b.vy += (dy / d) * f;
            }
          }
          b.vx *= Math.pow(0.97, k);
          b.vy *= Math.pow(0.97, k);
        }
        b.x += b.vx * k;
        b.y += b.vy * k;
        // Soft walls (the top one sits below the fixed nav)
        const m = b.r * 0.6;
        if (b.x < m) b.vx += (m - b.x) * 0.02 * k;
        if (b.x > w - m) b.vx -= (b.x - (w - m)) * 0.02 * k;
        if (b.y < top + b.r) b.vy += (top + b.r - b.y) * 0.02 * k;
        if (b.y > h - m) b.vy -= (b.y - (h - m)) * 0.02 * k;
      });
    }

    function draw() {
      for (let i = 0; i < blobs.length; i++) {
        data[i * 3] = blobs[i].x * dpr;
        data[i * 3 + 1] = blobs[i].y * dpr;
        data[i * 3 + 2] = blobs[i].r * dpr;
      }
      gl.uniform3fv(uB, data);
      gl.uniform1i(uN, blobs.length);
      gl.uniform1f(uH, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Is the point inside the goo? Same field the shader uses.
    function blobAt(x, y) {
      let f = 0, best = null, bestD = Infinity;
      blobs.forEach(function (b) {
        const d2 = (x - b.x) * (x - b.x) + (y - b.y) * (y - b.y);
        f += (b.r * b.r) / d2;
        if (d2 < bestD) { bestD = d2; best = b; }
      });
      return f >= 1 ? best : null;
    }

    let visible = true, raf = 0, last = 0;
    function loop(t) {
      raf = 0;
      if (!visible) return;
      step(t, Math.min(t - (last || t), 50));
      last = t;
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (reduceMotion.matches) { draw(); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
    }

    function local(e) {
      const rect = hero.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function interactive(e) {
      return finePointer.matches && !reduceMotion.matches && e.pointerType === "mouse";
    }

    hero.addEventListener("pointermove", function (e) {
      if (!interactive(e)) return;
      const p = local(e);
      pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
      if (!dragged) hero.classList.toggle("is-grab", !!blobAt(p.x, p.y) && !e.target.closest("a, button"));
    });
    hero.addEventListener("pointerleave", function () {
      pointer.inside = false;
      hero.classList.remove("is-grab");
    });
    hero.addEventListener("pointerdown", function (e) {
      if (!interactive(e) || e.button !== 0 || e.target.closest("a, button")) return;
      const p = local(e);
      const b = blobAt(p.x, p.y);
      if (!b) return;
      e.preventDefault();
      dragged = b;
      pointer.x = p.x; pointer.y = p.y;
      hero.setPointerCapture(e.pointerId);
      hero.classList.add("is-dragging");
    });
    function release() {
      dragged = null;
      hero.classList.remove("is-dragging");
    }
    hero.addEventListener("pointerup", release);
    hero.addEventListener("pointercancel", release);

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(hero);

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); draw(); }, 100);
    });
    reduceMotion.addEventListener("change", start);

    resize();
    draw();
    canvas.classList.add("is-ready");
    start();
  })();

  /* ---- Work slider — scroll-pinned on desktop, swipe on mobile ---- */
  const workSection = document.getElementById("work");
  const workPinWrap = document.getElementById("workPinWrap");
  const workPin = document.getElementById("workPin");
  const workAlign = document.getElementById("workAlign");
  const workViewport = document.getElementById("workViewport");
  const workTrack = document.getElementById("workTrack");
  const workTrackSpacer = document.getElementById("workTrackSpacer");
  const workPrev = document.getElementById("workPrev");
  const workNext = document.getElementById("workNext");
  const workCurrent = document.getElementById("workCurrent");
  const workProgressBar = document.getElementById("workProgressBar");
  const workHint = document.getElementById("workHint");

  if (workTrack && workViewport) {
    const cards = workTrack.querySelectorAll(".case-card");
    const total = cards.length;
    const SLIDE_MS = 550;
    const SCROLL_STEP_RATIO = 0.55;
    let activeIndex = 0;
    let isAnimating = false;
    let wheelCooldown = false;
    let scrollPinEnabled = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartTranslate = 0;
    let dragMoved = false;
    let dragBounds = { min: 0, max: 0 };

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 860px)");

    function padIndex(n) {
      return String(n).padStart(2, "0");
    }

    function getScrollStep() {
      return Math.max(380, window.innerHeight * SCROLL_STEP_RATIO);
    }

    function getViewportMetrics() {
      const rect = workViewport.getBoundingClientRect();
      const style = getComputedStyle(workViewport);
      const padL = parseFloat(style.paddingLeft) || 0;
      const padR = parseFloat(style.paddingRight) || 0;
      return {
        left: rect.left + padL,
        right: rect.right - padR,
        width: rect.width - padL - padR,
        clientWidth: workViewport.clientWidth,
      };
    }

    function getAlignInset() {
      if (!workAlign) return getEdgePad();
      const metrics = getViewportMetrics();
      return workAlign.getBoundingClientRect().left - metrics.left;
    }

    function getEdgePad() {
      const rootPad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad"));
      return Number.isFinite(rootPad) ? rootPad : 80;
    }

    function getMaxScrollOffset() {
      return Math.max(0, workTrack.scrollWidth - workViewport.clientWidth);
    }

    function setSpacerWidth(spare) {
      if (!workTrackSpacer) return;
      workTrackSpacer.style.flex = "0 0 " + spare + "px";
      workTrackSpacer.style.width = spare + "px";
      workTrackSpacer.style.minWidth = spare + "px";
    }

    function ensureScrollRoom(requiredOffset) {
      const lastCard = cards[total - 1];
      if (!lastCard || !workTrackSpacer) return;

      const clientW = workViewport.clientWidth;
      const contentEnd = lastCard.offsetLeft + lastCard.offsetWidth;
      let spare = Math.max(getEdgePad(), requiredOffset + clientW - contentEnd + 16);
      const currentSpare = workTrackSpacer.offsetWidth;

      if (spare < currentSpare) spare = currentSpare;

      while (spare < 4000) {
        setSpacerWidth(spare);
        workTrack.offsetHeight;
        if (getMaxScrollOffset() >= requiredOffset) break;
        spare += 48;
      }
    }

    function measureCardEdges(index, offset) {
      const savedTransform = workTrack.style.transform;
      const savedTransition = workTrack.style.transition;
      const card = cards[index];
      const metrics = getViewportMetrics();
      const alignLeft = workAlign
        ? workAlign.getBoundingClientRect().left
        : metrics.left;
      const edgeGap = 12;

      workTrack.style.transition = "none";
      workTrack.style.transform = "translateX(" + (-offset) + "px)";
      workTrack.offsetHeight;

      const rect = card.getBoundingClientRect();
      const edges = {
        left: alignLeft - rect.left,
        right: rect.right - (metrics.right - edgeGap),
      };

      workTrack.style.transform = savedTransform;
      workTrack.style.transition = savedTransition;
      return edges;
    }

    function getSlideTarget(index) {
      const card = cards[index];
      if (!card) return 0;

      const metrics = getViewportMetrics();
      const alignLeft = workAlign
        ? workAlign.getBoundingClientRect().left
        : metrics.left;
      const edgeGap = 12;
      const clientW = workViewport.clientWidth;
      const leftInset = alignLeft - metrics.left;
      const leftOffset = Math.max(0, card.offsetLeft - leftInset);
      const rightOffset = Math.max(
        0,
        card.offsetLeft + card.offsetWidth + edgeGap - clientW
      );

      ensureScrollRoom(Math.max(leftOffset, rightOffset));
      const maxOffset = getMaxScrollOffset();

      let offset;
      if (index === total - 1) {
        offset = leftOffset <= maxOffset ? leftOffset : Math.min(rightOffset, maxOffset);
        if (offset > maxOffset) offset = maxOffset;
      } else {
        offset = Math.min(leftOffset, maxOffset);
      }

      let edges = measureCardEdges(index, offset);
      if (edges.right > 0.5) {
        offset = Math.min(maxOffset, offset + edges.right);
        edges = measureCardEdges(index, offset);
      }
      if (index !== total - 1 && edges.left > 0.5) {
        offset = Math.max(0, offset - edges.left);
      }

      return offset;
    }

    function getSlideOffset(index) {
      return getSlideTarget(index);
    }

    function getTrackTranslate() {
      const matrix = new DOMMatrix(getComputedStyle(workTrack).transform);
      return matrix.m41;
    }

    function getTranslateBounds() {
      ensureScrollRoom(getSlideTarget(total - 1));
      const maxOffset = getMaxScrollOffset();
      return { min: -maxOffset, max: 0 };
    }

    function resolveFinalOffset(index) {
      return getSlideTarget(index);
    }

    function setTranslateX(offset, animate) {
      const useTransition = animate && !reducedMotionQuery.matches && !isDragging;
      if (!useTransition) {
        workTrack.style.transition = "none";
      }
      workTrack.style.transform = "translateX(" + (-offset) + "px)";
      if (!useTransition) {
        workTrack.offsetHeight;
        workTrack.style.transition = "";
      }
    }

    function updateTrackPadding() {
      ensureScrollRoom(getSlideTarget(total - 1));
    }

    function updateWorkControls() {
      if (workCurrent) workCurrent.textContent = padIndex(activeIndex + 1);
      if (workPrev) workPrev.disabled = activeIndex === 0;
      if (workNext) workNext.disabled = activeIndex >= total - 1;
      if (workProgressBar && total > 1) {
        workProgressBar.style.width = ((activeIndex / (total - 1)) * 100) + "%";
      }
    }

    function setActiveCard(index) {
      cards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === index);
      });
    }

    function finishAnimation() {
      isAnimating = false;
      updateWorkControls();
    }

    let lastPinIndex = -1;
    let lastAppliedOffset = -1;

    function goTo(index, animate) {
      const nextIndex = Math.max(0, Math.min(total - 1, index));
      if (nextIndex === activeIndex && animate !== false) return false;

      const prevIndex = activeIndex;
      activeIndex = nextIndex;
      setActiveCard(activeIndex);
      updateWorkControls();

      const finalOffset = resolveFinalOffset(activeIndex);
      if (finalOffset === lastAppliedOffset && nextIndex === prevIndex && animate === false) {
        return true;
      }
      lastAppliedOffset = finalOffset;

      const useAnimate = animate !== false && !reducedMotionQuery.matches;

      if (!useAnimate) {
        setTranslateX(finalOffset, false);
        finishAnimation();
        return true;
      }

      isAnimating = true;
      setTranslateX(finalOffset, true);
      return true;
    }

    function step(direction) {
      if (isAnimating || isDragging) return;
      goTo(activeIndex + direction);
    }

    function snapFromDrag(deltaX) {
      if (deltaX <= -40 && activeIndex < total - 1) {
        goTo(activeIndex + 1, true);
      } else if (deltaX >= 40 && activeIndex > 0) {
        goTo(activeIndex - 1, true);
      } else {
        goTo(activeIndex, true);
      }
    }

    function setPinHeight() {
      if (!workPinWrap || !workPin) return;
      if (!scrollPinEnabled) {
        workPinWrap.style.height = "";
        lastPinIndex = -1;
        return;
      }
      updateTrackPadding();
      const step = getScrollStep();
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
      const pinHeight = Math.max(workPin.offsetHeight, window.innerHeight - navH);
      workPinWrap.style.height = (pinHeight + (total - 1) * step) + "px";
    }

    function evaluateScrollPin() {
      scrollPinEnabled = !reducedMotionQuery.matches && !mobileQuery.matches && !!workPinWrap && !!workPin;
      if (workSection) workSection.classList.toggle("work--scroll-pin", scrollPinEnabled);
      if (workHint) {
        workHint.textContent = scrollPinEnabled
          ? "Keep scrolling →"
          : "Drag or use arrows →";
      }
      lastPinIndex = -1;
      setPinHeight();
      onPinScroll();
    }

    function onPinScroll() {
      if (!scrollPinEnabled || !workPinWrap) return;

      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
      const wrapTop = workPinWrap.getBoundingClientRect().top;
      const scrolled = Math.max(0, navH - wrapTop);
      const step = getScrollStep();
      const pinTravel = (total - 1) * step;
      const progress = pinTravel > 0 ? Math.min(1, scrolled / pinTravel) : 0;
      const targetIndex = Math.min(total - 1, Math.floor(progress * total));

      if (targetIndex !== lastPinIndex) {
        lastPinIndex = targetIndex;
        goTo(targetIndex, false);
      }
    }

    workTrack.addEventListener("transitionend", function (e) {
      if (e.propertyName === "transform") finishAnimation();
    });

    if (workPrev) {
      workPrev.addEventListener("click", function () { step(-1); });
    }

    if (workNext) {
      workNext.addEventListener("click", function () { step(1); });
    }

    workViewport.addEventListener("wheel", function (e) {
      if (scrollPinEnabled) return;

      const delta = e.deltaY;
      if (Math.abs(delta) < 12) return;

      const goingNext = delta > 0;
      const goingPrev = delta < 0;

      if (goingNext && activeIndex >= total - 1) return;
      if (goingPrev && activeIndex <= 0) return;

      const isFocused = workViewport.contains(document.activeElement);
      if (!workViewport.matches(":hover") && !isFocused) return;

      e.preventDefault();

      if (isAnimating || wheelCooldown || isDragging) return;

      if (goTo(activeIndex + (goingNext ? 1 : -1))) {
        wheelCooldown = true;
        window.setTimeout(function () {
          wheelCooldown = false;
        }, SLIDE_MS);
      }
    }, { passive: false });

    workViewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    workViewport.addEventListener("mousedown", function (e) {
      if (e.button !== 0 || isAnimating) return;

      isDragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartTranslate = getTrackTranslate();
      dragBounds = getTranslateBounds();

      workTrack.style.transition = "none";
      workViewport.classList.add("is-dragging");
      workTrack.classList.add("is-dragging");
      e.preventDefault();
    });

    window.addEventListener("mousemove", function (e) {
      if (!isDragging) return;

      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 4) dragMoved = true;

      const bounds = dragBounds;
      const next = Math.max(bounds.min, Math.min(bounds.max, dragStartTranslate + dx));
      workTrack.style.transform = "translateX(" + next + "px)";
    });

    window.addEventListener("mouseup", function (e) {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      isDragging = false;
      workViewport.classList.remove("is-dragging");
      workTrack.classList.remove("is-dragging");
      workTrack.style.transition = "";

      if (!dragMoved) return;
      snapFromDrag(deltaX);
    });

    workViewport.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    workViewport.addEventListener("touchstart", function (e) {
      if (isDragging) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    workViewport.addEventListener("touchend", function (e) {
      if (isDragging) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) step(1);
      else step(-1);
    }, { passive: true });

    window.addEventListener("scroll", onPinScroll, { passive: true });
    window.addEventListener("resize", function () {
      lastAppliedOffset = -1;
      evaluateScrollPin();
      updateTrackPadding();
      goTo(activeIndex, false);
    });

    reducedMotionQuery.addEventListener("change", evaluateScrollPin);
    mobileQuery.addEventListener("change", evaluateScrollPin);

    if ("ResizeObserver" in window && workViewport) {
      const workResizeObserver = new ResizeObserver(function () {
        if (isDragging || isAnimating) return;
        lastAppliedOffset = -1;
        updateTrackPadding();
        goTo(activeIndex, false);
      });
      workResizeObserver.observe(workViewport);
    }

    window.addEventListener("load", function () {
      evaluateScrollPin();
      updateTrackPadding();
      goTo(0, false);
      onPinScroll();
    });

    evaluateScrollPin();
    updateTrackPadding();
    goTo(0, false);
  }

  /* ---- Contact form (async submit, inline status) ---- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const accessKey = form.querySelector('input[name="access_key"]');
      if (accessKey && accessKey.value === "YOUR_WEB3FORMS_ACCESS_KEY") {
        setStatus("Form isn't connected yet. Add your access key to start receiving messages.", "error");
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const original = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
      setStatus("", "");

      const data = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (r) {
          if (r.ok && r.json.success) {
            form.reset();
            setStatus("Thanks. Your message is on its way. I'll be in touch soon.", "success");
          } else {
            setStatus((r.json && r.json.message) || "Something went wrong. Please try again.", "error");
          }
        })
        .catch(function () {
          setStatus("Network error. Please try again, or reach me on LinkedIn.", "error");
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original; }
        });
    });
  }

  function setStatus(msg, type) {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove("is-success", "is-error");
    if (type === "success") status.classList.add("is-success");
    if (type === "error") status.classList.add("is-error");
  }

  /* ---- Skills constellation (desktop) ---- */
  const constellationEl = document.getElementById("skillsConstellation");
  const constellationNodes = document.getElementById("constellationNodes");
  const constellationStage = document.getElementById("constellationStage");
  const constellationDetail = document.getElementById("constellationDetail");
  const constellationDetailNum = document.getElementById("constellationDetailNum");
  const constellationDetailTitle = document.getElementById("constellationDetailTitle");
  const constellationDetailList = document.getElementById("constellationDetailList");
  const constellationBackdrop = document.getElementById("constellationBackdrop");
  const constellationHint = document.getElementById("constellationHint");
  const pillarEls = document.querySelectorAll(".pillars--fallback .pillar");

  if (constellationEl && constellationNodes && pillarEls.length) {
    const desktopQuery = window.matchMedia("(min-width: 861px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const skillsData = Array.from(pillarEls).map(function (pillar) {
      return {
        num: pillar.querySelector(".pillar__num").textContent.trim(),
        title: pillar.querySelector(".pillar__title").textContent.trim(),
        skills: Array.from(pillar.querySelectorAll(".pillar__list li")).map(function (li) {
          return li.textContent.trim();
        }),
      };
    });

    let rotationAngle = 0;
    let autoRotate = true;
    let activeIndex = null;
    let rotationTimer = null;
    let nodeButtons = [];
    let orbitRadius = 200;

    function getOrbitRadius() {
      const stageW = constellationStage ? constellationStage.clientWidth : 640;
      return Math.min(260, Math.max(160, stageW * 0.34));
    }

    function nodePosition(index, total) {
      const angle = ((index / total) * 360 + rotationAngle) % 360;
      const radian = (angle * Math.PI) / 180;
      const x = orbitRadius * Math.cos(radian);
      const y = orbitRadius * Math.sin(radian);
      const zIndex = Math.round(100 + 50 * Math.cos(radian));
      const opacity = Math.max(0.42, Math.min(1, 0.42 + 0.58 * ((1 + Math.sin(radian)) / 2)));
      return { x: x, y: y, zIndex: zIndex, opacity: opacity };
    }

    function applyNodePositions() {
      const total = skillsData.length;
      nodeButtons.forEach(function (btn, index) {
        const pos = nodePosition(index, total);
        const isActive = activeIndex === index;
        btn.style.transform = "translate(" + pos.x + "px, " + pos.y + "px)" + (isActive ? " scale(1.18)" : "");
        btn.style.zIndex = String(isActive ? 200 : pos.zIndex);
        btn.style.opacity = isActive ? "1" : String(pos.opacity);
      });
    }

    function centerOnNode(index) {
      const total = skillsData.length;
      rotationAngle = 270 - (index / total) * 360;
      applyNodePositions();
    }

    function showDetail(index) {
      const item = skillsData[index];
      if (!item || !constellationDetail) return;

      if (constellationDetailNum) constellationDetailNum.textContent = item.num;
      if (constellationDetailTitle) constellationDetailTitle.textContent = item.title;
      if (constellationDetailList) {
        constellationDetailList.innerHTML = item.skills.map(function (skill) {
          return "<li>" + skill + "</li>";
        }).join("");
      }

      constellationDetail.hidden = false;
      if (constellationBackdrop) constellationBackdrop.hidden = false;
      if (constellationHint) constellationHint.textContent = "Tap backdrop or press Esc to close";
    }

    function closeDetail() {
      activeIndex = null;
      autoRotate = true;
      nodeButtons.forEach(function (btn) { btn.classList.remove("is-active"); });
      if (constellationDetail) constellationDetail.hidden = true;
      if (constellationBackdrop) constellationBackdrop.hidden = true;
      if (constellationHint) constellationHint.textContent = "Click a node to explore";
      startAutoRotate();
    }

    function toggleNode(index) {
      if (activeIndex === index) {
        closeDetail();
        return;
      }

      activeIndex = index;
      autoRotate = false;
      stopAutoRotate();
      centerOnNode(index);

      nodeButtons.forEach(function (btn, i) {
        btn.classList.toggle("is-active", i === index);
        btn.setAttribute("aria-expanded", i === index ? "true" : "false");
      });

      showDetail(index);
    }

    function buildNodes() {
      constellationNodes.innerHTML = "";
      nodeButtons = skillsData.map(function (item, index) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "constellation__node";
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", item.title + " skills");
        btn.innerHTML = "<span class=\"mono\">" + item.num + "</span><span class=\"constellation__node-label\">" + item.title + "</span>";
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleNode(index);
        });
        constellationNodes.appendChild(btn);
        return btn;
      });
    }

    function startAutoRotate() {
      stopAutoRotate();
      if (reducedMotionQuery.matches || !desktopQuery.matches) return;

      rotationTimer = window.setInterval(function () {
        if (!autoRotate) return;
        rotationAngle = (rotationAngle + 0.28) % 360;
        applyNodePositions();
      }, 50);
    }

    function stopAutoRotate() {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
    }

    function initConstellation() {
      if (!desktopQuery.matches) {
        stopAutoRotate();
        return;
      }

      orbitRadius = getOrbitRadius();
      if (!nodeButtons.length) buildNodes();
      applyNodePositions();
      startAutoRotate();
    }

    if (constellationBackdrop) {
      constellationBackdrop.addEventListener("click", closeDetail);
    }

    if (constellationStage) {
      constellationStage.addEventListener("click", function (e) {
        if (e.target === constellationStage && activeIndex !== null) closeDetail();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && activeIndex !== null) closeDetail();
    });

    desktopQuery.addEventListener("change", initConstellation);
    window.addEventListener("resize", function () {
      if (!desktopQuery.matches) return;
      orbitRadius = getOrbitRadius();
      if (activeIndex !== null) centerOnNode(activeIndex);
      else applyNodePositions();
    });

    initConstellation();
  }
})();
