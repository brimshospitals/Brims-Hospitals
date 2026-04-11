"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/header";

const diseaseTagColors: Record<string, string> = {
  HTN:               "bg-red-100 text-red-700",
  Diabetes:          "bg-orange-100 text-orange-700",
  CVD:               "bg-pink-100 text-pink-700",
  CKD:               "bg-purple-100 text-purple-700",
  "Thyroid Disorder":"bg-yellow-100 text-yellow-700",
  Pregnancy:         "bg-rose-100 text-rose-600",
  "Joint Pain":      "bg-blue-100 text-blue-700",
};

const sizeClass: Record<string, string> = {
  small:  "max-w-xs",
  medium: "max-w-sm md:max-w-md",
  large:  "max-w-xl md:max-w-2xl",
  full:   "w-full",
};

function getYouTubeEmbed(url: string) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

function renderBlock(block: any, i: number) {
  const sc = sizeClass[block.size || "full"];
  switch (block.type) {
    case "h2":
      return (
        <h2 key={i} className="text-2xl font-bold text-gray-800 mt-8 mb-3 border-l-4 border-teal-500 pl-4">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p key={i} className="text-gray-600 leading-relaxed mb-5 text-base">
          {block.text}
        </p>
      );
    case "bulletList":
      return (
        <ul key={i} className="mb-5 space-y-2">
          {(block.items || []).map((item: string, j: number) => (
            <li key={j} className="flex items-start gap-3 text-gray-600">
              <span className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure key={i} className={`${sc} mx-auto mb-6`}>
          <img src={block.url} alt={block.caption || ""} className="rounded-2xl w-full shadow-sm" />
          {block.caption && (
            <figcaption className="text-xs text-gray-400 text-center mt-2">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "video": {
      const embedUrl = getYouTubeEmbed(block.url || "");
      return (
        <figure key={i} className={`${sc} mx-auto mb-6`}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video rounded-2xl shadow-sm"
              allowFullScreen
              title={block.caption || "Video"}
            />
          ) : (
            <video src={block.url} controls className="w-full rounded-2xl shadow-sm" />
          )}
          {block.caption && (
            <figcaption className="text-xs text-gray-400 text-center mt-2">{block.caption}</figcaption>
          )}
        </figure>
      );
    }
    default:
      return null;
  }
}

export default function ArticleViewPage() {
  const params            = useParams();
  const id                = params?.id as string;
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setArticle(d.article);
        else setError("Article nahi mila");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Article load ho raha hai...</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-24">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-600 font-medium">{error || "Article nahi mila"}</p>
          <a href="/articles" className="mt-4 inline-block text-teal-600 hover:underline text-sm">← Wapas Articles</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <a href="/articles" className="inline-flex items-center gap-1.5 text-teal-600 text-sm hover:underline mb-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Sabhi Articles
        </a>

        {/* Disease Tags */}
        {article.diseaseTags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {article.diseaseTags.map((tag: string) => (
              <span key={tag} className={`text-xs font-bold px-3 py-1 rounded-full ${diseaseTagColors[tag] || "bg-gray-100 text-gray-600"}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
              {article.authorName?.[0] || "A"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{article.authorName}</p>
              <p className="text-xs text-gray-400 capitalize">{article.authorRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto flex-wrap">
            <span>
              {new Date(article.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {article.views} views
            </span>
            {article.source && (
              <a href={article.source} target="_blank" rel="noopener noreferrer"
                className="text-teal-600 hover:underline flex items-center gap-1">
                Source ↗
              </a>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
            <img src={article.coverImage} alt={article.title} className="w-full max-h-96 object-cover" />
          </div>
        )}

        {/* Content Blocks */}
        <div className="prose-custom">
          {(article.blocks || []).map((block: any, i: number) => renderBlock(block, i))}
        </div>

        {/* General Tags */}
        {article.generalTags?.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2">Tags:</p>
            <div className="flex gap-2 flex-wrap">
              {article.generalTags.map((tag: string) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center">
          <p className="font-bold text-teal-700 text-lg mb-1">Doctor se Milein</p>
          <p className="text-gray-500 text-sm mb-4">Agar aapko koi symptom hai toh doctor se salah lein</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/opd-booking" className="bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition">
              OPD Book Karein
            </a>
            <a href="/teleconsultation" className="border border-teal-600 text-teal-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-50 transition">
              Teleconsult Karein
            </a>
          </div>
        </div>
      </article>

      <footer className="bg-teal-800 text-white text-center py-6 mt-8">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
      </footer>
    </main>
  );
}
