/* =========================================================
   bk_tshirt · live GitHub dashboard
   Public GitHub REST API, no token, cached in localStorage.
   Auto refresh: every 5 minutes.
   ========================================================= */

(() => {
  "use strict";

  const GITHUB_USER = "Bktshirt001";
  const DISPLAY_NAME = "bk_tshirt";
  const API_ROOT = "https://api.github.com";
  const CACHE_KEY = "bktshirt:github:v1";
  const CACHE_TTL = 5 * 60 * 1000;
  const REFRESH_INTERVAL = 5 * 60 * 1000;
  const MAX_REPOS = 6;

  const repoGrid = document.getElementById("repo-grid");
  if (!repoGrid) return;

  const ui = {
    login: document.getElementById("gh-login"),
    bio: document.getElementById("gh-bio"),
    repos: document.getElementById("stat-repos"),
    stars: document.getElementById("stat-stars"),
    followers: document.getElementById("stat-followers"),
    rate: document.getElementById("stat-rate"),
    status: document.getElementById("api-status"),
    refresh: document.getElementById("gh-refresh"),
    last: document.getElementById("sync-last"),
    countdown: document.getElementById("sync-countdown"),
    track: document.getElementById("sync-track"),
    pill: document.getElementById("gh-live-pill")
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fallbackProfile = {
    login: GITHUB_USER,
    name: DISPLAY_NAME,
    bio: "less is more",
    public_repos: 4,
    followers: 0,
    following: 3,
    avatar_url: "https://avatars.githubusercontent.com/u/300708560?v=4&s=200"
  };

  const fallbackRepos = [
    {
      name: "Bktshirt001.github.io",
      html_url: "https://github.com/Bktshirt001/Bktshirt001.github.io",
      description: "我的个人介绍网站",
      language: "JavaScript",
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: "2026-11-12T03:55:08Z",
      fork: false
    },
    {
      name: "crapper-test-",
      html_url: "https://github.com/Bktshirt001/crapper-test-",
      description: "test",
      language: "Python",
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: "2026-08-25T07:44:46Z",
      fork: false
    },
    {
      name: "nmap_rep",
      html_url: "https://github.com/Bktshirt001/nmap_rep",
      description: "一个懒人用的脚本，要 nmap",
      language: "Shell",
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: "2026-07-21T15:58:55Z",
      fork: false
    },
    {
      name: "guess",
      html_url: "https://github.com/Bktshirt001/guess",
      description: null,
      language: "Rust",
      stargazers_count: 1,
      forks_count: 0,
      pushed_at: "2026-07-13T12:36:38Z",
      fork: false
    }
  ];

  const state = {
    profile: null,
    repos: [],
    lastSynced: 0,
    rateRemaining: null,
    remainingSeconds: REFRESH_INTERVAL / 1000,
    loading: false,
    source: "loading",
    syncLabel: ""
  };

  const languageColors = {
    Rust: "#dea584",
    Python: "#3572a5",
    Shell: "#89e051",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
    Go: "#00add8",
    "C++": "#f34b7d",
    C: "#555555",
    Java: "#b07219",
    "Jupyter Notebook": "#da5b0b"
  };

  const escapeHTML = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const relativeTime = (dateString) => {
    const time = new Date(dateString).getTime();
    if (!Number.isFinite(time)) return "未知时间";

    const diff = Math.max(0, Date.now() - time);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) return "刚刚";
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
    if (diff < month) return `${Math.floor(diff / day)} 天前`;
    if (diff < year) return `${Math.floor(diff / month)} 个月前`;
    return `${Math.floor(diff / year)} 年前`;
  };

  const formatCount = (value) => {
    const number = Number(value) || 0;
    if (number >= 10000) return `${(number / 10000).toFixed(1).replace(/\.0$/, "")}w`;
    if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(number);
  };

  const animateNumber = (element, target) => {
    if (!element) return;

    if (reduceMotion) {
      element.textContent = formatCount(target);
      return;
    }

    const startValue = Number.parseInt(element.textContent.replace(/[^\d]/g, ""), 10);
    const from = Number.isFinite(startValue) ? startValue : 0;
    const duration = 700;
    const startedAt = performance.now();

    const step = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(Math.round(from + (target - from) * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  };

  const setStatus = (kind, message) => {
    state.source = kind;
    if (!ui.status) return;
    ui.status.dataset.state = kind;
    const label = ui.status.querySelector("span");
    if (label) label.textContent = message;

    if (ui.pill) {
      ui.pill.dataset.state = kind;
      const pillLabel = ui.pill.querySelector("span");
      const pillText = {
        live: "LIVE",
        cached: "CACHE",
        loading: "CONNECTING",
        error: "OFFLINE"
      }[kind] || "GITHUB";
      if (pillLabel) pillLabel.textContent = pillText;
    }
  };

  const readCache = () => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.profile || !Array.isArray(parsed.repos) || !parsed.savedAt) {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  };

  const writeCache = (payload) => {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      /* private mode / storage full: live data still works */
    }
  };

  const updateRateFromResponse = (response) => {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining !== null && remaining !== "") {
      const parsed = Number.parseInt(remaining, 10);
      if (Number.isFinite(parsed)) state.rateRemaining = parsed;
    }
  };

  const fetchJSON = async (url) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        cache: "no-store",
        signal: controller.signal
      });

      updateRateFromResponse(response);

      if (!response.ok) {
        const error = new Error(`GitHub API ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const renderProfile = (profile) => {
    state.profile = profile;

    if (ui.login) ui.login.textContent = `@${profile.login || GITHUB_USER}`;
    if (ui.bio) ui.bio.textContent = profile.bio || "less is more";

    const repoCount = Number(profile.public_repos) || state.repos.length || 0;
    const starCount = state.repos.reduce((sum, repo) => sum + (Number(repo.stargazers_count) || 0), 0);
    const followers = Number(profile.followers) || 0;

    animateNumber(ui.repos, repoCount);
    animateNumber(ui.stars, starCount);
    animateNumber(ui.followers, followers);

    if (ui.rate) {
      ui.rate.textContent = state.rateRemaining === null ? "--" : `${state.rateRemaining}/60`;
    }
  };

  const renderRepos = (repos) => {
    const validRepos = (Array.isArray(repos) ? repos : [])
      .filter((repo) => repo && !repo.fork && !repo.archived)
      .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))
      .slice(0, MAX_REPOS);

    state.repos = validRepos;

    if (!validRepos.length) {
      repoGrid.innerHTML = '<div class="repo-error">暂时没有公开仓库，稍后再来看看吧。</div>';
      repoGrid.setAttribute("aria-busy", "false");
      return;
    }

    const now = Date.now();
    const ages = validRepos.map((repo) => Math.max(0, now - new Date(repo.pushed_at || 0).getTime()));
    const maxAge = Math.max(1, ...ages);

    repoGrid.innerHTML = validRepos
      .map((repo) => {
        const age = Math.max(0, now - new Date(repo.pushed_at || 0).getTime());
        const freshness = Math.round(clamp(100 - (age / maxAge) * 78, 18, 100));
        const language = repo.language || "Text";
        const languageColor = languageColors[language] || "#c99a7c";
        const description = repo.description
          ? escapeHTML(repo.description)
          : "这个仓库还没有写简介，但代码已经在路上。";
        const stars = Number(repo.stargazers_count) || 0;
        const forks = Number(repo.forks_count) || 0;

        return `
          <a class="repo-card" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">
            <div class="repo-top">
              <span class="repo-mark" aria-hidden="true">
                <svg class="icon" viewBox="0 0 24 24"><use href="#i-github"/></svg>
              </span>
              <span class="repo-updated" title="最近一次推送：${escapeHTML(repo.pushed_at || "未知")}">${escapeHTML(relativeTime(repo.pushed_at))}更新</span>
            </div>
            <h4>${escapeHTML(repo.name)}</h4>
            <p>${description}</p>
            <div class="repo-meter" title="更新热度 ${freshness}%（按最近推送时间计算）" aria-hidden="true">
              <span style="width:${freshness}%"></span>
            </div>
            <div class="repo-meta">
              <span><i class="language-dot" style="background:${languageColor}"></i>${escapeHTML(language)}</span>
              <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"/></svg>${stars}</span>
              <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-fork"/></svg>${forks}</span>
              <span>更新热度 ${freshness}%</span>
            </div>
          </a>
        `;
      })
      .join("");

    repoGrid.setAttribute("aria-busy", "false");
  };

  const renderAll = (profile, repos) => {
    renderRepos(repos);
    if (profile) renderProfile(profile);

    if (ui.rate) {
      ui.rate.textContent = state.rateRemaining === null ? "--" : `${state.rateRemaining}/60`;
    }

    updateSyncCopy();
  };

  const updateSyncCopy = () => {
    if (!ui.last) return;

    if (state.syncLabel) {
      ui.last.textContent = state.syncLabel;
      return;
    }

    ui.last.textContent = state.lastSynced
      ? `上次同步 ${relativeTime(new Date(state.lastSynced).toISOString())}`
      : "等待首次同步";
  };

  const updateCountdownUI = () => {
    const total = REFRESH_INTERVAL / 1000;
    const remaining = clamp(state.remainingSeconds, 0, total);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const progress = (1 - remaining / total) * 100;

    if (ui.countdown) {
      ui.countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    if (ui.track) ui.track.value = progress;
  };

  const setLoading = (loading) => {
    state.loading = loading;

    if (ui.refresh) {
      ui.refresh.disabled = loading;
      ui.refresh.classList.toggle("is-spinning", loading);
    }

    if (loading) {
      repoGrid.setAttribute("aria-busy", "true");
      setStatus("loading", "连接 GitHub…");
    }
  };

  const commit = (profile, repos, source, savedAt) => {
    state.lastSynced = source === "fallback" ? 0 : savedAt || Date.now();
    state.remainingSeconds = REFRESH_INTERVAL / 1000;
    state.syncLabel =
      source === "stale"
        ? `缓存于 ${relativeTime(new Date(savedAt).toISOString())}`
        : source === "fallback"
          ? "离线示例 · 等待 API 恢复"
          : "";

    renderAll(profile, repos);
    updateCountdownUI();
    updateSyncCopy();

    if (source === "live") {
      setStatus("live", "GitHub API · 已同步");
      writeCache({
        profile,
        repos,
        savedAt: state.lastSynced
      });
    } else if (source === "cache") {
      setStatus("cached", "缓存数据 · 稍后自动更新");
    } else {
      setStatus("error", "网络异常 · 正在重试");
    }
  };

  const loadFromGitHub = async ({ force = false } = {}) => {
    if (state.loading) return;

    const cached = readCache();
    if (!force && cached && Date.now() - cached.savedAt < CACHE_TTL) {
      commit(cached.profile, cached.repos, "cache", cached.savedAt);
      state.remainingSeconds = Math.max(1, (CACHE_TTL - (Date.now() - cached.savedAt)) / 1000);
      updateCountdownUI();
      return;
    }

    setLoading(true);

    try {
      const [profile, repos] = await Promise.all([
        fetchJSON(`${API_ROOT}/users/${GITHUB_USER}`),
        fetchJSON(`${API_ROOT}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`)
      ]);

      commit(profile, repos, "live", Date.now());

      if (ui.rate) {
        ui.rate.textContent = state.rateRemaining === null ? "--" : `${state.rateRemaining}/60`;
      }
    } catch (error) {
      if (cached) {
        commit(cached.profile, cached.repos, "stale", cached.savedAt);
        setStatus("error", error.status === 403 ? "API 限流 · 显示缓存" : "连接失败 · 显示缓存");
      } else {
        commit(fallbackProfile, fallbackRepos, "fallback", Date.now());
        setStatus("error", error.status === 403 ? "API 限流 · 离线展示" : "连接失败 · 离线展示");
      }
    } finally {
      setLoading(false);
    }
  };

  ui.refresh?.addEventListener("click", () => {
    loadFromGitHub({ force: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.remainingSeconds <= 0) {
      loadFromGitHub({ force: true });
    }
  });

  updateCountdownUI();
  setStatus("loading", "连接 GitHub…");
  loadFromGitHub();

  window.setInterval(() => {
    if (document.hidden) return;

    state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
    updateCountdownUI();
    updateSyncCopy();

    if (state.remainingSeconds <= 0 && !state.loading) {
      loadFromGitHub({ force: true });
    }
  }, 1000);
})();
