"use client";
import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  onCropped: (blob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropper({ onCropped, onClose }: Props) {
  const [imgSrc, setImgSrc]         = useState("");
  const [source, setSource]         = useState<"gallery" | "camera" | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [pos, setPos]               = useState({ x: 0, y: 0 });
  const [scale, setScale]           = useState(1);
  const [imgSize, setImgSize]       = useState({ w: 0, h: 0 });
  const [cropSize, setCropSize]     = useState(280);
  const [minScale, setMinScale]     = useState(1);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const startDrag  = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const pinchRef   = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);
  const lastTap    = useRef(0);

  useEffect(() => {
    const s = Math.min(window.innerWidth - 48, 300);
    setCropSize(s);
  }, []);

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setPos({ x: 0, y: 0 });
    setScale(1);
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    imgRef.current = img;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImgSize({ w, h });
    const min = cropSize / Math.min(w, h);
    setMinScale(min);
    const initScale = Math.max(min, cropSize / Math.max(w, h) * 1.15);
    setScale(initScale);
    setPos({
      x: (cropSize - w * initScale) / 2,
      y: (cropSize - h * initScale) / 2,
    });
  }

  function clamp(p: { x: number; y: number }, s: number) {
    const iw = imgSize.w * s;
    const ih = imgSize.h * s;
    return {
      x: Math.min(0, Math.max(cropSize - iw, p.x)),
      y: Math.min(0, Math.max(cropSize - ih, p.y)),
    };
  }

  function recenter() {
    if (!imgSize.w) return;
    const min = cropSize / Math.min(imgSize.w, imgSize.h);
    setMinScale(min);
    const s = Math.max(min, scale);
    setScale(s);
    setPos(clamp({ x: (cropSize - imgSize.w * s) / 2, y: (cropSize - imgSize.h * s) / 2 }, s));
  }

  // Pointer drag
  function onPointerDown(e: React.PointerEvent) {
    // Double tap to re-center
    const now = Date.now();
    if (now - lastTap.current < 300) { recenter(); return; }
    lastTap.current = now;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startDrag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startDrag.current.x;
    const dy = e.clientY - startDrag.current.y;
    setPos(clamp({ x: startDrag.current.px + dx, y: startDrag.current.py + dy }, scale));
  }
  function onPointerUp() { setDragging(false); }

  // Wheel zoom (desktop)
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const newScale = Math.max(minScale, Math.min(5, scale - e.deltaY * 0.003));
    setScale(newScale);
    setPos((p) => clamp(p, newScale));
  }

  // Touch pinch-to-zoom
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = { dist, scale, cx, cy };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / pinchRef.current.dist;
      const newScale = Math.max(minScale, Math.min(5, pinchRef.current.scale * factor));
      setScale(newScale);
      setPos((p) => clamp(p, newScale));
    }
  }
  function onTouchEnd() { pinchRef.current = null; }

  function handleScaleChange(v: number) {
    const newScale = Math.max(minScale, Math.min(5, v));
    setScale(newScale);
    setPos((p) => clamp(p, newScale));
  }

  const zoomPct = minScale > 0 ? Math.round(((scale - minScale) / (5 - minScale)) * 100) : 0;

  function cropImage() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const OUT = 400;
    canvas.width  = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, OUT, OUT);
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    const ratio = OUT / cropSize;
    ctx.drawImage(
      imgRef.current,
      -pos.x * ratio,
      -pos.y * ratio,
      imgSize.w * scale * ratio,
      imgSize.h * scale * ratio
    );
    ctx.restore();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = canvas.toDataURL("image/jpeg", 0.92);
      onCropped(blob, url);
    }, "image/jpeg", 0.92);
  }

  const hiddenInputs = (
    <>
      <input ref={fileRef}   type="file" accept="image/*"             className="hidden" onChange={onFileSelected} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileSelected} />
    </>
  );

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
          <p className="text-xs text-gray-400 text-center">Passport size photo — 1:1 ratio mein crop hogi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center">
      {hiddenInputs}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <button onClick={() => { setSource(null); setImgSrc(""); }} className="text-white/70 hover:text-white text-sm flex items-center gap-1 px-2 py-1">
          ← Back
        </button>
        <h3 className="text-white font-semibold text-sm">Face Center Karein 👤</h3>
        <button
          onClick={recenter}
          className="text-teal-400 hover:text-teal-300 text-xs px-2 py-1 border border-teal-600 rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Crop area */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-4">
        {!imgSrc ? (
          <div className="text-white/50 text-sm text-center">
            <p className="text-4xl mb-3">📷</p>
            <p>Photo select karo...</p>
          </div>
        ) : (
          <>
            {/* Crop viewport */}
            <div className="relative" style={{ width: cropSize + 32, height: cropSize + 32 }}>
              {/* Darkened corners (outside circle) */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle ${cropSize / 2}px at center, transparent ${cropSize / 2}px, rgba(0,0,0,0.75) ${cropSize / 2}px)`,
                  borderRadius: "50%",
                  zIndex: 2,
                  pointerEvents: "none",
                  width: cropSize + 32,
                  height: cropSize + 32,
                }}
              />

              {/* Main crop circle */}
              <div
                className="absolute overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                  width: cropSize,
                  height: cropSize,
                  borderRadius: "50%",
                  top: 16,
                  left: 16,
                  border: "2px solid rgba(255,255,255,0.5)",
                  zIndex: 1,
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
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.12) 1px,transparent 1px)",
                  backgroundSize: `${cropSize/3}px ${cropSize/3}px`,
                }} />

                {/* Face guide oval */}
                <div
                  className="absolute z-10 pointer-events-none"
                  style={{
                    width: cropSize * 0.55,
                    height: cropSize * 0.7,
                    border: "1.5px dashed rgba(255,220,0,0.5)",
                    borderRadius: "50%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -52%)",
                  }}
                />

                <img
                  src={imgSrc}
                  alt="crop"
                  onLoad={onImgLoad}
                  draggable={false}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top:  pos.y,
                    width:  imgSize.w * scale,
                    height: imgSize.h * scale,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-0.5">
              <p className="text-white/80 text-xs font-medium">👆 Drag karein · Pinch to zoom · Double-tap to center</p>
              <p className="text-yellow-400/70 text-xs">Dashed circle = face area guide</p>
            </div>

            {/* Zoom slider */}
            <div className="w-full max-w-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Zoom</span>
                <span className="text-teal-400 font-medium">{zoomPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleScaleChange(scale - 0.1)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition"
                >−</button>
                <input
                  type="range"
                  min={minScale}
                  max={5}
                  step={0.01}
                  value={scale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="flex-1 accent-teal-400 h-1.5"
                />
                <button
                  onClick={() => handleScaleChange(scale + 0.1)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition"
                >+</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="w-full max-w-xs flex gap-3 px-4 pb-6 pt-2">
        <button
          onClick={() => { setSource(null); setImgSrc(""); }}
          className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => { setSource(null); setImgSrc(""); setTimeout(() => { if (source === "gallery") fileRef.current?.click(); else cameraRef.current?.click(); }, 80); }}
          className="px-4 py-3 rounded-2xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition"
        >
          ↺
        </button>
        <button
          onClick={cropImage}
          disabled={!imgSrc}
          className="flex-1 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold disabled:opacity-40 transition"
        >
          Use Photo ✓
        </button>
      </div>
    </div>
  );
}
