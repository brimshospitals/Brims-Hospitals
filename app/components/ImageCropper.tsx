"use client";
import { useRef, useState, useEffect } from "react";

interface Props {
  onCropped: (blob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropper({ onCropped, onClose }: Props) {
  const [imgSrc, setImgSrc]     = useState("");
  const [source, setSource]     = useState<"gallery" | "camera" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [scale, setScale]       = useState(1);
  const [imgSize, setImgSize]   = useState({ w: 0, h: 0 });
  const [cropSize, setCropSize] = useState(280);
  const [minScale, setMinScale] = useState(1);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const dragRef    = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const pinchRef   = useRef<{ dist: number; s: number; px: number; py: number } | null>(null);
  const lastTap    = useRef(0);
  const scaleRef   = useRef(scale);
  const posRef     = useRef(pos);
  scaleRef.current = scale;
  posRef.current   = pos;

  useEffect(() => {
    const s = Math.min(window.innerWidth - 48, 300);
    setCropSize(s);
  }, []);

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";           // allow re-selecting same file
    setImgSrc(URL.createObjectURL(file));
    setPos({ x: 0, y: 0 });
    setScale(1);
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    imgRef.current = img;
    const { naturalWidth: w, naturalHeight: h } = img;
    setImgSize({ w, h });
    // Fill crop area: smallest dimension fills exactly, then center
    const min = cropSize / Math.min(w, h);
    setMinScale(min);
    setScale(min);
    setPos({ x: (cropSize - w * min) / 2, y: (cropSize - h * min) / 2 });
  }

  // Keep image covering the crop circle at all times
  function clamp(p: { x: number; y: number }, s: number, iw = imgSize.w, ih = imgSize.h) {
    const sw = iw * s;
    const sh = ih * s;
    return {
      x: sw >= cropSize ? Math.min(0, Math.max(cropSize - sw, p.x)) : (cropSize - sw) / 2,
      y: sh >= cropSize ? Math.min(0, Math.max(cropSize - sh, p.y)) : (cropSize - sh) / 2,
    };
  }

  // Zoom toward a pivot point (default = center of crop area)
  function zoomToward(newScale: number, pivotX = cropSize / 2, pivotY = cropSize / 2) {
    const clamped = Math.max(minScale, Math.min(5, newScale));
    const ratio   = clamped / scaleRef.current;
    const p       = posRef.current;
    const newPos  = clamp({
      x: pivotX - (pivotX - p.x) * ratio,
      y: pivotY - (pivotY - p.y) * ratio,
    }, clamped);
    setScale(clamped);
    setPos(newPos);
  }

  function recenter() {
    if (!imgSize.w) return;
    const s = scaleRef.current;
    setPos(clamp({ x: (cropSize - imgSize.w * s) / 2, y: (cropSize - imgSize.h * s) / 2 }, s));
  }

  // ── Pointer drag ──────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    const now = Date.now();
    if (now - lastTap.current < 300) { recenter(); return; }
    lastTap.current = now;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, px: posRef.current.x, py: posRef.current.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPos(clamp({ x: dragRef.current.px + dx, y: dragRef.current.py + dy }, scaleRef.current));
  }
  function onPointerUp() { setDragging(false); }

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    zoomToward(scaleRef.current * (1 - e.deltaY * 0.001), e.clientX - rect.left, e.clientY - rect.top);
  }

  // ── Pinch-to-zoom ─────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [t0, t1] = [e.touches[0], e.touches[1]];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      pinchRef.current = {
        dist: Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY),
        s:    scaleRef.current,
        px:   (t0.clientX + t1.clientX) / 2 - rect.left,
        py:   (t0.clientY + t1.clientY) / 2 - rect.top,
      };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [t0, t1] = [e.touches[0], e.touches[1]];
      const dist   = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const factor = dist / pinchRef.current.dist;
      const clamped = Math.max(minScale, Math.min(5, pinchRef.current.s * factor));
      const ratio   = clamped / scaleRef.current;
      const p       = posRef.current;
      const { px, py } = pinchRef.current;
      setScale(clamped);
      setPos(clamp({ x: px - (px - p.x) * ratio, y: py - (py - p.y) * ratio }, clamped));
    }
  }
  function onTouchEnd() { pinchRef.current = null; }

  // ── Slider zoom (toward center) ───────────────────────────────────────────
  function handleSlider(v: number) { zoomToward(v); }

  const zoomPct = minScale < 5 ? Math.round(((scale - minScale) / (5 - minScale)) * 100) : 0;

  // ── Crop & output ─────────────────────────────────────────────────────────
  function cropImage() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const OUT = 400;
    canvas.width = canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, OUT, OUT);
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    const r = OUT / cropSize;
    ctx.drawImage(imgRef.current, -pos.x * r, -pos.y * r, imgSize.w * scale * r, imgSize.h * scale * r);
    ctx.restore();
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCropped(blob, canvas.toDataURL("image/jpeg", 0.92));
    }, "image/jpeg", 0.92);
  }

  // ── Always-mounted hidden inputs ──────────────────────────────────────────
  const hiddenInputs = (
    <>
      <input ref={fileRef}   type="file" accept="image/*"               className="hidden" onChange={onFileSelected} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileSelected} />
    </>
  );

  // ── Source picker ─────────────────────────────────────────────────────────
  if (!source) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
        {hiddenInputs}
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">Photo Select Karein</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setSource("gallery"); setTimeout(() => fileRef.current?.click(), 80); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition group"
            >
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-200 transition">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-teal-600" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Gallery</span>
            </button>
            <button
              onClick={() => { setSource("camera"); setTimeout(() => cameraRef.current?.click(), 80); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-600" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Camera</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">Passport size · 1:1 ratio mein crop hogi</p>
        </div>
      </div>
    );
  }

  // ── Crop UI ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {hiddenInputs}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-white/10 flex-shrink-0">
        <button onClick={() => { setSource(null); setImgSrc(""); }} className="text-white/60 hover:text-white text-sm px-2 py-1">
          ← Back
        </button>
        <h3 className="text-white font-semibold text-sm">Face Center Karein 👤</h3>
        <button onClick={recenter} className="text-teal-400 text-xs px-2 py-1 border border-teal-700 rounded-lg hover:border-teal-400">
          Center
        </button>
      </div>

      {/* Crop viewport */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
        {!imgSrc ? (
          <p className="text-white/40 text-sm">Photo select ho rahi hai...</p>
        ) : (
          <>
            {/* Crop circle with dark surround */}
            <div
              className="relative flex-shrink-0"
              style={{ width: cropSize + 32, height: cropSize + 32 }}
            >
              {/* Dark vignette outside circle */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle ${cropSize / 2 + 1}px at center, transparent ${cropSize / 2}px, rgba(0,0,0,0.82) ${cropSize / 2 + 1}px)`,
                  zIndex: 3,
                  borderRadius: "50%",
                }}
              />

              {/* Interactive crop area */}
              <div
                className={`absolute overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                style={{
                  width: cropSize, height: cropSize,
                  borderRadius: "50%",
                  top: 16, left: 16,
                  border: "2.5px solid rgba(255,255,255,0.55)",
                  zIndex: 2,
                  touchAction: "none",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Rule-of-thirds grid */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
                  backgroundSize: `${cropSize / 3}px ${cropSize / 3}px`,
                }} />

                {/* Face guide oval */}
                <div className="absolute z-10 pointer-events-none" style={{
                  width: cropSize * 0.52, height: cropSize * 0.68,
                  border: "1.5px dashed rgba(255,215,0,0.55)",
                  borderRadius: "50%",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -52%)",
                }} />

                {/* Image */}
                <img
                  src={imgSrc} alt="crop"
                  onLoad={onImgLoad}
                  draggable={false}
                  style={{
                    position: "absolute",
                    left: pos.x, top: pos.y,
                    width:  imgSize.w * scale,
                    height: imgSize.h * scale,
                    userSelect: "none", pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* Tips */}
            <p className="text-white/50 text-xs text-center">
              Drag to move · Pinch/scroll to zoom · Double-tap to center
            </p>

            {/* Zoom controls */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-white/40">
                <span>Zoom</span>
                <span className="text-teal-400 font-semibold">{zoomPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onPointerDown={() => {
                    const id = setInterval(() => zoomToward(scaleRef.current - 0.05), 80);
                    window.addEventListener("pointerup", () => clearInterval(id), { once: true });
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center select-none"
                >−</button>
                <input
                  type="range" min={minScale} max={5} step={0.01} value={scale}
                  onChange={(e) => handleSlider(Number(e.target.value))}
                  className="flex-1 accent-teal-400 h-1.5"
                />
                <button
                  onPointerDown={() => {
                    const id = setInterval(() => zoomToward(scaleRef.current + 0.05), 80);
                    window.addEventListener("pointerup", () => clearInterval(id), { once: true });
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center select-none"
                >+</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 pb-8 pt-3 flex gap-3 max-w-sm w-full mx-auto">
        <button
          onClick={() => { setImgSrc(""); if (source === "camera") cameraRef.current?.click(); else fileRef.current?.click(); }}
          className="px-4 py-3 rounded-2xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition"
          title="Dobara lein"
        >↺ Retake</button>
        <button
          onClick={() => { setSource(null); setImgSrc(""); }}
          className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition"
        >Cancel</button>
        <button
          onClick={cropImage}
          disabled={!imgSrc}
          className="flex-1 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold disabled:opacity-40 transition"
        >Use Photo ✓</button>
      </div>
    </div>
  );
}
