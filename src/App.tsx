import {
  Upload,
  Play,
  Square,
  Gamepad2,
  Save,
  FolderOpen,
  Cloud,
  File,
  LogOut,
  Globe,
  Settings,
  X,
} from "lucide-react";
import { Nostalgist } from "nostalgist";
import React, { useRef, useState, useEffect } from "react";

type DropboxFile = {
  ".tag": string;
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
};

type KeyBindings = {
  up: string;
  down: string;
  left: string;
  right: string;
  a: string;
  b: string;
  l: string;
  r: string;
  start: string;
  select: string;
};

const defaultBindings: KeyBindings = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  a: "z",
  b: "x",
  l: "a",
  r: "s",
  start: "enter",
  select: "shift",
};

const translations = {
  en: {
    title: "EmulaGBA",
    subtitle:
      "Connect your Dropbox to play your Game Boy Advance ROMs and sync your save states across devices.",
    connectDropbox: "Connect Dropbox",
    connectDropboxDesc:
      "Link your Dropbox account to access your ROMs and save states.",
    connectButton: "Connect with Dropbox",
    yourRoms: "Your Dropbox ROMs",
    refresh: "Refresh",
    disconnect: "Disconnect Dropbox",
    loadingFiles: "Loading files...",
    noFiles: "No .gba files found in your Dropbox App folder.",
    saveState: "Save State",
    loadState: "Load State",
    stop: "Stop",
    loading: "Loading...",
    arrows: "Arrows",
    dpad: "D-Pad",
    startSelect: "Start / Select",
    stateSaved: "State saved to Dropbox successfully!",
    stateSaveFailed: "Failed to save state to Dropbox.",
    stateLoaded: "State loaded successfully!",
    stateLoadFailed:
      "No save state found in Dropbox for this game, or failed to load.",
    selectGba: "Please select a .gba file",
    startFailed: "Failed to start emulator. Please try another ROM.",
    sessionExpired: "Dropbox session expired. Please connect again.",
    fetchFailed: "Failed to fetch files from Dropbox",
    authFailed: "Failed to initiate Dropbox connection.",
    popupBlocked:
      "Please allow popups for this site to connect your Dropbox account.",
    settings: "Settings",
    controls: "Controls",
    saveSettings: "Save Settings",
    pressKey: "Press any key...",
    restartRequired: "Changes will take effect the next time you start a game.",
    deviceMode: "Device Mode",
    pc: "PC (Keyboard)",
    mobile: "Mobile (Touch)",
  },
  pt: {
    title: "EmulaGBA",
    subtitle:
      "Conecte seu Dropbox para jogar suas ROMs de Game Boy Advance e sincronizar seus saves entre dispositivos.",
    connectDropbox: "Conectar Dropbox",
    connectDropboxDesc:
      "Vincule sua conta do Dropbox para acessar suas ROMs e saves.",
    connectButton: "Conectar com o Dropbox",
    yourRoms: "Suas ROMs no Dropbox",
    refresh: "Atualizar",
    disconnect: "Desconectar Dropbox",
    loadingFiles: "Carregando arquivos...",
    noFiles: "Nenhum arquivo .gba encontrado na pasta do seu App no Dropbox.",
    saveState: "Salvar Estado",
    loadState: "Carregar Estado",
    stop: "Parar",
    loading: "Carregando...",
    arrows: "Setas",
    dpad: "Direcional",
    startSelect: "Start / Select",
    stateSaved: "Estado salvo no Dropbox com sucesso!",
    stateSaveFailed: "Falha ao salvar o estado no Dropbox.",
    stateLoaded: "Estado carregado com sucesso!",
    stateLoadFailed:
      "Nenhum save state encontrado no Dropbox para este jogo, ou falha ao carregar.",
    selectGba: "Por favor, selecione um arquivo .gba",
    startFailed: "Falha ao iniciar o emulador. Tente outra ROM.",
    sessionExpired: "Sessão do Dropbox expirada. Por favor, conecte novamente.",
    fetchFailed: "Falha ao buscar arquivos do Dropbox",
    authFailed: "Falha ao iniciar a conexão com o Dropbox.",
    popupBlocked:
      "Por favor, permita pop-ups neste site para conectar sua conta do Dropbox.",
    settings: "Configurações",
    controls: "Controles",
    saveSettings: "Salvar Configurações",
    pressKey: "Pressione uma tecla...",
    restartRequired:
      "As alterações terão efeito na próxima vez que você iniciar um jogo.",
    deviceMode: "Modo de Dispositivo",
    pc: "PC (Teclado)",
    mobile: "Celular (Toque)",
  },
};

const getKeyCode = (key: string) => {
  if (key.length === 1) return key.toUpperCase().charCodeAt(0);
  const map: Record<string, number> = {
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    escape: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    backspace: 8,
    tab: 9,
  };
  return map[key] || 0;
};

const getCode = (key: string) => {
  if (key.length === 1) return `Key${key.toUpperCase()}`;
  const map: Record<string, string> = {
    enter: "Enter",
    shift: "ShiftLeft",
    ctrl: "ControlLeft",
    alt: "AltLeft",
    escape: "Escape",
    space: "Space",
    left: "ArrowLeft",
    up: "ArrowUp",
    right: "ArrowRight",
    down: "ArrowDown",
    backspace: "Backspace",
    tab: "Tab",
  };
  return map[key] || key;
};

const generateCodeVerifier = () => {
  const array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join("");
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const VirtualButton = ({
  label,
  actionKey,
  className,
}: {
  label: string;
  actionKey: string;
  className?: string;
}) => {
  const dispatchKey = (type: string, e: React.SyntheticEvent) => {
    e.preventDefault();
    const keyCode = getKeyCode(actionKey);
    const code = getCode(actionKey);
    const event = new KeyboardEvent(type, {
      key: actionKey,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    } as any);

    window.dispatchEvent(event);
    document.dispatchEvent(event);
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.dispatchEvent(event);
  };

  return (
    <button
      className={`select-none touch-none active:opacity-70 active:scale-95 transition-transform flex items-center justify-center font-bold shadow-sm ${className}`}
      onPointerDown={(e) => dispatchKey("keydown", e)}
      onPointerUp={(e) => dispatchKey("keyup", e)}
      onPointerLeave={(e) => dispatchKey("keyup", e)}
      onPointerCancel={(e) => dispatchKey("keyup", e)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
};

export default function App() {
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const t = translations[lang];

  const toggleLang = () => {
    setLang((prev) => (prev === "pt" ? "en" : "pt"));
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [romName, setRomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nostalgistRef = useRef<Nostalgist | null>(null);

  const [dropboxToken, setDropboxToken] = useState<string | null>(
    localStorage.getItem("dropbox_token"),
  );
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"pc" | "mobile">(() => {
    return (localStorage.getItem("gba_device_mode") as "pc" | "mobile") || "pc";
  });
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(() => {
    const saved = localStorage.getItem("gba_key_bindings");
    return saved ? JSON.parse(saved) : defaultBindings;
  });
  const [editingKey, setEditingKey] = useState<keyof KeyBindings | null>(null);

  useEffect(() => {
    if (!editingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      let key = e.key.toLowerCase();

      const keyMap: Record<string, string> = {
        " ": "space",
        arrowup: "up",
        arrowdown: "down",
        arrowleft: "left",
        arrowright: "right",
        control: "ctrl",
        escape: "escape",
        enter: "enter",
        shift: "shift",
        alt: "alt",
        tab: "tab",
        backspace: "backspace",
      };

      key = keyMap[key] || key;

      setKeyBindings((prev) => ({
        ...prev,
        [editingKey]: key,
      }));
      setEditingKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingKey]);

  useEffect(() => {
    const handleCallback = async () => {
      if (
        window.location.pathname === "/auth/callback" ||
        window.location.pathname === "/auth/callback/"
      ) {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          if (window.opener) {
            window.opener.postMessage({ type: "OAUTH_CODE", code }, "*");
            window.close();
            return;
          }

          const verifier = localStorage.getItem("pkce_verifier");
          if (verifier) {
            try {
              const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
              const redirectUri = `${window.location.origin}/auth/callback`;

              const tokenResponse = await fetch(
                "https://api.dropboxapi.com/oauth2/token",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri,
                    code_verifier: verifier,
                  }),
                },
              );

              const data = await tokenResponse.json();

              if (data.access_token) {
                localStorage.setItem("dropbox_token", data.access_token);
                window.location.href = "/";
              } else {
                document.body.innerHTML = `Authentication failed: ${JSON.stringify(
                  data,
                )}`;
              }
            } catch (error) {
              document.body.innerHTML = `Error: ${error}`;
            }
          } else {
            document.body.innerHTML = `No verifier found.`;
          }
        } else {
          document.body.innerHTML = `No code found.`;
        }
      }
    };

    handleCallback();
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        !event.origin.endsWith(".run.app") &&
        !event.origin.includes("localhost")
      ) {
        return;
      }
      
      if (event.data?.type === "OAUTH_CODE") {
        const code = event.data.code;
        const verifier = localStorage.getItem("pkce_verifier");

        if (code && verifier) {
          try {
            const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
            const redirectUri = `${window.location.origin}/auth/callback`;

            const tokenResponse = await fetch(
              "https://api.dropboxapi.com/oauth2/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: clientId,
                  grant_type: "authorization_code",
                  code: code,
                  redirect_uri: redirectUri,
                  code_verifier: verifier,
                }),
              },
            );

            const data = await tokenResponse.json();

            if (data.access_token) {
              setDropboxToken(data.access_token);
              localStorage.setItem("dropbox_token", data.access_token);
            } else {
              setError(`Authentication failed: ${JSON.stringify(data)}`);
            }
          } catch (error) {
            setError(`Error exchanging token: ${error}`);
          }
        } else {
          setError("No verifier found to exchange code.");
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (dropboxToken && !isPlaying) {
      fetchDropboxFiles();
    }
  }, [dropboxToken, isPlaying]);

  useEffect(() => {
    return () => {
      if (nostalgistRef.current) {
        nostalgistRef.current.exit({ removeCanvas: false });
      }
    };
  }, []);

  const fetchDropboxFiles = async () => {
    if (!dropboxToken) return;
    setIsLoadingFiles(true);
    setError(null);
    try {
      const response = await fetch(
        "https://api.dropboxapi.com/2/files/list_folder",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${dropboxToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "",
            recursive: false,
          }),
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Dropbox API Error:", response.status, errorText);
        if (response.status === 401) {
          handleLogout();
          throw new Error(t.sessionExpired);
        }
        if (response.status === 403 && errorText.includes("missing_scope")) {
          throw new Error(
            "Permissão negada. Certifique-se de que adicionou as permissões 'files.metadata.read', 'files.content.read' e 'files.content.write' no console do Dropbox e reconecte.",
          );
        }
        throw new Error(`${t.fetchFailed}: ${errorText}`);
      }
      const data = await response.json();
      setFiles(
        data.entries.filter((entry: DropboxFile) => entry[".tag"] === "file"),
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleConnectDropbox = async () => {
    try {
      const verifier = generateCodeVerifier();
      localStorage.setItem("pkce_verifier", verifier);
      const challenge = await generateCodeChallenge(verifier);

      const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback`;

      const params = new URLSearchParams({
        client_id: clientId || "",
        redirect_uri: redirectUri,
        response_type: "code",
        code_challenge: challenge,
        code_challenge_method: "S256",
      });

      const url = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;

      const authWindow = window.open(
        url,
        "oauth_popup",
        "width=600,height=700",
      );
      if (!authWindow) {
        alert(t.popupBlocked);
      }
    } catch (error) {
      console.error("OAuth error:", error);
      setError(t.authFailed);
    }
  };

  const handleLogout = () => {
    setDropboxToken(null);
    localStorage.removeItem("dropbox_token");
    setFiles([]);
  };

  const downloadDropboxFile = async (path: string): Promise<Blob> => {
    const response = await fetch(
      "https://content.dropboxapi.com/2/files/download",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dropboxToken}`,
          "Dropbox-API-Arg": JSON.stringify({ path }),
        },
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dropbox Download Error:", response.status, errorText);
      if (response.status === 403 && errorText.includes("missing_scope")) {
        throw new Error(
          "Permissão negada. Reconecte o Dropbox após adicionar as permissões.",
        );
      }
      throw new Error(`Failed to download file: ${errorText}`);
    }
    return await response.blob();
  };

  const uploadDropboxFile = async (path: string, file: Blob) => {
    const response = await fetch(
      "https://content.dropboxapi.com/2/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dropboxToken}`,
          "Dropbox-API-Arg": JSON.stringify({
            path,
            mode: "overwrite",
            autorename: false,
            mute: false,
          }),
          "Content-Type": "application/octet-stream",
        },
        body: file,
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dropbox Upload Error:", response.status, errorText);
      if (response.status === 403 && errorText.includes("missing_scope")) {
        throw new Error(
          "Permissão negada. Reconecte o Dropbox após adicionar as permissões.",
        );
      }
      throw new Error(`Failed to upload file: ${errorText}`);
    }
    return await response.json();
  };

  const handlePlayRom = async (file: DropboxFile) => {
    if (!file.name.toLowerCase().endsWith(".gba")) {
      setError(t.selectGba);
      return;
    }

    setRomName(file.name);
    setError(null);
    setIsLoading(true);

    try {
      if (nostalgistRef.current) {
        nostalgistRef.current.exit({ removeCanvas: false });
        nostalgistRef.current = null;
      }

      setIsPlaying(true);

      const romBlob = await downloadDropboxFile(file.path_lower);

      const nostalgist = await Nostalgist.gba({
        rom: romBlob,
        element: canvasRef.current!,
        retroarchConfig: {
          input_player1_a: keyBindings.a,
          input_player1_b: keyBindings.b,
          input_player1_l: keyBindings.l,
          input_player1_r: keyBindings.r,
          input_player1_start: keyBindings.start,
          input_player1_select: keyBindings.select,
          input_player1_up: keyBindings.up,
          input_player1_down: keyBindings.down,
          input_player1_left: keyBindings.left,
          input_player1_right: keyBindings.right,
        },
      });

      nostalgistRef.current = nostalgist;
    } catch (err: any) {
      console.error("Failed to start emulator:", err);
      setError(err.message || t.startFailed);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (nostalgistRef.current) {
      nostalgistRef.current.exit({ removeCanvas: false });
      nostalgistRef.current = null;
    }
    setIsPlaying(false);
    setRomName(null);
  };

  const handleSaveState = async () => {
    if (!nostalgistRef.current || !romName || !dropboxToken) return;
    setIsLoading(true);
    try {
      const { state } = await nostalgistRef.current.saveState();
      const stateFileName = `/${romName.replace(".gba", "")}.state`;
      await uploadDropboxFile(stateFileName, state);
      alert(t.stateSaved);
    } catch (err) {
      console.error("Failed to save state:", err);
      alert(t.stateSaveFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadState = async () => {
    if (!nostalgistRef.current || !romName || !dropboxToken) return;
    setIsLoading(true);
    try {
      const stateFileName = `/${romName.replace(".gba", "")}.state`;
      const stateBlob = await downloadDropboxFile(stateFileName);
      await nostalgistRef.current.loadState(stateBlob);
      alert(t.stateLoaded);
    } catch (err) {
      console.error("Failed to load state:", err);
      alert(t.stateLoadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans relative">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={toggleLang}
          className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === "pt" ? "EN" : "PT"}</span>
        </button>
      </div>

      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-full mb-2">
            <Gamepad2 className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            {t.title}
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto text-lg">{t.subtitle}</p>
        </div>

        {!isPlaying ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {!dropboxToken ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-zinc-800 border-dashed rounded-2xl bg-zinc-900/50">
                <Cloud className="w-12 h-12 text-indigo-400 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  {t.connectDropbox}
                </h2>
                <p className="text-zinc-400 text-center mb-6 max-w-sm">
                  {t.connectDropboxDesc}
                </p>
                <button
                  onClick={handleConnectDropbox}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {t.connectButton}
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-semibold text-white">{t.yourRoms}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchDropboxFiles}
                      className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {t.refresh}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t.disconnect}
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {isLoadingFiles ? (
                    <div className="p-8 text-center text-zinc-500">
                      {t.loadingFiles}
                    </div>
                  ) : files.filter((f) => f.name.toLowerCase().endsWith(".gba"))
                      .length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      {t.noFiles}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {files
                        .filter((f) => f.name.toLowerCase().endsWith(".gba"))
                        .map((file) => (
                          <button
                            key={file.id}
                            onClick={() => handlePlayRom(file)}
                            className="w-full flex items-center space-x-3 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors text-left group"
                          >
                            <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                              <File className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                            </div>
                            <span className="font-medium text-zinc-300 group-hover:text-white truncate">
                              {file.name}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl bg-zinc-900 p-4 rounded-2xl border border-zinc-800 gap-4">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-zinc-200 truncate max-w-[200px] md:max-w-xs">
                  {romName}
                </span>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={handleSaveState}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveState}</span>
                </button>
                <button
                  onClick={handleLoadState}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{t.loadState}</span>
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <Square className="w-4 h-4" />
                  <span>{t.stop}</span>
                </button>
              </div>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 w-full max-w-3xl aspect-[3/2] flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-10 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-zinc-400 font-medium">{t.loading}</p>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain focus:outline-none"
                tabIndex={0}
              />
            </div>

            {deviceMode === "pc" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl text-sm text-zinc-500">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 text-center">
                  <span className="block font-mono text-zinc-300 mb-1">
                    {keyBindings.up} {keyBindings.down} {keyBindings.left}{" "}
                    {keyBindings.right}
                  </span>
                  {t.dpad}
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 text-center">
                  <span className="block font-mono text-zinc-300 mb-1">
                    {keyBindings.a} / {keyBindings.b}
                  </span>
                  A / B
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 text-center">
                  <span className="block font-mono text-zinc-300 mb-1">
                    {keyBindings.l} / {keyBindings.r}
                  </span>
                  L / R
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 text-center">
                  <span className="block font-mono text-zinc-300 mb-1">
                    {keyBindings.start} / {keyBindings.select}
                  </span>
                  {t.startSelect}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 mt-2 touch-none select-none">
                <div className="flex justify-between w-full mb-6 px-2">
                  <VirtualButton
                    label="L"
                    actionKey={keyBindings.l}
                    className="w-20 h-10 bg-zinc-700 rounded-t-xl text-zinc-300 border-b-4 border-zinc-800"
                  />
                  <VirtualButton
                    label="R"
                    actionKey={keyBindings.r}
                    className="w-20 h-10 bg-zinc-700 rounded-t-xl text-zinc-300 border-b-4 border-zinc-800"
                  />
                </div>

                <div className="flex justify-between items-center px-2 mb-6">
                  {/* D-Pad */}
                  <div className="grid grid-cols-3 grid-rows-3 gap-1 w-32 h-32">
                    <div />
                    <VirtualButton
                      label="▲"
                      actionKey={keyBindings.up}
                      className="bg-zinc-700 rounded-t-xl text-zinc-300 border-b-4 border-zinc-800"
                    />
                    <div />
                    <VirtualButton
                      label="◀"
                      actionKey={keyBindings.left}
                      className="bg-zinc-700 rounded-l-xl text-zinc-300 border-b-4 border-zinc-800"
                    />
                    <div className="bg-zinc-800 rounded-sm" />
                    <VirtualButton
                      label="▶"
                      actionKey={keyBindings.right}
                      className="bg-zinc-700 rounded-r-xl text-zinc-300 border-b-4 border-zinc-800"
                    />
                    <div />
                    <VirtualButton
                      label="▼"
                      actionKey={keyBindings.down}
                      className="bg-zinc-700 rounded-b-xl text-zinc-300 border-b-4 border-zinc-800"
                    />
                    <div />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 items-end h-32 pb-4">
                    <VirtualButton
                      label="B"
                      actionKey={keyBindings.b}
                      className="w-14 h-14 rounded-full bg-red-600 text-white text-xl shadow-lg shadow-red-900/50 border-b-4 border-red-800"
                    />
                    <VirtualButton
                      label="A"
                      actionKey={keyBindings.a}
                      className="w-14 h-14 rounded-full bg-red-600 text-white text-xl shadow-lg shadow-red-900/50 border-b-4 border-red-800 mb-6"
                    />
                  </div>
                </div>

                {/* Start / Select */}
                <div className="flex justify-center gap-8 pb-2">
                  <div className="flex flex-col items-center gap-2">
                    <VirtualButton
                      label=""
                      actionKey={keyBindings.select}
                      className="w-16 h-5 bg-zinc-800 rounded-full shadow-inner border-b-2 border-zinc-900"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest">
                      SELECT
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <VirtualButton
                      label=""
                      actionKey={keyBindings.start}
                      className="w-16 h-5 bg-zinc-800 rounded-full shadow-inner border-b-2 border-zinc-900"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest">
                      START
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t.settings}</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                  {t.deviceMode}
                </h3>
                <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50 mb-6">
                  <button
                    onClick={() => setDeviceMode("pc")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      deviceMode === "pc"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {t.pc}
                  </button>
                  <button
                    onClick={() => setDeviceMode("mobile")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      deviceMode === "mobile"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {t.mobile}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                  {t.controls}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(keyBindings) as Array<keyof KeyBindings>).map(
                    (key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50"
                      >
                        <span className="text-sm font-medium text-zinc-300 uppercase w-12">
                          {key}
                        </span>
                        <button
                          onClick={() => setEditingKey(key)}
                          className={`px-3 py-1 text-xs font-mono rounded bg-zinc-950 border transition-colors min-w-[60px] ${
                            editingKey === key
                              ? "border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/50"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                          }`}
                        >
                          {editingKey === key ? "..." : keyBindings[key]}
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(
                    "gba_key_bindings",
                    JSON.stringify(keyBindings),
                  );
                  localStorage.setItem("gba_device_mode", deviceMode);
                  setIsSettingsOpen(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
              >
                {t.saveSettings}
              </button>
              {isPlaying && (
                <p className="text-xs text-center text-zinc-500 mt-2">
                  {t.restartRequired}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
