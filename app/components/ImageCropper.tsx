"use client";
import { useRef, useState, useEffect } from "react";

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

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const startDrag  = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Set crop size based on screen
  useEffect(() => {
    const s = Math.min(window.innerWidth - 64, 280);
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

  // When image loads, center it
  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    imgRef.current = img;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImgSize({ w, h });
    // Scale so smaller dimension fills crop area
    const initScale = cropSize / Math.min(w, h);
    setScale(initScale);
    setPos({
      x: (cropSize - w * initScale) / 2,
      y: (cropSize - h * initScale) / 2,
    });
  }

  // Clamp position so image always covers crop area
  function clamp(p: { x: number; y: number }, s: number) {
    const iw = imgSize.w * s;
    const ih = imgSize.h * s;
    return {
      x: Math.min(0, Math.max(cropSize - iw, p.x)),
      y: Math.min(0, Math.max(cropSize - ih, p.y)),
    };
  }

  // Mouse / Touch drag
  function onPointerDown(e: React.PointerEvent) {
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

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const newScale = Math.max(cropSize / Math.max(imgSize.w, imgSize.h), Math.min(4, scale - e.deltaY * 0.002));
    setScale(newScale);
    setPos((p) => clamp(p, newScale));
  }

  function handleScaleChange(v: number) {
    const minScale = cropSize / Math.min(imgSize.w || 1, imgSize.h || 1);
    const newScale = Math.max(minScale, Math.min(4, v));
    setScale(newScale);
    setPos((p) => clamp(p, newScale));
  }

  function cropImage() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const OUT = 400; // output size 400×400
    canvas.width  = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, OUT, OUT);

    // Draw circle clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();

    // Map crop area → canvas
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

  // ── Always-mounted hidden inputs (must never unmount — fileRef click fires after source state change) ──
  const hiddenInputs = (
    <>
      <input ref={fileRef}   type="file" accept="image/*"             className="hidden" onChange={onFileSelected} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileSelected} />
    </>
  );

  // ── Render: source selection ──
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
        </div>
      </div>
    );
  }

  // ── Render: crop UI ──
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4">
      {hiddenInputs}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="w-full flex items-center justify-between py-2">
        <button onClick={() => { setSource(null); setImgSrc(""); }} className="text-white/70 hover:text-white text-sm flex items-center gap-1">
          ← Back
        </button>
        <h3 className="text-white font-semibold">Photo Crop Karein</h3>
        <div className="w-12" />
      </div>

      {/* Crop area */}
      <div className="flex flex-col items-center gap-4 flex-1 justify-center w-full">
        {!imgSrc ? (
          <div className="text-white/50 text-sm">Photo select karo...</div>
        ) : (
          <>
            {/* Crop viewport */}
            <div
              className="relative overflow-hidden rounded-full bg-black border-4 border-white/20 cursor-grab active:cursor-grabbing"
              style={{ width: cropSize, height: cropSize }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onWheel={onWheel}
            >
              {/* Grid overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
                backgroundSize: `${cropSize/3}px ${cropSize/3}px`,
              }} />
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

            <p className="text-white/60 text-xs">Drag karein position set karne ke liye</p>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              <span className="text-white/60 text-xs">🔍</span>
              <input
                type="range"
                min={cropSize / Math.min(imgSize.w || 1, imgSize.h || 1)}
                max={4}
                step={0.01}
                value={scale}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
                className="flex-1 accent-teal-400 h-1.5"
              />
              <span className="text-white/60 text-xs">🔍+</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="w-full max-w-xs flex gap-3 pb-4">
        <button
          onClick={() => { setSource(null); setImgSrc(""); }}
          className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition"
        >
          Cancel
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
