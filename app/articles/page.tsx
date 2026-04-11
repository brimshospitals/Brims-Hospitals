"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

const diseaseTagColors: Record<string, string> = {
  HTN:               "bg-red-100 text-red-700",
  Diabetes:          "bg-orange-100 text-orange-700",
  CVD:               "bg-pink-100 text-pink-700",
  CKD:               "bg-purple-100 text-purple-700",
  "Thyroid Disorder":"bg-yellow-100 text-yellow-700",
  Pregnancy:         "bg-rose-100 text-rose-600",
  "Joint Pain":      "bg-blue-100 text-blue-700",
};

const ALL_DISEASE_TAGS = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Pregnancy", "Joint Pain"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aaj";
  if (days === 1) return "Kal";
  if (days < 7)   return `${days} din pehle`;
  if (days < 30)  return `${Math.floor(days / 7)} hafte pehle`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ArticlesPage() {
  const [articles, setArticles]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState("");

  useEffect(() => { fetchArticles(); }, [activeTag]);

  async function fetchArticles(s = search) {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (s)         p.set("search", s);
      if (activeTag) p.set("diseaseTag", activeTag);
      const res  = await fetch(`/api/articles?${p}`);
      const data = await res.json();
      if (data.success) setArticles(data.articles);
    } catch {}
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchArticles(search);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-14 px-6 text-center">
        <p className="text-teal-300 text-xs font-semibold uppercase tracking-widest mb-2">📰 Health Knowledge</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Swasthya Lekh</h1>
        <p className="text-teal-100 text-sm max-w-md mx-auto mb-6">
          Doctors aur health experts ke articles — aapki bimari ke mutabiq filtered
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex max-w-lg mx-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Article dhundho..."
            className="flex-1 bg-white/15 border border-white/30 text-white placeholder-teal-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white/25"
          />
          <button type="submit" className="bg-white text-teal-700 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-teal-50 transition">
            Search
          </button>
        </form>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Disease Tag Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveTag("")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition flex-shrink-0 ${
              activeTag === "" ? "bg-teal-600 text-white border-teal-600" : "bg-white border-gray-200 text-gray-600 hover:border-teal-400"
            }`}
          >
            Sabhi Articles
          </button>
          {ALL_DISEASE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition flex-shrink-0 ${
                activeTag === tag
                  ? "bg-teal-600 text-white border-teal-600"
                  : `${diseaseTagColors[tag]} border-transparent hover:opacity-80`
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📰</p>
            <p className="text-gray-500 text-lg font-medium">Koi article nahi mila</p>
            <p className="text-gray-400 text-sm mt-1">Filter change karein ya admin se articles publish karwayen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <a key={a._id} href={`/articles/${a._id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group">
                {/* Cover */}
                <div className="h-44 bg-gradient-to-br from-teal-100 to-teal-200 overflow-hidden">
                  {a.coverImage
                    ? <img src={a.coverImage} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl opacity-40">📰</span>
                      </div>
                    )
                  }
                </div>

                <div className="p-4">
                  {/* Disease tags */}
                  {a.diseaseTags?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {a.diseaseTags.map((tag: string) => (
                        <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diseaseTagColors[tag] || "bg-gray-100 text-gray-600"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="font-bold text-gray-800 text-base leading-snug mb-2 line-clamp-2 group-hover:text-teal-700 transition">
                    {a.title}
                  </h3>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xs font-bold">
                        {a.authorName?.[0] || "A"}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">{a.authorName}</p>
                        <p className="text-xs text-gray-400">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {a.views || 0}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Write article CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-3xl p-6 text-white text-center">
          <p className="font-bold text-lg mb-1">Doctor / Staff hain?</p>
          <p className="text-teal-100 text-sm mb-4">Health articles likhein aur patients ko educate karein</p>
          <a href="/write-article"
            className="inline-block bg-white text-teal-700 font-bold px-6 py-2.5 rounded-xl hover:bg-teal-50 transition text-sm">
            ✍️ Article Likhein
          </a>
        </div>
      </div>

      <footer className="bg-teal-800 text-white text-center py-6 mt-8">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
      </footer>
    </main>
  );
}
