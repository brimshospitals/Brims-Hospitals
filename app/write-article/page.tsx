"use client";
import { useState, useEffect, useRef } from "react";
import Header from "../components/header";

/* ─── Types ─── */
type BlockType = "h2" | "paragraph" | "bulletList" | "image" | "video";
type SizeType  = "small" | "medium" | "large" | "full";

interface Block {
  id:      string;
  type:    BlockType;
  text?:   string;
  items?:  string[];
  url?:    string;
  caption?:string;
  size?:   SizeType;
}

const DISEASE_TAGS = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Pregnancy", "Joint Pain"];
const SIZES: { value: SizeType; label: string }[] = [
  { value: "small",  label: "S" },
  { value: "medium", label: "M" },
  { value: "large",  label: "L" },
  { value: "full",   label: "⟺" },
];
const SIZE_PREVIEW: Record<SizeType, string> = {
  small:  "max-w-xs",
  medium: "max-w-sm",
  large:  "max-w-xl",
  full:   "w-full",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getYouTubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/* ─── Block Editor Component ─── */
function BlockEditor({ block, onChange, onDelete, onMove, isFirst, isLast }: {
  block: Block;
  onChange: (id: string, changes: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMove:   (id: string, dir: "up" | "down") => void;
  isFirst:  boolean;
  isLast:   boolean;
}) {
  const [imgUploading, setImgUploading] = useState(false);

  async function uploadImage(file: File) {
    setImgUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) onChange(block.id, { url: data.url });
    } catch {}
    setImgUploading(false);
  }

  const controlBar = (
    <div className="flex gap-1 mb-2 justify-end">
      <button disabled={isFirst} onClick={() => onMove(block.id, "up")}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-xs transition flex items-center justify-center">↑</button>
      <button disabled={isLast} onClick={() => onMove(block.id, "down")}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-xs transition flex items-center justify-center">↓</button>
      <button onClick={() => onDelete(block.id)}
        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs transition flex items-center justify-center">✕</button>
    </div>
  );

  /* ── H2 ── */
  if (block.type === "h2") return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      {controlBar}
      <label className="text-xs text-gray-400 font-medium mb-1 block">H2 Heading</label>
      <input
        value={block.text || ""}
        onChange={(e) => onChange(block.id, { text: e.target.value })}
        placeholder="Subheading likhein..."
        className="w-full text-xl font-bold text-gray-800 border-b-2 border-teal-300 focus:border-teal-500 outline-none py-1 bg-transparent"
      />
    </div>
  );

  /* ── Paragraph ── */
  if (block.type === "paragraph") return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      {controlBar}
      <label className="text-xs text-gray-400 font-medium mb-1 block">Paragraph</label>
      <textarea
        value={block.text || ""}
        onChange={(e) => onChange(block.id, { text: e.target.value })}
        placeholder="Paragraph likhein..."
        rows={4}
        className="w-full text-gray-700 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y"
      />
    </div>
  );

  /* ── Bullet List ── */
  if (block.type === "bulletList") {
    const items = block.items || [""];
    function updateItem(idx: number, val: string) {
      const next = [...items];
      next[idx] = val;
      onChange(block.id, { items: next });
    }
    function addItem() { onChange(block.id, { items: [...items, ""] }); }
    function removeItem(idx: number) {
      onChange(block.id, { items: items.filter((_, i) => i !== idx) });
    }
    return (
      <div className="border border-gray-200 rounded-2xl p-4 bg-white">
        {controlBar}
        <label className="text-xs text-gray-400 font-medium mb-2 block">Bullet Points List</label>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>
              <input
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                placeholder={`Point ${idx + 1}...`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)}
                  className="w-7 h-7 text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addItem}
          className="mt-2 text-teal-600 text-sm hover:underline flex items-center gap-1">
          + Point add karein
        </button>
      </div>
    );
  }

  /* ── Image ── */
  if (block.type === "image") return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      {controlBar}
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-gray-400 font-medium">Image</label>
        <div className="flex gap-1 ml-auto">
          {SIZES.map((s) => (
            <button key={s.value} onClick={() => onChange(block.id, { size: s.value })}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                (block.size || "full") === s.value
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {block.url ? (
        <div className={`${SIZE_PREVIEW[block.size || "full"]} mx-auto mb-3`}>
          <img src={block.url} alt="preview" className="rounded-xl w-full" />
          <button onClick={() => onChange(block.id, { url: "" })}
            className="text-xs text-red-400 hover:underline mt-1">Remove</button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-teal-400 rounded-xl p-8 cursor-pointer transition mb-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-gray-300 mb-2" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-400">
            {imgUploading ? "Upload ho raha hai..." : "Click karke image select karein"}
          </p>
          <input type="file" accept="image/*" className="hidden" disabled={imgUploading}
            onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
        </label>
      )}

      <input
        value={block.caption || ""}
        onChange={(e) => onChange(block.id, { caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
    </div>
  );

  /* ── Video ── */
  if (block.type === "video") {
    const embedUrl = block.url ? getYouTubeEmbed(block.url) : null;
    return (
      <div className="border border-gray-200 rounded-2xl p-4 bg-white">
        {controlBar}
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-gray-400 font-medium">Video</label>
          <div className="flex gap-1 ml-auto">
            {SIZES.map((s) => (
              <button key={s.value} onClick={() => onChange(block.id, { size: s.value })}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  (block.size || "full") === s.value
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <input
          value={block.url || ""}
          onChange={(e) => onChange(block.id, { url: e.target.value })}
          placeholder="YouTube URL ya direct video URL daalo..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 mb-3"
        />
        {embedUrl && (
          <div className={`${SIZE_PREVIEW[block.size || "full"]} mx-auto mb-3`}>
            <iframe src={embedUrl} className="w-full aspect-video rounded-xl" allowFullScreen title="preview" />
          </div>
        )}
        <input
          value={block.caption || ""}
          onChange={(e) => onChange(block.id, { caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
    );
  }

  return null;
}

/* ─── Main Page ─── */
export default function WriteArticlePage() {
  const [authorName, setAuthorName]   = useState("");
  const [authorRole, setAuthorRole]   = useState("admin");
  const [authorId, setAuthorId]       = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized]   = useState(false);

  const [title, setTitle]             = useState("");
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverUrl, setCoverUrl]       = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [blocks, setBlocks]           = useState<Block[]>([]);
  const [source, setSource]           = useState("");
  const [diseaseTags, setDiseaseTags] = useState<string[]>([]);
  const [generalTagInput, setGeneralTagInput] = useState("");
  const [generalTags, setGeneralTags] = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  // Auth check
  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    const userId  = localStorage.getItem("userId");
    const aName   = localStorage.getItem("adminName");

    if (adminId) {
      setAuthorId(adminId);
      setAuthorName(aName || "Admin");
      setAuthorRole("admin");
      setAuthorized(true);
      setAuthChecked(true);
      return;
    }
    if (userId) {
      fetch(`/api/profile?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && ["admin", "doctor", "staff"].includes(d.user?.role)) {
            setAuthorId(userId);
            setAuthorName(d.user.name || "Author");
            setAuthorRole(d.user.role);
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        })
        .catch(() => setAuthorized(false))
        .finally(() => setAuthChecked(true));
      return;
    }
    setAuthChecked(true);
    setAuthorized(false);
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function uploadCover(file: File) {
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setCoverUrl(data.url);
    } catch { showToast("Cover upload fail hua", false); }
    setCoverUploading(false);
  }

  function addBlock(type: BlockType) {
    const newBlock: Block = {
      id:    uid(),
      type,
      text:  "",
      items: type === "bulletList" ? [""] : undefined,
      url:   "",
      caption: "",
      size:  "full",
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowBlockMenu(false);
  }

  function updateBlock(id: string, changes: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...changes } : b));
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, dir: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function toggleDiseaseTag(tag: string) {
    setDiseaseTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addGeneralTag() {
    const t = generalTagInput.trim().toLowerCase();
    if (t && !generalTags.includes(t)) setGeneralTags((prev) => [...prev, t]);
    setGeneralTagInput("");
  }

  async function handleSave(publish: boolean) {
    if (!title.trim()) { showToast("Title zaruri hai", false); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       title.trim(),
          coverImage:  coverUrl,
          blocks,
          authorName,
          authorId,
          authorRole,
          source,
          diseaseTags,
          generalTags,
          isPublished: publish,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, true);
        if (publish) {
          setTimeout(() => { window.location.href = `/articles/${data.articleId}`; }, 1200);
        } else {
          // Reset for new article after draft save
          showToast("Draft save ho gaya!", true);
        }
      } else {
        showToast(data.message || "Error", false);
      }
    } catch { showToast("Network error", false); }
    setSaving(false);
  }

  /* ── Loading / Unauthorized states ── */
  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Checking permissions...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Nahi Hai</h2>
          <p className="text-gray-500 text-sm mb-4">Sirf Admin, Doctor ya Staff article likh sakte hain</p>
          <a href="/login" className="bg-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition">
            Login Karein
          </a>
        </div>
      </main>
    );
  }

  const BLOCK_OPTIONS: { type: BlockType; label: string; icon: string }[] = [
    { type: "h2",         label: "H2 Heading",    icon: "H₂" },
    { type: "paragraph",  label: "Paragraph",     icon: "¶"  },
    { type: "bulletList", label: "Bullet Points", icon: "•"  },
    { type: "image",      label: "Image",         icon: "🖼"  },
    { type: "video",      label: "Video",         icon: "▶"  },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">✍️ Article Likhein</h1>
            <p className="text-gray-400 text-sm mt-0.5">{authorName} · {authorRole}</p>
          </div>
          <a href="/articles" className="text-gray-400 hover:text-gray-600 text-sm">← Articles</a>
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">Cover Image</label>
          {coverPreview || coverUrl ? (
            <div className="relative">
              <img
                src={coverUrl || coverPreview}
                alt="cover"
                className="w-full h-52 object-cover rounded-xl"
              />
              <button onClick={() => { setCoverUrl(""); setCoverPreview(""); setCoverFile(null); }}
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm hover:bg-red-600">✕</button>
              {!coverUrl && coverFile && (
                <button onClick={() => uploadCover(coverFile!)} disabled={coverUploading}
                  className="absolute bottom-2 right-2 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
                  {coverUploading ? "Uploading..." : "Upload ☁️"}
                </button>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-10 cursor-pointer transition">
              <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-gray-200 mb-2" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Cover image click karke select karein</p>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                }} />
            </label>
          )}
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Article Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article ka heading likhein..."
            className="w-full text-2xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-teal-500 outline-none pb-2 bg-transparent"
          />
        </div>

        {/* Content Blocks */}
        <div className="space-y-3 mb-4">
          {blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={updateBlock}
              onDelete={deleteBlock}
              onMove={moveBlock}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
            />
          ))}
        </div>

        {/* Add Block Button */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowBlockMenu((v) => !v)}
            className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl py-4 text-gray-400 hover:text-teal-600 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Block Add Karein
          </button>

          {showBlockMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2 grid grid-cols-5 gap-1">
              {BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => addBlock(opt.type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-teal-50 transition"
                >
                  <span className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-bold text-lg">
                    {opt.icon}
                  </span>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-5">
          <h3 className="font-bold text-gray-700">Article Details</h3>

          {/* Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Author Name</label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Role</label>
              <select value={authorRole} onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Source URL (optional)</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Disease Tags */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">
              🏥 Bimari Tags — In diseases ke patients ko notification jayega
            </label>
            <div className="flex flex-wrap gap-2">
              {DISEASE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleDiseaseTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                    diseaseTags.includes(tag)
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {diseaseTags.length > 0 && (
              <p className="text-xs text-teal-600 mt-2">
                ✅ Notification jayegi: <strong>{diseaseTags.join(", ")}</strong> se peedit members ko
              </p>
            )}
          </div>

          {/* General Tags */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">General Tags (diet, tips, exercise...)</label>
            <div className="flex gap-2 mb-2">
              <input
                value={generalTagInput}
                onChange={(e) => setGeneralTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGeneralTag())}
                placeholder="Tag likhein, Enter dabao..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button onClick={addGeneralTag}
                className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {generalTags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  #{tag}
                  <button onClick={() => setGeneralTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 rounded-2xl hover:border-gray-300 transition disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : "💾 Draft Save Karein"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 shadow-lg shadow-teal-200 text-sm"
          >
            {saving ? "Publishing..." : "🚀 Publish Karein"}
          </button>
        </div>

      </div>
    </main>
  );
}
