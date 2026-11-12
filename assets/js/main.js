/* =========================================================
   bk_tshirt · interaction layer
   - per-character font reveal
   - scroll reveal + active navigation
   - mouse particle canvas
   - title leave / return behaviour
   ========================================================= */

(() => {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- image fallback ---------- */

  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const fallback = img.dataset.fallback;
      if (fallback && img.getAttribute("src") !== fallback) {
        img.setAttribute("src", fallback);
        img.removeAttribute("data-fallback");
      }
    });
  });

  /* ---------- per-character hero reveal ---------- */

  const splitTargets = document.querySelectorAll(".split-text");
  let charIndex = 0;

  splitTargets.forEach((target) => {
    const text = target.textContent || "";
    target.textContent = "";
    target.setAttribute("aria-hidden", "true");

    Array.from(text).forEach((character) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.setProperty("--i", String(charIndex));
      span.textContent = character === " " ? "\u00A0" : character;
      target.appendChild(span);
      charIndex += 1;
    });
  });

  /* ---------- reveal on scroll ---------- */

  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -38px 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  /* ---------- code preview expander ---------- */

  const codeWindow = document.querySelector(".code-window");
  const codeScroll = document.getElementById("code-scroll");
  const codeToggle = document.getElementById("code-toggle");
  const codeToggleLabel = document.getElementById("code-toggle-label");
  const codeHintText = document.getElementById("code-hint-text");
  const codeScrollNote = document.getElementById("code-scroll-note");

  const setCodeExpanded = (expanded) => {
    if (!codeWindow || !codeScroll || !codeToggle) return;

    codeWindow.classList.toggle("is-expanded", expanded);
    codeToggle.setAttribute("aria-expanded", String(expanded));
    codeToggle.setAttribute("aria-label", expanded ? "收起完整代码" : "展开完整代码");

    if (codeToggleLabel) codeToggleLabel.textContent = expanded ? "收起代码" : "展开代码";
    if (codeHintText) {
      codeHintText.textContent = expanded
        ? "滚动 / 拖动查看完整字符画"
        : "预览模式 · 点击「展开代码」";
    }
    if (codeScrollNote) codeScrollNote.textContent = expanded ? "SCROLL ↕ ↔" : "PREVIEW";

    codeScroll.tabIndex = expanded ? 0 : -1;
    if (!expanded) {
      codeScroll.scrollTop = 0;
      codeScroll.scrollLeft = 0;
    }
  };

  if (codeWindow && codeScroll && codeToggle) {
    setCodeExpanded(false);

    codeToggle.addEventListener("click", () => {
      setCodeExpanded(!codeWindow.classList.contains("is-expanded"));
    });

    codeScroll.addEventListener("click", () => {
      if (!codeWindow.classList.contains("is-expanded")) setCodeExpanded(true);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && codeWindow.classList.contains("is-expanded")) {
        setCodeExpanded(false);
        codeToggle.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- auto-slide sidebar / mobile drawer ---------- */

  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const navPeek = document.getElementById("nav-peek");
  const scrim = document.getElementById("drawer-scrim");
  const mobileQuery = window.matchMedia("(max-width: 1080px)");
  const desktopQuery = window.matchMedia("(min-width: 1081px)");
  let lastFocusedElement = null;
  let sidebarCloseTimer = 0;

  const isSidebarOpen = () => Boolean(sidebar?.classList.contains("is-open"));

  const clearSidebarClose = () => {
    window.clearTimeout(sidebarCloseTimer);
    sidebarCloseTimer = 0;
  };

  const focusSidebarNav = () => {
    const target = sidebar.querySelector(".nav-link.is-active") || sidebar.querySelector(".nav-link");
    target?.focus({ preventScroll: true });
  };

  const setSidebar = (open, options = {}) => {
    if (!sidebar) return;

    const { restoreFocus = false, focusNav = false } = options;
    clearSidebarClose();

    if (open) {
      if (!isSidebarOpen()) lastFocusedElement = document.activeElement;
      sidebar.classList.add("is-open");
      sidebar.inert = false;
      navPeek?.classList.add("is-hidden");
      navPeek?.setAttribute("aria-expanded", "true");
      navPeek?.setAttribute("aria-label", "关闭导航菜单");

      if (mobileQuery.matches) {
        body.classList.add("nav-open");
        menuToggle?.setAttribute("aria-expanded", "true");
        menuToggle?.setAttribute("aria-label", "关闭导航菜单");
      }

      if (focusNav) {
        window.setTimeout(focusSidebarNav, 240);
      }
      return;
    }

    sidebar.classList.remove("is-open");
    sidebar.inert = true;
    navPeek?.classList.remove("is-hidden");
    navPeek?.setAttribute("aria-expanded", "false");
    navPeek?.setAttribute("aria-label", "打开导航菜单");
    body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "打开导航菜单");

    if (restoreFocus) {
      const target = mobileQuery.matches ? menuToggle : navPeek;
      window.setTimeout(() => target?.focus({ preventScroll: true }), 20);
    }
  };

  const scheduleSidebarClose = (delay = 480) => {
    if (!desktopQuery.matches) return;
    clearSidebarClose();
    sidebarCloseTimer = window.setTimeout(() => setSidebar(false), delay);
  };

  menuToggle?.addEventListener("click", () => {
    setSidebar(!isSidebarOpen(), {
      focusNav: !isSidebarOpen(),
      restoreFocus: isSidebarOpen()
    });
  });

  navPeek?.addEventListener("click", (event) => {
    if (event.detail > 0 && isSidebarOpen()) return;
    setSidebar(!isSidebarOpen(), {
      focusNav: !isSidebarOpen(),
      restoreFocus: isSidebarOpen()
    });
  });

  scrim?.addEventListener("click", () => setSidebar(false));

  sidebar?.addEventListener("pointerenter", clearSidebarClose);
  sidebar?.addEventListener("pointerleave", (event) => {
    if (desktopQuery.matches && event.pointerType !== "touch") {
      scheduleSidebarClose(320);
    }
  });

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!desktopQuery.matches || event.pointerType === "touch") return;

      if (event.clientX <= 44) {
        clearSidebarClose();
        if (!isSidebarOpen()) setSidebar(true);
        return;
      }

      if (isSidebarOpen() && sidebar) {
        const rect = sidebar.getBoundingClientRect();
        if (event.clientX > rect.right + 28) scheduleSidebarClose(380);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    if (desktopQuery.matches && isSidebarOpen()) scheduleSidebarClose(120);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSidebarOpen()) {
      setSidebar(false, { restoreFocus: true });
    }
  });

  sidebar?.addEventListener("focusin", () => {
    if (desktopQuery.matches && !isSidebarOpen()) setSidebar(true);
  });

  const syncNavToViewport = () => {
    if (isSidebarOpen()) setSidebar(false);
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncNavToViewport);
  } else {
    mobileQuery.addListener(syncNavToViewport);
  }

  setSidebar(false);

  /* ---------- active nav & scroll progress ---------- */

  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);
  const progressBar = document.getElementById("scroll-progress-bar");
  const toTop = document.getElementById("to-top");

  const setActiveNav = (id) => {
    navLinks.forEach((link) => {
      const active = link.dataset.section === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  let activeLock = false;
  let activeLockTimer = 0;

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveNav(link.dataset.section);
      activeLock = true;
      window.clearTimeout(activeLockTimer);
      activeLockTimer = window.setTimeout(() => {
        activeLock = false;
      }, 900);

      if (mobileQuery.matches) {
        setSidebar(false);
      } else {
        window.setTimeout(() => setSidebar(false), 180);
      }
    });
  });

  const updateScrollUI = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;

    if (progressBar) progressBar.style.width = `${(progress * 100).toFixed(2)}%`;

    if (toTop) {
      toTop.classList.toggle("is-visible", window.scrollY > 560);
    }

    if (!activeLock) {
      const probe = window.scrollY + window.innerHeight * 0.38;
      let current = sections[0]?.id;

      for (const section of sections) {
        if (section.offsetTop <= probe) current = section.id;
      }

      if (current) setActiveNav(current);
    }
  };

  let scrollTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateScrollUI();
        scrollTicking = false;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------- title leave / return ---------- */

  const TITLE_HERE = "你好呀_^v^_";
  const TITLE_AWAY = "别走呀.T_T.";
  let pointerInside = true;
  let pageVisible = !document.hidden;

  const syncTitle = () => {
    document.title = pointerInside && pageVisible ? TITLE_HERE : TITLE_AWAY;
  };

  root.addEventListener("mouseleave", () => {
    pointerInside = false;
    syncTitle();
  });

  root.addEventListener("mouseenter", () => {
    pointerInside = true;
    syncTitle();
  });

  document.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget && !event.toElement) {
      pointerInside = false;
      syncTitle();
    }
  });

  window.addEventListener("blur", () => {
    pointerInside = false;
    syncTitle();
  });

  window.addEventListener("focus", () => {
    pointerInside = true;
    pageVisible = !document.hidden;
    syncTitle();
  });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    syncTitle();
  });

  syncTitle();

  /* ---------- mouse particle canvas ---------- */

  const canvas = document.getElementById("particle-canvas");

  if (canvas && !prefersReducedMotion) {
    const context = canvas.getContext("2d", { alpha: true });
    const particles = [];
    const ambient = [];
    const colors = [
      [232, 139, 120],
      [212, 106, 122],
      [224, 164, 88],
      [247, 201, 169],
      [255, 238, 218]
    ];

    let viewportWidth = 0;
    let viewportHeight = 0;
    let dpr = 1;
    let lastFrame = performance.now();
    let lastPointerX = -100;
    let lastPointerY = -100;
    let lastEmitTime = 0;

    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const pickColor = () => colors[Math.floor(Math.random() * colors.length)];

    const makeParticle = (x, y, options = {}) => {
      const color = options.color || pickColor();
      const size = randomBetween(2.3, 6.4) * (options.sizeScale || 1);
      return {
        x,
        y,
        vx: options.vx ?? randomBetween(-0.55, 0.55),
        vy: options.vy ?? randomBetween(-1.05, -0.2),
        gravity: randomBetween(0.002, 0.009),
        drag: randomBetween(0.986, 0.995),
        size,
        life: 0,
        maxLife: randomBetween(620, 1280),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.008, 0.008),
        color,
        alpha: randomBetween(0.48, 0.86),
        shape: Math.random() > 0.52 ? "petal" : "orb"
      };
    };

    const makeAmbient = (fresh = false) => {
      const color = pickColor();
      return {
        x: randomBetween(0, viewportWidth),
        y: fresh ? randomBetween(-viewportHeight * 0.2, viewportHeight) : viewportHeight + randomBetween(8, 70),
        vx: randomBetween(-0.09, 0.09),
        vy: randomBetween(-0.3, -0.08),
        sway: randomBetween(0.25, 0.85),
        swaySpeed: randomBetween(0.0006, 0.0015),
        phase: randomBetween(0, Math.PI * 2),
        size: randomBetween(1.5, 4.4),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.0015, 0.0015),
        color,
        alpha: randomBetween(0.1, 0.32),
        shape: Math.random() > 0.44 ? "petal" : "orb"
      };
    };

    const populateAmbient = () => {
      ambient.length = 0;
      const count = viewportWidth < 700 ? 13 : 22;
      for (let index = 0; index < count; index += 1) {
        ambient.push(makeAmbient(true));
      }
    };

    const resize = () => {
      viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      viewportHeight = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(viewportWidth * dpr);
      canvas.height = Math.round(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      populateAmbient();
    };

    const drawShape = (particle) => {
      const [r, g, b] = particle.color;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = particle.alpha;

      if (particle.shape === "petal") {
        const s = particle.size;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
        context.beginPath();
        context.moveTo(0, -s);
        context.bezierCurveTo(s * 0.94, -s * 0.15, s * 0.58, s * 0.86, 0, s);
        context.bezierCurveTo(-s * 0.58, s * 0.86, -s * 0.94, -s * 0.15, 0, -s);
        context.fill();
      } else {
        context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
        context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.75)`;
        context.shadowBlur = particle.size * 3.4;
        context.beginPath();
        context.arc(0, 0, particle.size * 0.56, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    };

    const emit = (x, y, amount = 1, burst = false) => {
      for (let index = 0; index < amount; index += 1) {
        const angle = randomBetween(0, Math.PI * 2);
        const speed = burst ? randomBetween(0.8, 3.2) : randomBetween(0.16, 0.9);
        particles.push(
          makeParticle(x + randomBetween(-5, 5), y + randomBetween(-5, 5), {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (burst ? 0.4 : 0.15),
            sizeScale: burst ? 1.05 : randomBetween(0.7, 1.12)
          })
        );
      }

      if (particles.length > 110) particles.splice(0, particles.length - 110);
    };

    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;

      const now = performance.now();
      const movement = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);

      if (movement < 5 || now - lastEmitTime < 22) return;

      emit(event.clientX, event.clientY, movement > 28 ? 2 : 1);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastEmitTime = now;
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "touch") return;
      emit(event.clientX, event.clientY, 11, true);
    };

    const animate = (now) => {
      const delta = Math.min(32, now - lastFrame);
      lastFrame = now;

      context.clearRect(0, 0, viewportWidth, viewportHeight);

      ambient.forEach((particle, index) => {
        particle.phase += particle.swaySpeed * delta;
        particle.x += particle.vx + Math.sin(particle.phase) * particle.sway * 0.08;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed * delta;
        drawShape(particle);

        if (
          particle.y < -40 ||
          particle.x < -50 ||
          particle.x > viewportWidth + 50
        ) {
          ambient[index] = makeAmbient(false);
        }
      });

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life += delta;
        particle.vx *= particle.drag;
        particle.vy = particle.vy * particle.drag + particle.gravity * delta;
        particle.x += particle.vx * (delta / 16.67);
        particle.y += particle.vy * (delta / 16.67);
        particle.rotation += particle.rotationSpeed * delta;

        const remaining = 1 - particle.life / particle.maxLife;
        if (remaining <= 0) {
          particles.splice(index, 1);
          continue;
        }

        particle.alpha = Math.max(0, remaining) * 0.82;
        drawShape(particle);
      }

      window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.requestAnimationFrame(animate);
  } else if (canvas) {
    canvas.style.display = "none";
  }

  /* ---------- small parallax on hero terminal ---------- */

  const heroVisual = document.querySelector(".hero-visual");
  const terminal = document.querySelector(".terminal-card");

  if (heroVisual && terminal && isFinePointer && !prefersReducedMotion) {
    let parallaxFrame = 0;

    heroVisual.addEventListener("pointermove", (event) => {
      if (parallaxFrame) return;
      parallaxFrame = window.requestAnimationFrame(() => {
        const rect = heroVisual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        terminal.style.transform = `rotate(${(-1.2 + x * 1.7).toFixed(2)}deg) translate3d(${(x * 7).toFixed(1)}px, ${(y * 5).toFixed(1)}px, 0)`;
        parallaxFrame = 0;
      });
    });

    heroVisual.addEventListener("pointerleave", () => {
      terminal.style.transform = "";
    });
  }
})();
