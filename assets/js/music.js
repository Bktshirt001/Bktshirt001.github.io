/* =========================================================
   bk_tshirt · random personal anime playlist
   Local playlist supplied by the site owner.
   ========================================================= */

(() => {
  "use strict";

  const TRACKS = [
    {
      title: "光るなら",
      artist: "Goose house",
      src: "assets/audio/Goose house - 光るなら.mp3"
    },
    {
      title: "裏切りアリス",
      artist: "M-ART、GUMI",
      src: "assets/audio/M-ART、GUMI - 里切りアリス.mp3"
    },
    {
      title: "華色の青春",
      artist: "うたたね歌菜",
      src: "assets/audio/うたたね歌菜 - 华色の青春.mp3"
    },
    {
      title: "つよがるガール",
      artist: "ぼっちぼろまる、もっさ",
      src: "assets/audio/ぼっちぼろまる、もっさ - つよがるガール.mp3"
    },
    {
      title: "feel my soul",
      artist: "寺澤百花",
      src: "assets/audio/寺泽百花 - feel my soul.mp3"
    },
    {
      title: "标题.爱丽丝",
      artist: "草莓酱紫",
      src: "assets/audio/草莓酱紫 - 标题.爱丽丝 (DJ长音频).mp3"
    },
    {
      title: "楽園の扉",
      artist: "青葉りんご",
      src: "assets/audio/青叶りんご - 楽园の扉.mp3"
    }
  ];

  const player = document.getElementById("music-player");
  const audio = document.getElementById("bgm");
  const toggle = document.getElementById("music-toggle");
  const title = document.getElementById("music-title");
  const kicker = document.getElementById("music-kicker");

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
  audio.preload = "metadata";
  audio.volume = 0;

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
