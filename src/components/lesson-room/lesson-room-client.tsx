"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Camera,
  ChevronDown,
  Copy,
  Eraser,
  FileUp,
  Grid2X2,
  Hand,
  LogOut,
  MessageSquare,
  Mic,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Shapes,
  Trash2,
  Type,
  Undo2,
  User,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Tool = "draw" | "erase" | "hand" | "text" | "zoom";
type UserRole = "student" | "teacher";
type Point = { x: number; y: number };
type Stroke = { id: string; color: string; width: number; points: Point[] };
type TextItem = { id: string; x: number; y: number; value: string };
type BoardFile = { id: string; type: "image"; url: string; name: string; x: number; y: number; width: number };
type BoardView = { zoom: number; scrollLeft: number; scrollTop: number };
type WhiteboardState = { strokes: Stroke[]; texts: TextItem[]; files: BoardFile[]; view: BoardView };
type WhiteboardSyncMessage =
  | { senderId: string; senderRole: UserRole; kind: "request_state" }
  | { senderId: string; senderRole: UserRole; kind: "state"; state: WhiteboardState }
  | { senderId: string; senderRole: UserRole; kind: "view"; view: BoardView };
type OutgoingWhiteboardSyncMessage =
  | { kind: "request_state" }
  | { kind: "state"; state: WhiteboardState }
  | { kind: "view"; view: BoardView };
type RealtimeChannelLike = {
  on: (...args: any[]) => RealtimeChannelLike;
  send: (payload: { type: "broadcast"; event: string; payload: WhiteboardSyncMessage }) => Promise<unknown>;
  subscribe: (callback?: (status: string) => void) => RealtimeChannelLike;
  unsubscribe: () => Promise<unknown>;
};
type PdfViewport = { width: number; height: number } & Record<string, unknown>;
type PdfPage = {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> };
};
type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
};
type FileInteraction = {
  id: string;
  mode: "move" | "resize";
  startPoint: Point;
  startX: number;
  startY: number;
  startWidth: number;
};
type BoardPan = {
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

const colors = ["#111827", "#ef4444", "#2563eb", "#16a34a", "#f59e0b"];
const BOARD_WIDTH = 10800;
const BOARD_HEIGHT = 9600;
const MIN_BOARD_ZOOM = 0.25;
const MAX_BOARD_ZOOM = 3;
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
const WHITEBOARD_SYNC_EVENT = "whiteboard-state";

function distanceToStroke(point: Point, stroke: Stroke) {
  return Math.min(...stroke.points.map((strokePoint) => Math.hypot(point.x - strokePoint.x, point.y - strokePoint.y)));
}

async function loadPdfJs() {
  const pdfjs = (await import(/* webpackIgnore: true */ PDFJS_URL)) as PdfJs;
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  return pdfjs;
}

async function canvasToImageUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isRealtimeConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function renderPdfAsImages(file: File, centerX: number, startY: number) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: BoardFile[] = [];
  let pageTop = Math.max(0, startY);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    if (!context) {
      continue;
    }

    await page.render({ canvasContext: context, viewport }).promise;

    const width = Math.min(900, canvas.width);
    const height = canvas.height * (width / canvas.width);

    pages.push({
      id: crypto.randomUUID(),
      type: "image",
      url: await canvasToImageUrl(canvas),
      name: `${file.name} · стр. ${pageNumber}`,
      x: Math.max(0, centerX - width / 2),
      y: pageTop,
      width
    });

    pageTop += height + 48;
  }

  return { pages, bottomY: pageTop };
}

export function LessonRoomClient({
  lessonId,
  title,
  startsAt,
  roomUrl,
  userRole
}: {
  lessonId: string;
  title: string;
  startsAt?: string;
  roomUrl?: string;
  userRole: UserRole;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchPointersRef = useRef(new Map<number, { clientX: number; clientY: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<{ zoom: number; anchor?: { clientX: number; clientY: number } } | null>(null);
  const channelRef = useRef<RealtimeChannelLike | null>(null);
  const clientIdRef = useRef("");
  const isApplyingRemoteRef = useRef(false);
  const syncReadyRef = useRef(false);
  const stateSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewSyncFrameRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState(colors[0]);
  const [width, setWidth] = useState(8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [draftText, setDraftText] = useState<{ x: number; y: number; value: string } | null>(null);
  const [files, setFiles] = useState<BoardFile[]>([]);
  const [fileInteraction, setFileInteraction] = useState<FileInteraction | null>(null);
  const [boardPan, setBoardPan] = useState<BoardPan | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const isTeacher = userRole === "teacher";
  const boardZoomRef = useRef(boardZoom);
  const strokesRef = useRef(strokes);
  const textsRef = useRef(texts);
  const filesRef = useRef(files);

  useEffect(() => {
    boardZoomRef.current = boardZoom;
  }, [boardZoom]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    textsRef.current = texts;
  }, [texts]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    setInviteUrl(window.location.href);
  }, []);

  useEffect(() => {
    return () => {
      if (zoomFrameRef.current !== null) {
        cancelAnimationFrame(zoomFrameRef.current);
      }

      if (viewSyncFrameRef.current !== null) {
        cancelAnimationFrame(viewSyncFrameRef.current);
      }

      if (stateSyncTimeoutRef.current !== null) {
        clearTimeout(stateSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorX;

    document.documentElement.style.overscrollBehaviorX = "none";
    document.body.style.overscrollBehaviorX = "none";

    return () => {
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorX = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    const board = boardRef.current;

    if (!board) {
      return;
    }

    requestAnimationFrame(() => {
      board.scrollLeft = (BOARD_WIDTH * boardZoom - board.clientWidth) / 2;
      board.scrollTop = (BOARD_HEIGHT * boardZoom - board.clientHeight) / 2;
    });
  }, []);

  useEffect(() => {
    if (!isRealtimeConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`lesson-room:${lessonId}`, {
      config: { broadcast: { self: false } }
    }) as RealtimeChannelLike;

    channel
      .on("broadcast", { event: WHITEBOARD_SYNC_EVENT }, ({ payload }: { payload: WhiteboardSyncMessage }) => {
        if (!payload || payload.senderId === getClientId()) {
          return;
        }

        if (payload.kind === "request_state") {
          broadcastWhiteboardState();
          return;
        }

        if (payload.kind === "state") {
          applyRemoteState(payload.state);
          return;
        }

        if (payload.kind === "view" && payload.senderRole === "teacher") {
          applyBoardView(payload.view);
        }
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        syncReadyRef.current = true;
        sendSyncMessage({ kind: "request_state" });
      });

    channelRef.current = channel;

    return () => {
      syncReadyRef.current = false;
      channelRef.current = null;
      void channel.unsubscribe();
    };
  }, [lessonId]);

  useEffect(() => {
    scheduleWhiteboardStateSync();
  }, [strokes, texts, files]);

  const displayDate = startsAt
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(startsAt))
    : "без даты";

  function getClientId() {
    if (!clientIdRef.current) {
      clientIdRef.current = crypto.randomUUID();
    }

    return clientIdRef.current;
  }

  function getBoardView(): BoardView {
    const board = boardRef.current;

    return {
      zoom: boardZoomRef.current,
      scrollLeft: board?.scrollLeft ?? 0,
      scrollTop: board?.scrollTop ?? 0
    };
  }

  function getWhiteboardState(): WhiteboardState {
    return {
      strokes: strokesRef.current,
      texts: textsRef.current,
      files: filesRef.current,
      view: getBoardView()
    };
  }

  function sendSyncMessage(message: OutgoingWhiteboardSyncMessage) {
    const channel = channelRef.current;

    if (!channel || !syncReadyRef.current) {
      return;
    }

    void channel.send({
      type: "broadcast",
      event: WHITEBOARD_SYNC_EVENT,
      payload: {
        senderId: getClientId(),
        senderRole: userRole,
        ...message
      } as WhiteboardSyncMessage
    });
  }

  function applyBoardView(view: BoardView) {
    const board = boardRef.current;
    const clampedZoom = Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, view.zoom));

    boardZoomRef.current = clampedZoom;
    setBoardZoom(clampedZoom);

    if (!board) {
      return;
    }

    requestAnimationFrame(() => {
      board.scrollLeft = view.scrollLeft;
      board.scrollTop = view.scrollTop;
    });
  }

  function applyRemoteState(state: WhiteboardState) {
    isApplyingRemoteRef.current = true;
    setStrokes(state.strokes);
    setTexts(state.texts);
    setFiles(state.files);
    applyBoardView(state.view);

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 0);
  }

  function broadcastWhiteboardState() {
    sendSyncMessage({ kind: "state", state: getWhiteboardState() });
  }

  function scheduleWhiteboardStateSync() {
    if (isApplyingRemoteRef.current || !syncReadyRef.current) {
      return;
    }

    if (stateSyncTimeoutRef.current !== null) {
      clearTimeout(stateSyncTimeoutRef.current);
    }

    stateSyncTimeoutRef.current = setTimeout(() => {
      stateSyncTimeoutRef.current = null;
      broadcastWhiteboardState();
    }, 120);
  }

  function scheduleBoardViewSync() {
    if (!isTeacher || isApplyingRemoteRef.current || !syncReadyRef.current || viewSyncFrameRef.current !== null) {
      return;
    }

    viewSyncFrameRef.current = requestAnimationFrame(() => {
      viewSyncFrameRef.current = null;
      sendSyncMessage({ kind: "view", view: getBoardView() });
    });
  }

  function getBoardPoint(event: PointerEvent): Point {
    const rect = boardRef.current?.getBoundingClientRect();
    return {
      x: (event.clientX - (rect?.left ?? 0) + (boardRef.current?.scrollLeft ?? 0)) / boardZoom,
      y: (event.clientY - (rect?.top ?? 0) + (boardRef.current?.scrollTop ?? 0)) / boardZoom
    };
  }

  function zoomBoardTo(nextZoom: number, anchor?: { clientX: number; clientY: number }) {
    if (!isTeacher) {
      return;
    }

    const board = boardRef.current;
    const clampedZoom = Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, nextZoom));

    if (!board || Math.abs(clampedZoom - boardZoomRef.current) < 0.001) {
      setBoardZoom(clampedZoom);
      return;
    }

    const rect = board.getBoundingClientRect();
    const anchorX = anchor ? anchor.clientX - rect.left : board.clientWidth / 2;
    const anchorY = anchor ? anchor.clientY - rect.top : board.clientHeight / 2;
    const currentZoom = boardZoomRef.current;
    const boardX = (board.scrollLeft + anchorX) / currentZoom;
    const boardY = (board.scrollTop + anchorY) / currentZoom;

    boardZoomRef.current = clampedZoom;
    setBoardZoom(clampedZoom);

    requestAnimationFrame(() => {
      board.scrollLeft = boardX * clampedZoom - anchorX;
      board.scrollTop = boardY * clampedZoom - anchorY;
      scheduleBoardViewSync();
    });
  }

  function changeBoardZoom(delta: number) {
    zoomBoardTo(boardZoomRef.current + delta);
  }

  function scheduleBoardZoom(nextZoom: number, anchor?: { clientX: number; clientY: number }) {
    pendingZoomRef.current = { zoom: nextZoom, anchor };

    if (zoomFrameRef.current !== null) {
      return;
    }

    zoomFrameRef.current = requestAnimationFrame(() => {
      zoomFrameRef.current = null;
      const pendingZoom = pendingZoomRef.current;
      pendingZoomRef.current = null;

      if (pendingZoom) {
        zoomBoardTo(pendingZoom.zoom, pendingZoom.anchor);
      }
    });
  }

  function getTouchDistance() {
    const points = Array.from(touchPointersRef.current.values());

    if (points.length < 2) {
      return 0;
    }

    return Math.hypot(points[0].clientX - points[1].clientX, points[0].clientY - points[1].clientY);
  }

  function getTouchCenter() {
    const points = Array.from(touchPointersRef.current.values());

    return {
      clientX: (points[0].clientX + points[1].clientX) / 2,
      clientY: (points[0].clientY + points[1].clientY) / 2
    };
  }

  function updateFileInteraction(event: PointerEvent) {
    if (!fileInteraction) {
      return;
    }

    const point = getBoardPoint(event);
    const deltaX = point.x - fileInteraction.startPoint.x;
    const deltaY = point.y - fileInteraction.startPoint.y;

    setFiles((items) =>
      items.map((file) => {
        if (file.id !== fileInteraction.id) {
          return file;
        }

        if (fileInteraction.mode === "move") {
          return {
            ...file,
            x: Math.max(0, fileInteraction.startX + deltaX),
            y: Math.max(0, fileInteraction.startY + deltaY)
          };
        }

        return {
          ...file,
          width: Math.max(220, fileInteraction.startWidth + Math.max(deltaX, deltaY * 0.75))
        };
      })
    );
  }

  async function copyInvite() {
    if (!inviteUrl) {
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  function startPointer(event: PointerEvent) {
    if (isTeacher && tool === "zoom" && event.pointerType === "touch") {
      touchPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

      if (touchPointersRef.current.size >= 2) {
        pinchRef.current = { distance: getTouchDistance(), zoom: boardZoom };
        setCurrentStroke(null);
        return;
      }
    }

    if (isTeacher && tool === "hand") {
      setBoardPan({
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: boardRef.current?.scrollLeft ?? 0,
        startScrollTop: boardRef.current?.scrollTop ?? 0
      });
      return;
    }

    const point = getBoardPoint(event);

    if (tool === "draw") {
      const nextStroke = { id: crypto.randomUUID(), color, width, points: [point] };
      setCurrentStroke(nextStroke);
      setStrokes((items) => [...items, nextStroke]);
    }

    if (tool === "erase") {
      setStrokes((items) => items.filter((stroke) => distanceToStroke(point, stroke) > Math.max(18, width * 2)));
    }

    if (tool === "text") {
      setDraftText({ x: point.x, y: point.y, value: "" });
    }
  }

  function movePointer(event: PointerEvent) {
    if (isTeacher && tool === "zoom" && event.pointerType === "touch" && touchPointersRef.current.has(event.pointerId)) {
      touchPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

      if (pinchRef.current && touchPointersRef.current.size >= 2) {
        const nextDistance = getTouchDistance();

        if (pinchRef.current.distance > 0) {
          scheduleBoardZoom(pinchRef.current.zoom * (nextDistance / pinchRef.current.distance), getTouchCenter());
        }

        return;
      }
    }

    if (fileInteraction) {
      updateFileInteraction(event);
      return;
    }

    if (boardPan) {
      const board = boardRef.current;

      if (board) {
        board.scrollLeft = boardPan.startScrollLeft - (event.clientX - boardPan.startClientX);
        board.scrollTop = boardPan.startScrollTop - (event.clientY - boardPan.startClientY);
        scheduleBoardViewSync();
      }

      return;
    }

    if (!currentStroke || tool !== "draw") {
      return;
    }

    const point = getBoardPoint(event);
    setCurrentStroke((stroke) => (stroke ? { ...stroke, points: [...stroke.points, point] } : stroke));
    setStrokes((items) =>
      items.map((stroke) => (stroke.id === currentStroke.id ? { ...stroke, points: [...stroke.points, point] } : stroke))
    );
  }

  function endPointer(event?: PointerEvent) {
    if (event?.pointerType === "touch") {
      touchPointersRef.current.delete(event.pointerId);

      if (touchPointersRef.current.size < 2) {
        pinchRef.current = null;
      }
    }

    setCurrentStroke(null);
    setFileInteraction(null);
    setBoardPan(null);
  }

  function startFileInteraction(event: PointerEvent<HTMLDivElement>, file: BoardFile, mode: FileInteraction["mode"]) {
    if (!isTeacher || tool !== "hand") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = getBoardPoint(event);
    setFileInteraction({
      id: file.id,
      mode,
      startPoint: point,
      startX: file.x,
      startY: file.y,
      startWidth: file.width
    });
  }

  function commitText() {
    const value = draftText?.value.trim();
    if (!draftText || !value) {
      setDraftText(null);
      return;
    }

    setTexts((items) => [...items, { id: crypto.randomUUID(), x: draftText.x, y: draftText.y, value }]);
    setDraftText(null);
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const board = boardRef.current;
    const viewportCenterX = board ? (board.scrollLeft + board.clientWidth / 2) / boardZoomRef.current : BOARD_WIDTH / 2;
    const viewportCenterY = board ? (board.scrollTop + board.clientHeight / 2) / boardZoomRef.current : BOARD_HEIGHT / 2;
    const nextFiles: BoardFile[] = [];
    let nextY = Math.max(0, viewportCenterY - 360);

    for (const file of selectedFiles) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImage = file.type.startsWith("image/");

      if (isPdf) {
        try {
          const pdfResult = await renderPdfAsImages(file, viewportCenterX, nextY);
          nextFiles.push(...pdfResult.pages);
          nextY = pdfResult.bottomY + 24;
        } catch (error) {
          console.error("Не удалось добавить PDF на доску", error);
        }

        continue;
      }

      if (isImage) {
        const fileWidth = 560;

        nextFiles.push({
          id: crypto.randomUUID(),
          type: "image",
          url: await fileToDataUrl(file),
          name: file.name,
          x: Math.max(0, viewportCenterX - fileWidth / 2),
          y: nextY,
          width: fileWidth
        });

        nextY += 760;
      }
    }

    setFiles((items) => [...items, ...nextFiles]);
    event.target.value = "";
  }

  const toolButtonClass = "flex h-12 w-12 items-center justify-center rounded-2xl text-[#0b1024] transition hover:bg-[#f1efff]";
  const activeToolClass = "bg-[#6d5dfc] text-white shadow-[0_12px_28px_rgba(109,93,252,0.30)] hover:bg-[#6d5dfc]";

  useEffect(() => {
    const board = boardRef.current;

    if (!board || !isTeacher || tool !== "zoom") {
      return;
    }

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const delta = Math.max(-0.08, Math.min(0.08, -event.deltaY * (event.ctrlKey ? 0.0024 : 0.0008)));
      scheduleBoardZoom(boardZoomRef.current + delta, { clientX: event.clientX, clientY: event.clientY });
    };

    const preventPageGesture = (event: Event) => {
      event.preventDefault();
    };

    board.addEventListener("wheel", handleWheel, { passive: false });
    board.addEventListener("gesturestart", preventPageGesture, { passive: false });
    board.addEventListener("gesturechange", preventPageGesture, { passive: false });

    return () => {
      board.removeEventListener("wheel", handleWheel);
      board.removeEventListener("gesturestart", preventPageGesture);
      board.removeEventListener("gesturechange", preventPageGesture);
    };
  }, [boardZoom, isTeacher, tool]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    const handleTrackpadPinch = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const delta = Math.max(-0.08, Math.min(0.08, -event.deltaY * 0.0024));
      scheduleBoardZoom(boardZoomRef.current + delta, { clientX: event.clientX, clientY: event.clientY });
    };

    window.addEventListener("wheel", handleTrackpadPinch, { capture: true, passive: false });
    document.addEventListener("wheel", handleTrackpadPinch, { capture: true, passive: false });

    return () => {
      window.removeEventListener("wheel", handleTrackpadPinch, { capture: true });
      document.removeEventListener("wheel", handleTrackpadPinch, { capture: true });
    };
  }, [boardZoom, isTeacher]);

  return (
    <main className="h-screen overflow-hidden bg-white text-[#090d21]">
      <Button asChild variant="outline" className="fixed left-6 top-6 z-[70] h-11 rounded-full border-[#deddf1] bg-white/95 px-5 font-bold shadow-sm backdrop-blur">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
      </Button>
      <div className="h-full w-full">
        <header className="hidden min-h-20 items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/90 px-8 shadow-[0_12px_38px_rgba(18,24,48,0.06)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3 text-2xl font-black">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#6d5dfc] text-white shadow-[0_10px_24px_rgba(109,93,252,0.36)]">
              ✦
            </span>
            LearnSpace
          </Link>

          <nav className="hidden items-center gap-7 text-base font-bold text-[#515a76] lg:flex">
            <Link href="/student" className="flex items-center gap-2 rounded-2xl bg-[#f0edff] px-5 py-3 text-[#6d5dfc]">
              <Grid2X2 className="h-5 w-5" />
              Уроки
            </Link>
            <Link href="/teachers" className="flex items-center gap-2 hover:text-[#090d21]">
              <Users className="h-5 w-5" />
              Преподаватели
            </Link>
            <Link href="/courses" className="flex items-center gap-2 hover:text-[#090d21]">
              <BookOpen className="h-5 w-5" />
              Методичка
            </Link>
            <Link href="/profile" className="flex items-center gap-2 hover:text-[#090d21]">
              <User className="h-5 w-5" />
              Профиль
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#e2e4f2] bg-white text-[#10142c]">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-[#f2efff] p-1 pr-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#6d5dfc] text-lg font-black text-white">N</span>
              <ChevronDown className="h-4 w-4 text-[#6d5dfc]" />
            </button>
          </div>
        </header>

        <section className="h-full border-0 bg-white p-0 shadow-none">
          <div className="hidden flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-black text-emerald-600 shadow-sm">
                Идёт сейчас
              </span>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-normal text-[#080b1c] md:text-4xl">{title}</h1>
              <p className="mt-3 text-lg font-semibold text-[#68718f]">
                {displayDate} · 60 мин · <span className="text-[#6d5dfc]">Урок с Владимиром</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-12 rounded-2xl border-[#e0e2f1] bg-white px-5 font-bold" onClick={copyInvite}>
                <Copy className="h-4 w-4" />
                {copied ? "Ссылка скопирована" : "Пригласить"}
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl border-[#e0e2f1] bg-white px-5 font-bold">
                <Link href={`/lesson/${lessonId}`}>
                  <Camera className="h-4 w-4" />
                  Карточка урока
                </Link>
              </Button>
            </div>
          </div>

          <section
            ref={boardRef}
            className={`relative h-screen rounded-none border-0 bg-white shadow-none ${isTeacher ? "overflow-auto" : "overflow-hidden"}`}
            onPointerDown={startPointer}
            onPointerMove={movePointer}
            onPointerUp={endPointer}
            onPointerLeave={endPointer}
            style={{ overscrollBehavior: "none", touchAction: "none" }}
            >
              <div
                className="relative"
                style={{
                  width: BOARD_WIDTH * boardZoom,
                  height: BOARD_HEIGHT * boardZoom
                }}
              >
              <div className="sticky left-0 top-0 z-40 h-0 w-0 pointer-events-none">
                <div
                  className="absolute left-28 top-7 w-[390px] rounded-[1.35rem] border border-[#e5e7f4] bg-white p-3 shadow-[0_18px_45px_rgba(18,24,48,0.14)] pointer-events-auto"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm font-black text-[#151a32]">
                      <span className="flex h-4 items-end gap-0.5 text-emerald-500">
                        <span className="h-1.5 w-1 rounded-full bg-current" />
                        <span className="h-2.5 w-1 rounded-full bg-current" />
                        <span className="h-4 w-1 rounded-full bg-current" />
                      </span>
                      Владимир
                    </div>
                    <MoreHorizontal className="h-5 w-5 text-[#616a86]" />
                  </div>
                  <div className="relative h-[210px] overflow-hidden rounded-xl bg-[#2e2e2f] text-white">
                    {roomUrl ? (
                      <iframe
                        title="Daily video room"
                        src={roomUrl}
                        allow="camera; microphone; fullscreen; speaker; display-capture"
                        className="h-full w-full border-0"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-center p-8">
                        <p className="text-center text-base text-slate-200">Камера выключена</p>
                        <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-3 py-1 text-sm font-bold">Вы</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    <button className="rounded-xl border border-[#eef0f7] bg-white py-3 text-xs font-bold text-[#182036]">
                      <Mic className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                      Микрофон
                    </button>
                    <button className="rounded-xl border border-[#eef0f7] bg-white py-3 text-xs font-bold text-[#182036]">
                      <Camera className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                      Камера
                    </button>
                    <button className="rounded-xl border border-[#eef0f7] bg-white py-3 text-xs font-bold text-[#182036]">
                      <MessageSquare className="mx-auto mb-1 h-5 w-5 text-[#303854]" />
                      Чат
                    </button>
                    <button className="rounded-xl border border-[#eef0f7] bg-white py-3 text-xs font-bold text-[#182036]">
                      <Users className="mx-auto mb-1 h-5 w-5 text-[#303854]" />
                      Люди
                    </button>
                    <button className="rounded-xl border border-[#fff0f0] bg-white py-3 text-xs font-bold text-[#ef4444]">
                      <LogOut className="mx-auto mb-1 h-5 w-5" />
                      Выйти
                    </button>
                  </div>
                </div>
              </div>

              <aside
                className="sticky left-7 top-7 z-50 flex w-16 flex-col items-center gap-2 rounded-[1.35rem] border border-[#e5e7f4] bg-white/96 p-2 shadow-[0_16px_36px_rgba(18,24,48,0.10)] backdrop-blur"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button className={`${toolButtonClass} ${tool === "draw" ? activeToolClass : ""}`} onClick={() => setTool("draw")} aria-label="Рисовать">
                  <Pencil className="h-5 w-5" />
                </button>
                <button className={`${toolButtonClass} ${tool === "erase" ? activeToolClass : ""}`} onClick={() => setTool("erase")} aria-label="Ластик">
                  <Eraser className="h-5 w-5" />
                </button>
                {isTeacher ? (
                  <button className={`${toolButtonClass} ${tool === "hand" ? activeToolClass : ""}`} onClick={() => setTool("hand")} aria-label="Двигать доску">
                    <MousePointer2 className="h-5 w-5" />
                  </button>
                ) : null}
                <button className={`${toolButtonClass} ${tool === "text" ? activeToolClass : ""}`} onClick={() => setTool("text")} aria-label="Текст">
                  <Type className="h-5 w-5" />
                </button>
                {isTeacher ? (
                  <>
                    <button className={toolButtonClass} aria-label="Чат">
                      <MessageSquare className="h-5 w-5" />
                    </button>
                    <button className={`${toolButtonClass} ${tool === "zoom" ? activeToolClass : ""}`} onClick={() => setTool("zoom")} aria-label="Масштаб">
                      <Plus className="h-5 w-5 rotate-45" />
                    </button>
                    <button className={toolButtonClass} aria-label="Фигуры">
                      <Shapes className="h-5 w-5" />
                    </button>
                    <button className={toolButtonClass} onClick={() => fileInputRef.current?.click()} aria-label="Добавить файл">
                      <Plus className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </aside>

              <div
                className="absolute left-0 top-0 z-0 origin-top-left"
                style={{
                  width: BOARD_WIDTH,
                  height: BOARD_HEIGHT,
                  transform: `scale(${boardZoom})`,
                  backgroundImage: "radial-gradient(circle, #dfe4f3 1.2px, transparent 1.3px)",
                  backgroundSize: "72px 72px"
                }}
              >
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`group absolute z-10 select-none overflow-hidden rounded-2xl border border-[#dfe1ee] bg-white shadow-[0_12px_34px_rgba(17,24,39,0.10)] transition-shadow hover:shadow-[0_18px_44px_rgba(17,24,39,0.16)] ${isTeacher && tool === "hand" ? "touch-none" : "pointer-events-none"}`}
                  style={{ left: file.x, top: file.y, width: file.width }}
                  onPointerDown={(event) => startFileInteraction(event, file, "move")}
                  onPointerMove={(event) => {
                    event.stopPropagation();
                    updateFileInteraction(event);
                  }}
                  onPointerUp={endPointer}
                  onPointerLeave={(event) => {
                    if (fileInteraction?.id === file.id) {
                      updateFileInteraction(event);
                    }
                  }}
                >
                  <div className={`${isTeacher && tool === "hand" ? "cursor-move" : ""} flex items-center justify-between border-b border-[#ececf4] px-4 py-2 text-sm font-bold text-[#131525]`}>
                    <span className="truncate pr-3">{file.name}</span>
                    {isTeacher && tool === "hand" ? <span className="rounded-full bg-[#f1efff] px-2 py-1 text-[11px] font-black text-[#6d5dfc] opacity-0 transition group-hover:opacity-100">
                      Перетащить
                    </span> : null}
                  </div>
                  <img src={file.url} alt={file.name} className="block w-full object-contain" draggable={false} />
                  {isTeacher && tool === "hand" ? (
                    <div
                      className="absolute bottom-2 right-2 h-7 w-7 cursor-nwse-resize rounded-lg border border-[#d9dbeb] bg-white/95 shadow-[0_6px_18px_rgba(17,24,39,0.15)] after:absolute after:bottom-2 after:right-2 after:h-3 after:w-3 after:border-b-2 after:border-r-2 after:border-[#6d5dfc]"
                      onPointerDown={(event) => startFileInteraction(event, file, "resize")}
                      onPointerMove={(event) => {
                        event.stopPropagation();
                        updateFileInteraction(event);
                      }}
                      onPointerUp={endPointer}
                    />
                  ) : null}
                </div>
              ))}

              <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible">
                {strokes.map((stroke) => (
                  <polyline
                    key={stroke.id}
                    points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke={stroke.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={stroke.width}
                  />
                ))}
              </svg>

              {texts.map((item) => (
                <div
                  key={item.id}
                  className="absolute z-40 whitespace-pre-wrap rounded-lg bg-white/70 px-2 py-1 text-2xl font-semibold text-[#111827]"
                  style={{ left: item.x, top: item.y }}
                >
                  {item.value}
                </div>
              ))}

              {draftText ? (
                <textarea
                  autoFocus
                  className="absolute z-50 min-h-14 w-72 rounded-xl border border-[#675cff] bg-white p-3 text-2xl font-semibold outline-none shadow-[0_12px_28px_rgba(103,92,255,0.18)]"
                  style={{ left: draftText.x, top: draftText.y }}
                  value={draftText.value}
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) => setDraftText({ ...draftText, value: event.target.value })}
                  onBlur={commitText}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      commitText();
                    }
                  }}
                />
              ) : null}
              </div>
            </div>

            <div
              className="sticky bottom-6 left-1/2 z-50 flex w-fit -translate-x-1/2 items-center gap-5 rounded-[1.35rem] border border-[#e3e6f3] bg-white/96 px-4 py-3 shadow-[0_18px_45px_rgba(18,24,48,0.12)] backdrop-blur"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button className="grid h-10 w-10 place-items-center rounded-full border border-[#e5e7f4] text-[#9aa1b7]">
                <Undo2 className="h-4 w-4" />
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-full border border-[#e5e7f4] text-[#c0c5d4]">
                <Redo2 className="h-4 w-4" />
              </button>
              <div className="h-8 w-px bg-[#eceef6]" />
              <span className="text-sm font-black text-[#3e455f]">Цвет</span>
              <div className="flex items-center gap-2">
                {colors.map((item) => (
                  <button
                    key={item}
                    aria-label={`Цвет ${item}`}
                    className={`h-8 w-8 rounded-full border ${color === item ? "ring-4 ring-[#dcd8ff]" : "border-black/5"}`}
                    style={{ backgroundColor: item }}
                    onClick={() => setColor(item)}
                  />
                ))}
              </div>
              <div className="h-8 w-px bg-[#eceef6]" />
              <span className="text-sm font-black text-[#3e455f]">Толщина</span>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-[#e5e7f4]">
                <Minus className="h-4 w-4" />
              </button>
              <input type="range" min="2" max="24" value={width} className="w-28 accent-[#6d5dfc]" onChange={(event) => setWidth(Number(event.target.value))} />
              <button className="grid h-9 w-9 place-items-center rounded-full border border-[#e5e7f4]">
                <Plus className="h-4 w-4" />
              </button>
              {isTeacher ? (
                <>
                  <div className="h-8 w-px bg-[#eceef6]" />
                  <Button variant="outline" className="h-11 rounded-2xl border-[#e5e7f4] bg-white px-4 font-bold" onClick={() => setStrokes([])}>
                    <Trash2 className="h-4 w-4" />
                    Очистить
                  </Button>
                  <Button variant="outline" className="h-11 rounded-2xl border-[#e5e7f4] bg-white px-4 font-bold" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4" />
                    Файл
                  </Button>
                </>
              ) : null}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={addFiles} />
            </div>

            {isTeacher ? (
              <div
                className="sticky bottom-6 left-[calc(100%-180px)] z-50 ml-auto mr-8 flex w-fit items-center gap-5 rounded-[1.35rem] border border-[#e3e6f3] bg-white/96 px-4 py-3 text-base font-black shadow-[0_18px_45px_rgba(18,24,48,0.12)] backdrop-blur"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#e5e7f4] transition hover:bg-[#f6f5ff] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={boardZoom <= MIN_BOARD_ZOOM}
                  onClick={() => changeBoardZoom(-0.1)}
                  aria-label="Отдалить доску"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-14 text-center">{Math.round(boardZoom * 100)}%</span>
                <button
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#e5e7f4] transition hover:bg-[#f6f5ff] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={boardZoom >= MAX_BOARD_ZOOM}
                  onClick={() => changeBoardZoom(0.1)}
                  aria-label="Приблизить доску"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
