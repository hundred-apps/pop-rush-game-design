const multiplayer = (() => {
  const sessionKey = "pop-rush-online-room";
  let socket;
  let request;
  let reconnect;
  let state;
  let connected = false;
  const profileId = (() => {
    const key = "pop-rush-online-profile";
    try {
      const saved = localStorage.getItem(key);
      if (/^[a-f0-9]{32}$/.test(saved)) return saved;
      const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(key, id);
      return id;
    } catch {
      return null;
    }
  })();

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(sessionKey));
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    try {
      if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
      else sessionStorage.removeItem(sessionKey);
    } catch {
      // Multiplayer still works in browser tabs with storage blocked.
    }
  }

  function available() {
    if (location.protocol === "file:") return Promise.resolve(false);
    return fetch("/api/multiplayer", { cache: "no-store" })
      .then(async (response) => response.ok && (await response.json()).protocol === 3)
      .catch(() => false);
  }

  function send(type, data = {}) {
    if (!connected || !socket?.channel) return false;
    enqueue(socket, { type, ...data });
    return true;
  }

  function post(link, message) {
    return fetch(`/multiplayer/input/${link.channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      keepalive: message.type === "leave",
    }).then((response) => {
      if (!response.ok) throw new Error("Multiplayer input failed.");
    });
  }

  function enqueue(link, message) {
    link.pending = link.pending
      .then(() => { if (socket === link) return post(link, message); })
      .catch(() => connectionLost(link));
  }

  function connectionLost(link) {
    if (socket !== link) return;
    link.stream.close();
    socket = null;
    connected = false;
    if (request) {
      api.onStatus?.("Connection lost. Reconnecting…", false);
      reconnect = setTimeout(connect, 1000);
    }
  }

  function connect() {
    const stream = new EventSource("/multiplayer/events");
    const link = { stream, channel: null, pending: Promise.resolve() };
    socket = link;
    stream.addEventListener("message", (event) => {
      if (socket !== link) return;
      const message = JSON.parse(event.data);
      if (message.type === "channel") {
        link.channel = message.channel;
        enqueue(link, { type: "join", ...request, profileId, nickname: popPanels.getNickname(),
          character: popRules.players[selectedCharacterSeat()].character,
          cosmetics: popPanels.getLobbyCosmetics(),
          gameMode: document.querySelector("#online-queue-mode").value,
          modeLevel: Number(document.querySelector("#online-queue-level").value), xp: popPanels.getXp() });
      } else if (message.type === "state") {
        connected = true;
        state = message;
        request = { mode: state.mode, code: state.code, token: state.token };
        saveSession(request);
        api.onState?.(state);
      } else if (message.type === "error") {
        if (message.fatal) {
          request = null;
          saveSession(null);
          connectionLost(link);
        }
        api.onStatus?.(message.message, connected, message.fatal);
      }
    });
    stream.addEventListener("error", () => connectionLost(link));
  }

  function join(mode, code = "", boardId = "") {
    if (request?.mode === mode && (!code || request.code === code)) return;
    const saved = loadSession();
    const resume = saved?.mode === mode && (!code || saved.code === code) ? saved : null;
    leave();
    request = {
      ...(resume ?? { mode, code }),
      ...(boardId ? { boardId } : {}),
    };
    api.onStatus?.("Connecting to the room…", false);
    connect();
  }

  function leave() {
    clearTimeout(reconnect);
    if (socket) {
      const link = socket;
      if (connected && link.channel) {
        link.pending.then(() => post(link, { type: "leave" }))
          .catch(() => {}).finally(() => link.stream.close());
      } else {
        link.stream.close();
      }
      socket = null;
    }
    connected = false;
    state = null;
    request = null;
    saveSession(null);
  }

  const api = {
    available, send, join, leave, loadSession,
    async liveEvents() {
      if (location.protocol === "file:") return null;
      try {
        const response = await fetch("/api/live-events", {
          cache: "no-store", headers: profileId ? { "X-Pop-Profile": profileId } : {},
        });
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      }
    },
    async frenzyRecords() {
      if (location.protocol === "file:") return null;
      try {
        const response = await fetch("/api/frenzy", { cache: "no-store" });
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      }
    },
    get state() { return state; },
    get connected() { return connected; },
  };
  return api;
})();
