/* =========================================================
   bk_tshirt · random anime-style BGM
   Tracks are royalty-free / openly licensed (see README).
   ========================================================= */

(() => {
  "use strict";

  const TRACKS = [
    {
      title: "Anime-esque Theme",
      artist: "Cleyton Kauffman",
      src: "assets/audio/anime-esque.mp3",
      source: "https://opengameart.org/content/anime-esque-intro-outro-theme",
      license: "CC0"
    },
    {
      title: "Determination",
      artist: "HydroGene",
      src: "assets/audio/determination.mp3",
      source: "https://opengameart.org/content/determination-anime-style-music",
      license: "CC0"
    },
    {
      title: "Mauve Rhopalocera",
      artist: "ISAo",
      src: "assets/audio/mauve-rhopalocera.mp3",
      source: "https://opengameart.org/content/fantastic-japanese-style-shoot-em-up-game-music",
      license: "OGA-BY 3.0"
    }
  ];

  const player = document.getElementById("music-player");
  const audio = document.getElementById("bgm");
  const toggle = document.getElementById("music-toggle");
  const title = document.getElementById("music-title");
  const kicker = document.getElementById("music-kicker");
  const credit = document.getElementById("music-credit");

  if (!player || !audio || !toggle || !title || !kicker) return;

  const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const state = {
    blocked: false,
    userPaused: false,
    fadeFrame: 0
  };

  const setState = (value) => {
    player.dataset.state = value;
    toggle.setAttribute("aria-pressed", String(value === "playing"));
  };

  const setLabel = (main, sub) => {
    kicker.textContent = main;
    title.textContent = sub;
  };

  const updateTrackLabel = () => {
    setLabel("BGM · NOW PLAYING", `${track.title} · ${track.artist}`);
    toggle.setAttribute("aria-label", `暂停背景音乐：${track.title}，${track.artist}`);
  };

  const fadeTo = (targetVolume, duration = 1000) => {
    window.cancelAnimationFrame(state.fadeFrame);
    const from = audio.volume;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = Math.min(1, Math.max(0, from + (targetVolume - from) * eased));
      if (progress < 1) {
        state.fadeFrame = window.requestAnimationFrame(step);
      }
    };

    state.fadeFrame = window.requestAnimationFrame(step);
  };

  const showBlocked = () => {
    state.blocked = true;
    setState("blocked");
    kicker.textContent = "BGM · CLICK TO PLAY";
    title.textContent = `点击开启 · ${track.title}`;
    toggle.setAttribute("aria-label", `播放背景音乐：${track.title}，${track.artist}`);
  };

  const playMusic = async () => {
    if (!audio.paused) return;
    state.blocked = false;

    try {
      audio.volume = 0;
      await audio.play();
      fadeTo(0.34);
      updateTrackLabel();
      setState("playing");
    } catch (error) {
      if (audio.error) {
        setState("error");
        kicker.textContent = "BGM · UNAVAILABLE";
        title.textContent = "音乐加载失败";
        toggle.setAttribute("aria-label", "背景音乐加载失败");
      } else {
        showBlocked();
      }
    }
  };

  const pauseMusic = () => {
    state.userPaused = true;
    window.cancelAnimationFrame(state.fadeFrame);
    audio.pause();
    setState("paused");
    kicker.textContent = "BGM · PAUSED";
    title.textContent = `${track.title} · ${track.artist}`;
    toggle.setAttribute("aria-label", `继续播放背景音乐：${track.title}，${track.artist}`);
  };

  audio.src = track.src;
  audio.preload = "auto";
  audio.volume = 0;

  if (credit) {
    credit.href = track.source;
    credit.title = `${track.title} / ${track.artist} · ${track.license}`;
    credit.setAttribute("aria-label", `查看音乐来源：${track.title}，${track.artist}，${track.license}`);
  }

  title.textContent = `${track.title} · ${track.artist}`;
  setState("loading");
  audio.load();

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      state.userPaused = false;
      playMusic();
    } else {
      pauseMusic();
    }
  });

  const unlockOnGesture = (event) => {
    if (!state.blocked || state.userPaused) return;
    if (event.target instanceof Element && event.target.closest("#music-toggle, #music-credit")) return;
    playMusic();
  };

  document.addEventListener("pointerdown", unlockOnGesture, { capture: true, passive: true });
  document.addEventListener("keydown", unlockOnGesture, { capture: true });

  audio.addEventListener("pause", () => {
    if (!state.userPaused && !audio.ended && !state.blocked) {
      /* A browser or media interruption paused playback; keep the UI honest. */
      setState("paused");
      kicker.textContent = "BGM · PAUSED";
    }
  });

  audio.addEventListener("playing", () => {
    updateTrackLabel();
    setState("playing");
  });

  /* Keep the floating player clear of the footer controls. */
  const footer = document.querySelector(".footer");
  if (footer && "IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        const away = entry.isIntersecting && entry.intersectionRatio > 0.18;
        player.classList.toggle("is-away", away);
        player.inert = away;
      },
      { threshold: [0, 0.18, 0.5] }
    );
    footerObserver.observe(footer);
  }

  /* Browsers usually block audible autoplay until the first gesture.
     Try immediately anyway; fall back to a clear "click to play" state. */
  window.setTimeout(playMusic, 450);
})();
