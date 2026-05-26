"use client";

import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import StitchraAgentOrb from "./StitchraAgentOrb";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StitchraDesignActionDetail = {
  action:
    | "openAICreator"
    | "prefillIdeaPrompt"
    | "generateArtworkFromSuggestion"
    | "openUploadOwnDesign"
    | "setPlacement"
    | "setShirtColor"
    | "scrollToViewer";
  prompt?: string;
  placement?: string;
  shirtColor?: "black" | "white";
};

type SendStatus = "idle" | "streaming";
type LauncherPosition = {
  x: number;
  y: number;
};
type LauncherDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  moved: boolean;
};

const SUGGESTED_PROMPTS = [
  "Help me choose logo placement",
  "What logo file should I upload?",
  "How does pricing work?",
  "Can I order one T-shirt?",
  "When do I pay?",
  "Can I use a brand logo?",
];

const PUBLIC_ROUTE_EXCLUSIONS = [
  "/studio",
  "/api",
  "/order",
  "/pay",
  "/privacy",
  "/terms",
  "/impressum",
];

const LOCALE_SEGMENTS = new Set(["en", "de", "fr", "ar", "es", "ru"]);
const CLIENT_MAX_INPUT_CHARS = 1200;
const CLIENT_MAX_MESSAGES = 6;
const MOBILE_LAUNCHER_POSITION_KEY = "stitchra-agent-launcher-position-v1";
const AGENT_HELPER_SEEN_KEY = "stitchra-agent-help-seen-v1";
const MOBILE_DRAG_QUERY = "(max-width: 760px)";
const MOBILE_EDGE_PADDING = 12;
const MOBILE_TOP_SAFE_PADDING = 16;
const MOBILE_BOTTOM_RESERVED = 96;
const MOBILE_DRAG_THRESHOLD = 7;
const TEMPORARILY_UNAVAILABLE_MESSAGE =
  "The Stitchra AI Design Agent is temporarily unavailable. You can still use the configurator and submit a quote request.";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help you choose placement, prepare your logo file, understand the quote flow and decide what to upload.",
};

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePublicPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] && LOCALE_SEGMENTS.has(segments[0])) {
    segments.shift();
  }

  return `/${segments.join("/")}`;
}

function shouldHideAgent(pathname: string) {
  const normalizedPath = normalizePublicPath(pathname);

  return PUBLIC_ROUTE_EXCLUSIONS.some((prefix) => {
    return (
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    );
  });
}

function scrollToDesigner() {
  const target = document.getElementById("designer");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function dispatchDesignAction(detail: StitchraDesignActionDetail) {
  window.dispatchEvent(
    new CustomEvent("stitchra:design-action", {
      detail,
    }),
  );
}

function openLogoUpload() {
  scrollToDesigner();
  dispatchDesignAction({ action: "openUploadOwnDesign" });
  window.setTimeout(() => {
    const uploadInput = document.querySelector<HTMLInputElement>(
      ".stitchra-upload-box input[type='file']",
    );
    uploadInput?.click();
  }, 80);
}

function getLatestUserMessage(messages: ChatMessage[]) {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content.trim() ?? ""
  );
}

function getSuggestedArtworkPrompt(latestUserMessage: string) {
  const cleaned = latestUserMessage
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

  if (/eid|adha|ramadan|lantern|crescent/i.test(cleaned)) {
    return "school Eid al-Adha badge with crescent, lantern and bold text";
  }

  if (/school|club|team|event|badge|logo|design|shirt/i.test(cleaned)) {
    return cleaned;
  }

  return "clean event badge with bold text, simple icon and 4-6 colors";
}

function shouldShowArtworkActions(latestUserMessage: string) {
  return /design|idea|logo|badge|event|school|eid|create|generate|artwork/i.test(
    latestUserMessage,
  );
}

function getViewportSize() {
  const visualViewport = window.visualViewport;

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    offsetTop: visualViewport?.offsetTop ?? 0,
  };
}

function clampLauncherPosition(
  position: LauncherPosition,
  size: { width: number; height: number },
) {
  const viewport = getViewportSize();
  const minX = viewport.offsetLeft + MOBILE_EDGE_PADDING;
  const minY = viewport.offsetTop + MOBILE_TOP_SAFE_PADDING;
  const maxX = Math.max(
    minX,
    viewport.offsetLeft + viewport.width - size.width - MOBILE_EDGE_PADDING,
  );
  const maxY = Math.max(
    minY,
    viewport.offsetTop + viewport.height - size.height - MOBILE_BOTTOM_RESERVED,
  );

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY),
  };
}

function getDefaultLauncherPosition(size: { width: number; height: number }) {
  const viewport = getViewportSize();

  return clampLauncherPosition(
    {
      x: viewport.offsetLeft + viewport.width - size.width - MOBILE_EDGE_PADDING,
      y: viewport.offsetTop + viewport.height - size.height - MOBILE_BOTTOM_RESERVED,
    },
    size,
  );
}

function isMobileLauncherViewport() {
  const viewport = getViewportSize();
  const hasTouch =
    navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const narrowViewport =
    viewport.width <= 760 || window.innerWidth <= 760;

  return narrowViewport || (hasTouch && viewport.width <= 1024);
}

function isReasonableSavedPosition(
  position: LauncherPosition,
  size: { width: number; height: number },
) {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return false;
  }

  const viewport = getViewportSize();
  const looseLeft = viewport.offsetLeft - size.width * 1.5;
  const looseTop = viewport.offsetTop - size.height * 1.5;
  const looseRight = viewport.offsetLeft + viewport.width + size.width * 0.75;
  const looseBottom = viewport.offsetTop + viewport.height + size.height * 0.75;

  return (
    position.x >= looseLeft &&
    position.x <= looseRight &&
    position.y >= looseTop &&
    position.y <= looseBottom
  );
}

function loadSavedLauncherPosition() {
  try {
    const raw = window.localStorage.getItem(MOBILE_LAUNCHER_POSITION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LauncherPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
    };
  } catch {
    return null;
  }
}

function saveLauncherPosition(position: LauncherPosition) {
  try {
    window.localStorage.setItem(
      MOBILE_LAUNCHER_POSITION_KEY,
      JSON.stringify(position),
    );
  } catch {
    // The launcher still works when storage is unavailable.
  }
}

function clearSavedLauncherPosition() {
  try {
    window.localStorage.removeItem(MOBILE_LAUNCHER_POSITION_KEY);
  } catch {
    // Ignore storage failures; the current session can still reset visually.
  }
}

function clearResetAgentQueryFlag() {
  let url: URL;

  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }

  if (url.searchParams.get("resetAgent") !== "1") {
    return;
  }

  clearSavedLauncherPosition();
  url.searchParams.delete("resetAgent");

  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;

  try {
    window.history.replaceState(null, "", nextUrl || "/");
  } catch {
    // Query cleanup is only a recovery convenience. The saved position is already cleared.
  }
}

function rememberAgentHelperSeen() {
  try {
    window.sessionStorage.setItem(AGENT_HELPER_SEEN_KEY, "true");
  } catch {
    // Session hints are optional.
  }
}

function hasSeenAgentHelper() {
  try {
    return window.sessionStorage.getItem(AGENT_HELPER_SEEN_KEY) === "true";
  } catch {
    return true;
  }
}

function isLauncherRectVisible(element: HTMLElement | null) {
  if (!element) {
    return true;
  }

  const rect = element.getBoundingClientRect();
  const viewport = getViewportSize();
  const visibleLeft = 0;
  const visibleTop = 0;
  const visibleRight = viewport.width;
  const visibleBottom = viewport.height;

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left >= visibleLeft - 1 &&
    rect.top >= visibleTop - 1 &&
    rect.right <= visibleRight + 1 &&
    rect.bottom <= visibleBottom - 1
  );
}

export default function StitchraDesignAgent() {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [isMobileDraggable, setIsMobileDraggable] = useState(false);
  const [showHelperCloud, setShowHelperCloud] = useState(false);
  const [launcherPosition, setLauncherPosition] =
    useState<LauncherPosition | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const launcherPositionRef = useRef<LauncherPosition | null>(null);
  const pendingLauncherPositionRef = useRef<LauncherPosition | null>(null);
  const launcherAnimationFrameRef = useRef<number | null>(null);
  const launcherDragRef = useRef<LauncherDragState | null>(null);
  const suppressLauncherClickRef = useRef(false);

  const isHidden = useMemo(() => shouldHideAgent(pathname), [pathname]);

  const applyLauncherPosition = useCallback((position: LauncherPosition) => {
    const nextPosition = {
      x: Math.round(position.x),
      y: Math.round(position.y),
    };
    const currentPosition = launcherPositionRef.current;

    if (
      currentPosition &&
      Math.abs(currentPosition.x - nextPosition.x) < 1 &&
      Math.abs(currentPosition.y - nextPosition.y) < 1
    ) {
      return;
    }

    launcherPositionRef.current = nextPosition;
    setLauncherPosition(nextPosition);
  }, []);

  const getLauncherSize = useCallback(() => {
    const rect = launcherRef.current?.getBoundingClientRect();

    return {
      width: rect?.width ?? 48,
      height: rect?.height ?? 48,
    };
  }, []);

  const resetLauncherPosition = useCallback(() => {
    if (!isMobileDraggable) {
      return;
    }

    const nextPosition = getDefaultLauncherPosition(getLauncherSize());
    clearSavedLauncherPosition();
    applyLauncherPosition(nextPosition);
  }, [applyLauncherPosition, getLauncherSize, isMobileDraggable]);

  const dismissHelperCloud = useCallback(() => {
    rememberAgentHelperSeen();
    setShowHelperCloud(false);
  }, []);

  const clampCurrentLauncherPosition = useCallback((save = true) => {
    const size = getLauncherSize();
    const currentPosition =
      launcherPositionRef.current ?? getDefaultLauncherPosition(size);
    const nextPosition = clampLauncherPosition(currentPosition, size);

    applyLauncherPosition(nextPosition);
    if (save) {
      saveLauncherPosition(nextPosition);
    }

    window.requestAnimationFrame(() => {
      if (!isLauncherRectVisible(launcherRef.current)) {
        const fallbackPosition = getDefaultLauncherPosition(getLauncherSize());
        clearSavedLauncherPosition();
        applyLauncherPosition(fallbackPosition);
      }
    });
  }, [applyLauncherPosition, getLauncherSize]);

  useEffect(() => {
    clearResetAgentQueryFlag();

    return () => {
      abortControllerRef.current?.abort();
      if (launcherAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(launcherAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      isHidden ||
      isOpen ||
      !isMobileLauncherViewport() ||
      hasSeenAgentHelper() ||
      document.body.dataset.stitchraMobileSheetOpen === "true"
    ) {
      return undefined;
    }

    const showFrame = window.requestAnimationFrame(() => {
      setShowHelperCloud(true);
    });
    const timeout = window.setTimeout(() => {
      dismissHelperCloud();
    }, 5200);
    const hideOnScroll = () => dismissHelperCloud();

    window.addEventListener("scroll", hideOnScroll, { passive: true, once: true });

    return () => {
      window.cancelAnimationFrame(showFrame);
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", hideOnScroll);
    };
  }, [dismissHelperCloud, isHidden, isOpen]);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_DRAG_QUERY);

    const updateMobileMode = () => {
      const shouldEnable = query.matches || isMobileLauncherViewport();
      setIsMobileDraggable(shouldEnable);
      if (!shouldEnable) {
        setLauncherPosition(null);
        launcherPositionRef.current = null;
        launcherDragRef.current = null;
      }
    };

    updateMobileMode();
    query.addEventListener("change", updateMobileMode);
    window.addEventListener("resize", updateMobileMode);
    window.addEventListener("orientationchange", updateMobileMode);
    window.visualViewport?.addEventListener("resize", updateMobileMode);

    return () => {
      query.removeEventListener("change", updateMobileMode);
      window.removeEventListener("resize", updateMobileMode);
      window.removeEventListener("orientationchange", updateMobileMode);
      window.visualViewport?.removeEventListener("resize", updateMobileMode);
    };
  }, []);

  useEffect(() => {
    if (!isMobileDraggable || isHidden) {
      return undefined;
    }

    const initializePosition = () => {
      const size = getLauncherSize();
      const savedPosition = loadSavedLauncherPosition();
      const hasValidSavedPosition =
        savedPosition && isReasonableSavedPosition(savedPosition, size);
      const nextPosition = hasValidSavedPosition
        ? clampLauncherPosition(savedPosition, size)
        : getDefaultLauncherPosition(size);

      if (savedPosition && !hasValidSavedPosition) {
        clearSavedLauncherPosition();
      }

      applyLauncherPosition(nextPosition);
      if (hasValidSavedPosition) {
        saveLauncherPosition(nextPosition);
      }

      window.requestAnimationFrame(() => {
        if (!isLauncherRectVisible(launcherRef.current)) {
          const fallbackPosition = getDefaultLauncherPosition(getLauncherSize());
          clearSavedLauncherPosition();
          applyLauncherPosition(fallbackPosition);
        }
      });
    };

    const frame = window.requestAnimationFrame(initializePosition);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [applyLauncherPosition, getLauncherSize, isHidden, isMobileDraggable]);

  useEffect(() => {
    if (!isMobileDraggable || isHidden) {
      return undefined;
    }

    const clampToViewport = () => clampCurrentLauncherPosition();
    const clampWhenVisible = () => {
      if (document.visibilityState === "visible") {
        clampCurrentLauncherPosition();
      }
    };

    window.addEventListener("resize", clampToViewport);
    window.addEventListener("orientationchange", clampToViewport);
    document.addEventListener("visibilitychange", clampWhenVisible);
    window.visualViewport?.addEventListener("resize", clampToViewport);
    window.visualViewport?.addEventListener("scroll", clampToViewport);

    return () => {
      window.removeEventListener("resize", clampToViewport);
      window.removeEventListener("orientationchange", clampToViewport);
      document.removeEventListener("visibilitychange", clampWhenVisible);
      window.visualViewport?.removeEventListener("resize", clampToViewport);
      window.visualViewport?.removeEventListener("scroll", clampToViewport);
    };
  }, [clampCurrentLauncherPosition, isHidden, isMobileDraggable]);

  useEffect(() => {
    if (!isOpen) return;
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [isOpen, messages]);

  if (isHidden) {
    return null;
  }

  async function sendMessage(prompt?: string) {
    const content = (prompt ?? input).trim().slice(0, CLIENT_MAX_INPUT_CHARS);

    if (!content || status === "streaming") {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: "",
    };
    const outboundMessages = [...messages, userMessage]
      .filter((message) => message.id !== "welcome")
      .slice(-CLIENT_MAX_MESSAGES);

    setIsOpen(true);
    setInput("");
    setStatus("streaming");
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: outboundMessages.map(({ role, content: message }) => ({
            role,
            content: message,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content:
                    errorMessage ||
                    "The Stitchra Design Agent is not available right now.",
                }
              : message,
          ),
        );
        return;
      }

      if (!response.body) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content:
                    "The Stitchra Design Agent is not available right now.",
                }
              : message,
          ),
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: `${message.content}${chunk}`,
                }
              : message,
          ),
        );
      }

      const finalChunk = decoder.decode();
      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (message.id !== assistantMessage.id) {
            return message;
          }

          const content = `${message.content}${finalChunk}`;
          return {
            ...message,
            content:
              content.trim().length > 0
                ? content
                : TEMPORARILY_UNAVAILABLE_MESSAGE,
          };
        }),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: TEMPORARILY_UNAVAILABLE_MESSAGE,
              }
            : message,
        ),
      );
    } finally {
      abortControllerRef.current = null;
      setStatus("idle");
    }
  }

  const trimmedInput = input.trim();
  const isStreaming = status === "streaming";
  const latestUserMessage = getLatestUserMessage(messages);
  const suggestedArtworkPrompt = getSuggestedArtworkPrompt(latestUserMessage);
  const showArtworkActions = shouldShowArtworkActions(latestUserMessage);
  const agentClassName = [
    "stitchra-ai-agent",
    isOpen ? "stitchra-ai-agent-open" : "",
    isMobileDraggable ? "stitchra-ai-agent-mobile-drag" : "",
    launcherPosition ? "stitchra-ai-agent-positioned" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const agentStyle =
    launcherPosition && isMobileDraggable
      ? ({
          "--stitchra-agent-launcher-x": `${launcherPosition.x}px`,
          "--stitchra-agent-launcher-y": `${launcherPosition.y}px`,
        } as CSSProperties)
      : undefined;

  const moveLauncher = (position: LauncherPosition) => {
    pendingLauncherPositionRef.current = position;

    if (launcherAnimationFrameRef.current !== null) {
      return;
    }

    launcherAnimationFrameRef.current = window.requestAnimationFrame(() => {
      launcherAnimationFrameRef.current = null;
      const nextPosition = pendingLauncherPositionRef.current;
      if (!nextPosition) {
        return;
      }

      applyLauncherPosition(nextPosition);
    });
  };

  const handleLauncherPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    dismissHelperCloud();

    if (!isMobileDraggable || event.pointerType !== "touch") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const currentPosition = launcherPositionRef.current ?? {
      x: rect.left,
      y: rect.top,
    };

    launcherDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - currentPosition.x,
      offsetY: event.clientY - currentPosition.y,
      width: rect.width,
      height: rect.height,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dismissHelperCloud();

    const distanceX = event.clientX - drag.startX;
    const distanceY = event.clientY - drag.startY;
    const moved =
      drag.moved ||
      Math.hypot(distanceX, distanceY) >= MOBILE_DRAG_THRESHOLD;

    if (!moved) {
      return;
    }

    drag.moved = true;
    event.preventDefault();

    moveLauncher(
      clampLauncherPosition(
        {
          x: event.clientX - drag.offsetX,
          y: event.clientY - drag.offsetY,
        },
        {
          width: drag.width,
          height: drag.height,
        },
      ),
    );
  };

  const finishLauncherDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    launcherDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.moved) {
      return;
    }

    const finalPosition =
      pendingLauncherPositionRef.current ??
      launcherPositionRef.current ??
      getDefaultLauncherPosition({
        width: drag.width,
        height: drag.height,
      });

    const clampedPosition = clampLauncherPosition(finalPosition, {
      width: drag.width,
      height: drag.height,
    });

    applyLauncherPosition(clampedPosition);
    saveLauncherPosition(clampedPosition);
    suppressLauncherClickRef.current = true;
    window.setTimeout(() => {
      suppressLauncherClickRef.current = false;
    }, 0);
  };

  return (
    <div className={agentClassName} style={agentStyle} aria-live="polite">
      {isOpen ? (
        <section
          className="stitchra-ai-panel"
          aria-label="Stitchra AI Design Agent"
        >
          <header className="stitchra-ai-header">
            <div>
              <p className="stitchra-ai-kicker">Stitchra Studio</p>
              <h2>AI Design Agent</h2>
            </div>
            <button
              type="button"
              className="stitchra-ai-icon-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Stitchra AI Design Agent"
            >
              ×
            </button>
          </header>

          <div className="stitchra-ai-suggestions" aria-label="Suggested prompts">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isStreaming}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="stitchra-ai-messages" ref={messageListRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`stitchra-ai-message stitchra-ai-message-${message.role}`}
              >
                <span>
                  {message.role === "assistant" ? "Design agent" : "You"}
                </span>
                <p>
                  {message.content ||
                    (message.role === "assistant" && isStreaming
                      ? "Thinking…"
                      : "")}
                </p>
              </article>
            ))}
          </div>

          <div className="stitchra-ai-actions" aria-label="Design actions">
            <button type="button" onClick={scrollToDesigner}>
              Start Designing
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToDesigner();
                dispatchDesignAction({ action: "scrollToViewer" });
              }}
            >
              View Shirt
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToDesigner();
                dispatchDesignAction({ action: "openAICreator" });
              }}
            >
              Open AI Creator
            </button>
            {showArtworkActions ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    scrollToDesigner();
                    dispatchDesignAction({
                      action: "prefillIdeaPrompt",
                      prompt: suggestedArtworkPrompt,
                    });
                  }}
                >
                  Use this idea
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                scrollToDesigner();
                dispatchDesignAction({
                  action: "setPlacement",
                  placement: "center_chest",
                });
              }}
            >
              Set Center Chest
            </button>
            <button
              type="button"
              onClick={() => {
                scrollToDesigner();
                dispatchDesignAction({
                  action: "setPlacement",
                  placement: "left_chest",
                });
              }}
            >
              Set Left Chest
            </button>
            <button type="button" onClick={openLogoUpload}>
              Open Upload
            </button>
            <button type="button" onClick={scrollToDesigner}>
              Continue to Quote
            </button>
            {isMobileDraggable ? (
              <button type="button" onClick={resetLauncherPosition}>
                Reset bubble
              </button>
            ) : null}
          </div>

          <form
            className="stitchra-ai-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label htmlFor="stitchra-ai-input">Ask about your design</label>
            <div>
              <textarea
                id="stitchra-ai-input"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value.slice(0, CLIENT_MAX_INPUT_CHARS))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about placement, logo files, price or payment…"
                rows={2}
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!trimmedInput || isStreaming}
                aria-label="Send message"
              >
                {isStreaming ? "…" : "Send"}
              </button>
            </div>
          </form>

          <p className="stitchra-ai-footnote">
            Session-only guidance. Do not share card details or private order
            data here.
          </p>
        </section>
      ) : null}

      {showHelperCloud && !isOpen ? (
        <button
          type="button"
          className="stitchra-agent-helper-cloud"
          onClick={() => {
            dismissHelperCloud();
            setIsOpen(true);
          }}
        >
          Need help?
        </button>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        className="stitchra-ai-launcher"
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={finishLauncherDrag}
        onClick={(event) => {
          if (suppressLauncherClickRef.current) {
            event.preventDefault();
            return;
          }

          dismissHelperCloud();
          setIsOpen((current) => !current);
        }}
        aria-expanded={isOpen}
        aria-label="Open Stitchra AI Design Agent. Drag on mobile to move."
      >
        <StitchraAgentOrb
          active={isStreaming}
          className="stitchra-agent-orb-shell"
        />
        <strong>Design Agent</strong>
      </button>

      <style>{`
        .stitchra-ai-agent {
          position: fixed;
          right: clamp(16px, 2.5vw, 30px);
          bottom: clamp(16px, 2.5vw, 30px);
          z-index: 120;
          color: #f6fff9;
          font-family: inherit;
        }

        .stitchra-ai-panel {
          width: min(430px, calc(100vw - 32px));
          max-height: min(720px, calc(100dvh - 112px));
          margin-bottom: 14px;
          display: grid;
          grid-template-rows: auto auto minmax(160px, 1fr) auto auto auto;
          overflow: hidden;
          border: 1px solid rgba(99, 255, 214, 0.22);
          border-radius: 28px;
          background:
            radial-gradient(circle at 18% 0%, rgba(0, 255, 153, 0.18), transparent 34%),
            radial-gradient(circle at 100% 18%, rgba(0, 190, 255, 0.16), transparent 36%),
            rgba(3, 13, 14, 0.94);
          box-shadow:
            0 28px 90px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(22px);
        }

        .stitchra-ai-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 22px 14px;
        }

        .stitchra-ai-kicker {
          margin: 0 0 4px;
          color: #18ff9a;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .stitchra-ai-header h2 {
          margin: 0;
          color: #ffffff;
          font-size: 1.2rem;
          letter-spacing: 0;
        }

        .stitchra-ai-icon-button,
        .stitchra-ai-launcher,
        .stitchra-ai-suggestions button,
        .stitchra-ai-actions button,
        .stitchra-ai-form button {
          cursor: pointer;
          font: inherit;
        }

        .stitchra-ai-icon-button {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          font-size: 1.25rem;
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .stitchra-ai-icon-button:hover,
        .stitchra-ai-suggestions button:hover,
        .stitchra-ai-actions button:hover,
        .stitchra-ai-form button:hover,
        .stitchra-ai-launcher:hover {
          transform: translateY(-1px);
          border-color: rgba(0, 245, 210, 0.62);
        }

        .stitchra-ai-icon-button:active,
        .stitchra-ai-suggestions button:active,
        .stitchra-ai-actions button:active,
        .stitchra-ai-form button:active,
        .stitchra-ai-launcher:active {
          transform: scale(0.98);
        }

        .stitchra-ai-suggestions {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 22px 16px;
          scrollbar-width: none;
        }

        .stitchra-ai-suggestions::-webkit-scrollbar {
          display: none;
        }

        .stitchra-ai-suggestions button,
        .stitchra-ai-actions button {
          min-height: 36px;
          flex: 0 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: rgba(246, 255, 249, 0.9);
          background: rgba(255, 255, 255, 0.055);
          padding: 8px 12px;
          font-size: 0.78rem;
          font-weight: 700;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .stitchra-ai-suggestions button:disabled,
        .stitchra-ai-form button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
        }

        .stitchra-ai-messages {
          min-height: 180px;
          overflow-y: auto;
          padding: 4px 22px 18px;
        }

        .stitchra-ai-message {
          margin: 0 0 12px;
          border-radius: 18px;
          padding: 13px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.055);
        }

        .stitchra-ai-message-user {
          margin-left: 42px;
          border-color: rgba(0, 235, 210, 0.22);
          background: rgba(0, 210, 180, 0.12);
        }

        .stitchra-ai-message-assistant {
          margin-right: 20px;
        }

        .stitchra-ai-message span {
          display: block;
          margin-bottom: 6px;
          color: rgba(189, 255, 228, 0.72);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stitchra-ai-message p {
          margin: 0;
          color: rgba(250, 255, 252, 0.92);
          font-size: 0.92rem;
          line-height: 1.52;
          white-space: pre-wrap;
        }

        .stitchra-ai-actions {
          display: flex;
          gap: 8px;
          padding: 0 22px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .stitchra-ai-actions::-webkit-scrollbar {
          display: none;
        }

        .stitchra-ai-actions button {
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          border-color: transparent;
          box-shadow: 0 10px 28px rgba(0, 220, 190, 0.18);
        }

        .stitchra-ai-form {
          padding: 0 22px 12px;
        }

        .stitchra-ai-form label {
          display: block;
          margin-bottom: 8px;
          color: rgba(246, 255, 249, 0.74);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .stitchra-ai-form div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: stretch;
        }

        .stitchra-ai-form textarea {
          min-height: 56px;
          max-height: 128px;
          resize: vertical;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 17px;
          color: #ffffff;
          background: rgba(0, 0, 0, 0.3);
          padding: 12px 13px;
          font: inherit;
          font-size: 0.92rem;
          outline: none;
        }

        .stitchra-ai-form textarea:focus {
          border-color: rgba(0, 245, 210, 0.72);
          box-shadow: 0 0 0 3px rgba(0, 245, 210, 0.12);
        }

        .stitchra-ai-form button {
          min-width: 72px;
          border: 0;
          border-radius: 17px;
          color: #061010;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-weight: 900;
          transition: transform 160ms ease, filter 160ms ease;
        }

        .stitchra-ai-footnote {
          margin: 0;
          padding: 0 22px 20px;
          color: rgba(246, 255, 249, 0.5);
          font-size: 0.74rem;
          line-height: 1.35;
        }

        .stitchra-ai-launcher {
          min-height: 58px;
          display: inline-flex;
          align-items: center;
          gap: 11px;
          border: 1px solid rgba(127, 255, 221, 0.24);
          border-radius: 999px;
          color: #f6fff9;
          background:
            radial-gradient(circle at 22% 22%, rgba(0, 255, 190, 0.18), transparent 38%),
            linear-gradient(135deg, rgba(8, 22, 20, 0.94), rgba(3, 11, 13, 0.92));
          padding: 7px 17px 7px 7px;
          box-shadow:
            0 20px 60px rgba(0, 225, 190, 0.2),
            0 8px 22px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
          user-select: none;
          -webkit-user-select: none;
        }

        .stitchra-agent-orb-shell {
          width: 44px;
          height: 44px;
          display: block;
          flex: 0 0 auto;
          border-radius: 999px;
          filter: drop-shadow(0 0 14px rgba(0, 255, 190, 0.24));
          animation: stitchraAgentOrbIntro 1400ms ease-out 1;
        }

        .stitchra-agent-orb-shell svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .stitchra-agent-orb-shell[data-active="true"] {
          filter: drop-shadow(0 0 18px rgba(0, 200, 255, 0.36));
        }

        .stitchra-ai-launcher:hover,
        .stitchra-ai-launcher:focus-visible {
          box-shadow:
            0 24px 66px rgba(0, 225, 190, 0.28),
            0 10px 26px rgba(0, 0, 0, 0.36),
            inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }

        .stitchra-ai-launcher:focus-visible {
          outline: 3px solid rgba(0, 245, 210, 0.32);
          outline-offset: 3px;
        }

        .stitchra-ai-launcher strong {
          font-size: 0.92rem;
          letter-spacing: 0;
          text-shadow: 0 1px 18px rgba(0, 255, 190, 0.2);
        }

        .stitchra-agent-helper-cloud {
          display: none;
        }

        body[data-stitchra-mobile-sheet-open="true"] .stitchra-ai-agent {
          z-index: 90;
          pointer-events: none;
        }

        body[data-stitchra-mobile-sheet-open="true"] .stitchra-agent-helper-cloud {
          display: none !important;
        }

        @keyframes stitchraAgentOrbIntro {
          0% {
            transform: scale(0.94);
            filter: drop-shadow(0 0 4px rgba(0, 255, 190, 0.12));
          }
          55% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 22px rgba(0, 255, 190, 0.42));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 14px rgba(0, 255, 190, 0.24));
          }
        }

        @media (max-width: 760px) {
          .stitchra-ai-agent {
            right: 12px;
            bottom: max(82px, calc(14px + env(safe-area-inset-bottom)));
            left: 12px;
          }

          .stitchra-agent-helper-cloud {
            position: fixed;
            right: 78px;
            bottom: max(98px, calc(30px + env(safe-area-inset-bottom)));
            width: max-content;
            max-width: 128px;
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(140, 255, 220, 0.24);
            border-radius: 999px;
            color: #06100a;
            background: linear-gradient(135deg, rgba(185,255,218,0.98), rgba(113,231,255,0.92));
            padding: 0 13px;
            box-shadow:
              0 14px 34px rgba(0,0,0,0.24),
              0 0 28px rgba(0,255,190,0.16);
            font: inherit;
            font-size: 12px;
            font-weight: 950;
            pointer-events: auto;
            animation: stitchraAgentHelperIn 420ms ease-out both;
          }

          .stitchra-agent-helper-cloud::after {
            content: "";
            position: absolute;
            right: -4px;
            bottom: 8px;
            width: 12px;
            height: 12px;
            border-radius: 3px;
            background: inherit;
            transform: rotate(45deg);
          }

          .stitchra-ai-agent-mobile-drag {
            inset: 0;
            right: auto;
            bottom: auto;
            left: 0;
            width: 0;
            height: 0;
            overflow: visible;
            pointer-events: none;
          }

          .stitchra-ai-panel {
            width: 100%;
            max-height: calc(100dvh - 118px);
            border-radius: 24px;
          }

          .stitchra-ai-agent-mobile-drag .stitchra-ai-panel {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: max(14px, env(safe-area-inset-bottom));
            width: auto;
            max-height: calc(100dvh - 92px);
            margin-bottom: 0;
            pointer-events: auto;
          }

          .stitchra-ai-launcher {
            position: fixed;
            right: 12px;
            bottom: max(82px, calc(14px + env(safe-area-inset-bottom)));
            width: 56px;
            min-width: 56px;
            min-height: 56px;
            justify-content: center;
            gap: 0;
            padding: 6px;
            margin-left: auto;
            pointer-events: auto;
            touch-action: none;
            will-change: transform, left, top;
            -webkit-tap-highlight-color: transparent;
          }

          .stitchra-ai-agent-positioned .stitchra-ai-launcher {
            left: var(--stitchra-agent-launcher-x);
            top: var(--stitchra-agent-launcher-y);
            right: auto;
            bottom: auto;
          }

          .stitchra-ai-agent-positioned .stitchra-agent-helper-cloud {
            left: clamp(12px, calc(var(--stitchra-agent-launcher-x) - 100px), calc(100vw - 142px));
            top: calc(var(--stitchra-agent-launcher-y) + 8px);
            right: auto;
            bottom: auto;
          }

          .stitchra-ai-agent-open.stitchra-ai-agent-mobile-drag .stitchra-ai-launcher {
            display: none;
          }

          .stitchra-agent-orb-shell {
            width: 44px;
            height: 44px;
          }

          .stitchra-ai-launcher strong {
            display: none;
          }

          .stitchra-ai-actions,
          .stitchra-ai-suggestions {
            padding-left: 18px;
            padding-right: 18px;
          }

          .stitchra-ai-header,
          .stitchra-ai-messages,
          .stitchra-ai-form,
          .stitchra-ai-footnote {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @keyframes stitchraAgentHelperIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stitchra-ai-icon-button,
          .stitchra-ai-launcher,
          .stitchra-ai-suggestions button,
          .stitchra-ai-actions button,
          .stitchra-ai-form button {
            transition: none;
          }

          .stitchra-agent-orb-shell {
            animation: none;
          }

          .stitchra-agent-helper-cloud {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
