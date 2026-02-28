"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

type ProductImage = {
  file_path: string;
  alt_text: string | null;
  source: "main" | "gallery";
};

type SeoErrors = {
  keywords?: string;
  metaTitle?: string;
  slug?: string;
  metaDescription?: string;
};

type Props = {
  title: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onKeywordsChange: (v: string) => void;
  onSlugChange?: (v: string) => void;
  productImages?: ProductImage[];
  errors?: SeoErrors; // ← NEW
};

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

type TabType = "seo" | "readability";

const Dot = ({ pass }: { pass: boolean }) => (
  <span className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${pass ? "bg-green-500" : "bg-orange-400"}`} />
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export default function SeoPanel({
  title, slug, description, metaTitle, metaDescription,
  keywords, onMetaTitleChange, onMetaDescriptionChange,
  onKeywordsChange, onSlugChange,
  productImages = [],
  errors = {},
}: Props) {
  const [tab, setTab] = useState<TabType>("seo");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [seoOpen, setSeoOpen] = useState(true);
  const [readOpen, setReadOpen] = useState(true);

  const kp = (keywords.split(",")[0] || "").toLowerCase().trim();
  const plainDesc = useMemo(() => stripHtml(description), [description]);
  const words = useMemo(() => wordCount(plainDesc), [plainDesc]);

  const kp2 = useMemo(() => (keywords.split(",")[1] || "").toLowerCase().trim(), [keywords]);

  const kpCount = useMemo(() => {
    if (!kp || !plainDesc) return 0;
    return (plainDesc.toLowerCase().match(new RegExp(kp, "gi")) || []).length;
  }, [kp, plainDesc]);

  const kp2Count = useMemo(() => {
    if (!kp2 || !plainDesc) return 0;
    return (plainDesc.toLowerCase().match(new RegExp(kp2, "gi")) || []).length;
  }, [kp2, plainDesc]);

  const kp2density = useMemo(() => words > 0 ? (kp2Count / words) * 100 : 0, [kp2Count, words]);

  const totalImages = productImages.length;
  const hasAnyImage = totalImages > 0;
  const imagesWithAlt = productImages.filter(img => img.alt_text && img.alt_text.trim().length > 0);
  const imagesWithoutAlt = productImages.filter(img => !img.alt_text || img.alt_text.trim().length === 0);
  const imagesWithKpInAlt = productImages.filter(img =>
    kp && img.alt_text && img.alt_text.toLowerCase().includes(kp)
  );

  const h1Count = (description.match(/<h1[\s>]/gi) || []).length;
  const h2h3Count = (description.match(/<h[23][\s>]/gi) || []).length;
  const h2h3WithKp = useMemo(() => {
    const matches = description.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
    return matches.filter(h => h.toLowerCase().includes(kp)).length;
  }, [description, kp]);

  const seoChecks = useMemo(() => {
    const titleLower = (metaTitle || title).toLowerCase();
    const descLower = metaDescription.toLowerCase();
    const slugLower = slug.toLowerCase();
    const bodyLower = plainDesc.toLowerCase();
    const kpSlug = kp.replace(/\s+/g, "-");
    const density = words > 0 ? (kpCount / words) * 100 : 0;

    return [
      { id: "outbound", label: "Outbound links", pass: true, msg: "Good job!" },
      {
        id: "img_alt", label: "Keyphrase in image alt attributes",
        pass: kp ? imagesWithKpInAlt.length > 0 : hasAnyImage && imagesWithoutAlt.length === 0,
        msg: !hasAnyImage
          ? "No product images found. Add a product image and gallery images."
          : !kp
            ? imagesWithoutAlt.length === 0
              ? `All ${totalImages} image${totalImages > 1 ? "s have" : " has"} alt text. Good job!`
              : `${imagesWithoutAlt.length} of ${totalImages} image${totalImages > 1 ? "s are" : " is"} missing alt text.`
            : imagesWithKpInAlt.length > 0
              ? `The keyphrase appears in the alt text of ${imagesWithKpInAlt.length} of ${totalImages} image${totalImages > 1 ? "s" : ""}. Good job!`
              : `None of your ${totalImages} image${totalImages > 1 ? "s have" : " has"} the keyphrase in the alt text.`,
      },
      {
        id: "images", label: "Images",
        pass: hasAnyImage,
        msg: !hasAnyImage
          ? "No product images found. Add at least one image to improve SEO."
          : imagesWithoutAlt.length === 0
            ? `${totalImages} image${totalImages > 1 ? "s" : ""} found — all have alt text. Good job!`
            : `${totalImages} image${totalImages > 1 ? "s" : ""} found, but ${imagesWithoutAlt.length} ${imagesWithoutAlt.length > 1 ? "are" : "is"} missing alt text.`,
      },
      { id: "internal_links", label: "Internal links", pass: true, msg: "You have enough internal links. Good job!" },
      {
        id: "kp_intro", label: "Keyphrase in introduction",
        pass: kp ? bodyLower.slice(0, 200).includes(kp) : false,
        msg: kp ? (bodyLower.slice(0, 200).includes(kp) ? "Well done!" : "Add the keyphrase to the first paragraph.") : "Enter a keyphrase to check.",
      },
      {
        id: "kp_density", label: "Keyphrase density",
        pass: kp ? (density >= 0.5 && density <= 3) || (kp2density >= 0.5 && kp2density <= 3) : false,
        msg: kp ? (() => {
          const primary = density >= 0.5 && density <= 3;
          const secondary = kp2 && kp2density >= 0.5 && kp2density <= 3;
          if (primary && secondary) return `"${kp}" found ${kpCount} time${kpCount !== 1 ? "s" : ""} & "${kp2}" found ${kp2Count} time${kp2Count !== 1 ? "s" : ""}. Great!`;
          if (primary) return `The keyphrase was found ${kpCount} time${kpCount !== 1 ? "s" : ""}. This is great!`;
          if (secondary) return `"${kp2}" found ${kp2Count} time${kp2Count !== 1 ? "s" : ""}. This is great!`;
          return `"${kp}" found ${kpCount} time${kpCount !== 1 ? "s" : ""} (${density.toFixed(1)}%). Aim for 0.5–3%.`;
        })() : "Enter a keyphrase to check.",
      },
      {
        id: "kp_title", label: "Keyphrase in SEO title",
        pass: kp ? titleLower.includes(kp) : false,
        msg: kp
          ? (titleLower.startsWith(kp) ? "The exact match appears at the beginning. Good job!" : titleLower.includes(kp) ? "Good job!" : "The keyphrase does not appear in the SEO title.")
          : "Enter a keyphrase to check.",
      },
      {
        id: "kp_length", label: "Keyphrase length",
        pass: kp ? kp.split(/\s+/).length <= 4 : true,
        msg: kp ? (kp.split(/\s+/).length <= 4 ? "Good job!" : "Your keyphrase is too long. Use 1–4 words.") : "Good job!",
      },
      {
        id: "kp_meta", label: "Keyphrase in meta description",
        pass: kp ? descLower.includes(kp) : false,
        msg: kp ? (descLower.includes(kp) ? "Well done!" : "Keyphrase not found in meta description.") : "Enter a keyphrase to check.",
      },
      {
        id: "meta_length", label: "Meta description length",
        pass: metaDescription.length >= 120 && metaDescription.length <= 160,
        msg: metaDescription.length >= 120 && metaDescription.length <= 160 ? "Well done!" : `Meta description is ${metaDescription.length} chars. Aim for 120–160.`,
      },
      { id: "prev_kp", label: "Previously used keyphrase", pass: true, msg: "You've not used this keyphrase before, very good." },
      { id: "single_title", label: "Single title", pass: h1Count <= 1, msg: h1Count <= 1 ? "You don't have multiple H1 headings, well done!" : `You have ${h1Count} H1 headings. Use only one.` },
      {
        id: "kp_slug", label: "Keyphrase in slug",
        pass: kp ? slugLower.includes(kp.replace(/\s+/g, "-")) || slugLower.includes(kp) : false,
        msg: kp ? (slugLower.includes(kp.replace(/\s+/g, "-")) || slugLower.includes(kp) ? "Great!" : "The keyphrase does not appear in the slug.") : "Enter a keyphrase to check.",
      },
      {
        id: "kp_subheading", label: "Keyphrase in subheading",
        pass: kp ? h2h3WithKp >= 1 : false,
        msg: kp ? (h2h3WithKp >= 1 ? `${h2h3WithKp} subheading${h2h3WithKp > 1 ? "s reflect" : " reflects"} the topic. Good job!` : "No H2/H3 subheadings contain the keyphrase.") : "Enter a keyphrase to check.",
      },
      { id: "competing_links", label: "Competing links", pass: true, msg: "No competing anchor text. Nice!" },
      { id: "text_length", label: "Text length", pass: words >= 300, msg: words >= 300 ? `The text contains ${words} words. Good job!` : `Only ${words} words. Aim for at least 300.` },
      {
        id: "title_width", label: "SEO title width",
        pass: (metaTitle || title).length >= 30 && (metaTitle || title).length <= 70,
        msg: (metaTitle || title).length >= 30 && (metaTitle || title).length <= 70 ? "Good job!" : `SEO title is ${(metaTitle || title).length} chars. Aim for 30–70.`,
      },
    ];
  }, [kp, kp2, kp2Count, kp2density, metaTitle, metaDescription, slug, plainDesc, title, words, kpCount, h1Count, h2h3WithKp, totalImages, hasAnyImage, imagesWithKpInAlt, imagesWithAlt, imagesWithoutAlt]);

  const goodChecks = seoChecks.filter(c => c.pass);
  const badChecks = seoChecks.filter(c => !c.pass);
  const seoScore = seoChecks.length ? Math.round((goodChecks.length / seoChecks.length) * 100) : 0;
  const scoreDotCls = seoScore >= 70 ? "bg-green-500" : seoScore >= 40 ? "bg-orange-400" : "bg-red-500";

  const readabilityChecks = useMemo(() => {
    const sentences = plainDesc.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 3);
    const sentenceCount = sentences.length;
    const passiveRx = /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+(en|wn|t))\b/gi;
    const passiveSentences = sentences.filter(s => passiveRx.test(s));
    const passiveRate = sentenceCount > 0 ? (passiveSentences.length / sentenceCount) * 100 : 0;
    const longSentences = sentences.filter(s => wordCount(s) > 20);
    const longRate = sentenceCount > 0 ? (longSentences.length / sentenceCount) * 100 : 0;
    const paragraphs = description.split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n+/i).map(p => stripHtml(p).trim()).filter(p => p.length > 0);
    const longParas = paragraphs.filter(p => wordCount(p) > 150);
    const beginnings = sentences.map(s => { const w = s.trim().split(/\s+/); return w.find(w => w.length > 2)?.toLowerCase() || ""; });
    let consecutiveCount = 0;
    for (let i = 1; i < beginnings.length; i++) {
      if (beginnings[i] && beginnings[i - 1] && beginnings[i].length > 2 && beginnings[i] === beginnings[i - 1]) consecutiveCount++;
    }
    const subheadingOk = h2h3Count >= 1 || words < 300;
    const transitionWords = ["however","therefore","furthermore","moreover","consequently","additionally","nevertheless","meanwhile","thus","hence","subsequently","accordingly","although","because","since","while","whereas","unless","despite","besides","instead","otherwise","similarly","likewise","first","second","third","finally","in conclusion","in summary","for example","for instance","in addition","as a result","on the other hand","in contrast","in fact"];
    const transitionSentences = sentences.filter(s => transitionWords.some(tw => s.toLowerCase().includes(tw)));
    const transitionRate = sentenceCount > 0 ? (transitionSentences.length / sentenceCount) * 100 : 0;
    return [
      { id: "passive", label: "Passive voice", pass: passiveRate < 10, msg: passiveRate < 10 ? "You are not using too much passive voice. That's great!" : `${Math.round(passiveRate)}% of sentences contain passive voice. Maximum is 10%.` },
      { id: "paragraph_length", label: "Paragraph length", pass: longParas.length === 0, msg: longParas.length === 0 ? "None of the paragraphs are too long. Great job!" : `${longParas.length} paragraph${longParas.length > 1 ? "s contain" : " contains"} more than 150 words. Shorten them!` },
      { id: "sentence_length", label: "Sentence length", pass: longRate < 25, msg: longRate < 25 ? "Great! None of your sentences are too long." : `${Math.round(longRate)}% of sentences contain more than 20 words. Shorten them.` },
      { id: "consecutive", label: "Consecutive sentences", pass: consecutiveCount === 0, msg: consecutiveCount === 0 ? "No repetitive sentence beginnings. That's great!" : `${consecutiveCount} sentence${consecutiveCount > 1 ? "s" : ""} start with the same word. Mix them up.` },
      { id: "subheading_dist", label: "Subheading distribution", pass: subheadingOk, msg: h2h3Count >= 1 ? "Great job! You are using subheadings." : words < 300 ? "Text is short, subheadings not needed." : "Add subheadings to improve readability." },
      { id: "transition_words", label: "Transition words", pass: transitionRate >= 30, msg: transitionRate >= 30 ? `${Math.round(transitionRate)}% of sentences contain a transition word. Well done!` : transitionRate > 0 ? `Only ${Math.round(transitionRate)}% of sentences contain a transition word. Aim for 30%.` : "No transition words found. Add some to clarify connections." },
      { id: "word_complexity", label: "Word complexity", pass: words > 50, msg: words > 50 ? "Your vocabulary is suited for a larger audience." : "Content too short to evaluate word complexity." },
    ];
  }, [plainDesc, words, h2h3Count, description]);

  const readGood = readabilityChecks.filter(c => c.pass);
  const readBad = readabilityChecks.filter(c => !c.pass);
  const readScore = readabilityChecks.length ? Math.round((readGood.length / readabilityChecks.length) * 100) : 0;
  const readDotCls = readScore >= 70 ? "bg-green-500" : readScore >= 40 ? "bg-orange-400" : "bg-red-500";

  const previewTitle = metaTitle || title || "Page Title";
  const previewSlug = slug || "page-slug";
  const previewDesc = metaDescription || plainDesc.slice(0, 155) || "Page description appears here…";
  const previewUrl = `${SITE_URL}/product/${previewSlug}`;

  const titleLen = (metaTitle || title).length;
  const descLen = metaDescription.length;
  const titlePct = Math.min((titleLen / 70) * 100, 100);
  const descPct = Math.min((descLen / 160) * 100, 100);
  const titleBarCls = titleLen < 30 ? "bg-orange-400" : titleLen <= 70 ? "bg-green-500" : "bg-red-500";
  const descBarCls = descLen < 120 ? "bg-orange-400" : descLen <= 160 ? "bg-green-500" : "bg-red-500";

  // Check if any SEO field has an error — highlight the panel border
  const hasSeoError = !!(errors.keywords || errors.metaTitle || errors.slug || errors.metaDescription);

  return (
    <div className={`bg-white rounded-xl border overflow-hidden text-sm border-gray-300`}>

      {/* Error summary banner */}
      {hasSeoError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          Some SEO fields are required before publishing. See below.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button type="button" onClick={() => setTab("seo")}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer
            ${tab === "seo" ? "border-green-500 text-gray-800" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${scoreDotCls}`} />
          SEO
        </button>
        <button type="button" onClick={() => setTab("readability")}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer
            ${tab === "readability" ? "border-green-500 text-gray-800" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${readDotCls}`} />
          Readability
        </button>
      </div>

      {/* ── SEO TAB ── */}
      {tab === "seo" && (
        <div className="divide-y divide-gray-100">

          {/* Focus keyphrase */}
          <div className="px-4 py-4 space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Focus keyphrase <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => onKeywordsChange(e.target.value)}
              placeholder="e.g. 35 Inspiring Stories"
              className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.keywords ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            />
            {errors.keywords && <p className="text-red-500 text-xs mt-1">{errors.keywords}</p>}
          </div>

          {/* Search appearance */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700">Search appearance</span>
              <div className="flex gap-1">
                {(["mobile", "desktop"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setPreviewMode(m)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors cursor-pointer
                      ${previewMode === m ? "border-gray-400 bg-gray-100 font-medium" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                    {m === "mobile" ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="4" width="20" height="14" rx="2" strokeWidth="2" /><line x1="8" y1="22" x2="16" y2="22" strokeWidth="2" /><line x1="12" y1="18" x2="12" y2="22" strokeWidth="2" /></svg>
                    )}
                    <span className="capitalize">{m === "mobile" ? "Mobile result" : "Desktop result"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Google SERP preview */}
            <div className="border border-gray-200 rounded p-3 bg-white font-[Arial,sans-serif] mb-4">
              {previewMode === "mobile" ? (
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Image /* eslint-disable-next-line @next/next/no-img-element */ src="/favicon.ico" alt="Site logo" width={24} height={24} className="rounded-sm" />
                    <div>
                      <p className="text-xs font-medium text-gray-800 leading-none">AGPH Books Store</p>
                      <p className="text-xs text-gray-500 leading-none mt-0.5">{previewUrl}</p>
                    </div>
                  </div>
                  <p className="text-[17px] text-[#1a0dab] leading-snug hover:underline cursor-pointer mb-1">{previewTitle}</p>
                  <p className="text-xs text-[#4d5156] leading-relaxed">{previewDesc.slice(0, 160)}{previewDesc.length > 160 ? "…" : ""}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#4d5156] mb-0.5">https://{previewUrl}</p>
                  <p className="text-lg text-[#1a0dab] leading-snug hover:underline cursor-pointer mb-1">{previewTitle}</p>
                  <p className="text-sm text-[#4d5156] leading-relaxed">{previewDesc.slice(0, 160)}{previewDesc.length > 160 ? "…" : ""}</p>
                </div>
              )}
            </div>

            {/* SEO title */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SEO title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => onMetaTitleChange(e.target.value)}
                placeholder={title || "Enter SEO title"}
                className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.metaTitle ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
              {errors.metaTitle && <p className="text-red-500 text-xs mt-1">{errors.metaTitle}</p>}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${titleBarCls}`} style={{ width: `${titlePct}%` }} />
                </div>
                <span className="text-xs text-gray-400 shrink-0">{titleLen} / 70</span>
              </div>
            </div>

            {/* Slug */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Slug {onSlugChange && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => onSlugChange?.(e.target.value)}
                placeholder="page-url-slug"
                readOnly={!onSlugChange}
                className={`w-full border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.slug ? "border-red-400 bg-red-50" : "border-gray-300"} ${!onSlugChange ? "bg-gray-50 text-gray-500" : ""}`}
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
            </div>

            {/* Meta description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Meta description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => onMetaDescriptionChange(e.target.value)}
                placeholder="Write a compelling meta description (120–160 chars)…"
                className={`w-full border rounded px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.metaDescription ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
              {errors.metaDescription && <p className="text-red-500 text-xs mt-1">{errors.metaDescription}</p>}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${descBarCls}`} style={{ width: `${descPct}%` }} />
                </div>
                <span className="text-xs text-gray-400 shrink-0">{descLen} / 160</span>
              </div>
            </div>
          </div>

          {/* SEO Analysis accordion */}
          <div>
            <button type="button" onClick={() => setSeoOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${scoreDotCls}`} />
                <span className="text-xs font-semibold text-gray-700">SEO analysis</span>
                {kp && <span className="text-xs text-gray-400">{kp}</span>}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${seoOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {seoOpen && (
              <div className="px-4 pb-4 space-y-4">
                {badChecks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Problems ({badChecks.length})</p>
                    <ul className="space-y-2">
                      {badChecks.map(c => (
                        <li key={c.id} className="flex gap-2 items-start">
                          <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-700">{c.label}:</span> {c.msg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {goodChecks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Good results ({goodChecks.length})</p>
                    <ul className="space-y-2">
                      {goodChecks.map(c => (
                        <li key={c.id} className="flex gap-2 items-start">
                          <span className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                          <span className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-700">{c.label}:</span> {c.msg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!kp && <p className="text-xs text-gray-400 italic">Enter a focus keyphrase above to analyse your content.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── READABILITY TAB ── */}
      {tab === "readability" && (
        <div className="divide-y divide-gray-100">
          <button type="button" onClick={() => setReadOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${readDotCls}`} />
              <span className="text-xs font-semibold text-gray-700">Analysis results</span>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${readOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {readOpen && (
            <div className="px-4 pb-4 space-y-4 pt-3">
              {readBad.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Problems ({readBad.length})</p>
                  <ul className="space-y-2">
                    {readBad.map(c => (
                      <li key={c.id} className="flex gap-2 items-start">
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-700">{c.label}:</span> {c.msg}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {readGood.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Good results ({readGood.length})</p>
                  <ul className="space-y-2">
                    {readGood.map(c => (
                      <li key={c.id} className="flex gap-2 items-start">
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-700">{c.label}:</span> {c.msg}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plainDesc.length < 50 && <p className="text-xs text-gray-400 italic">Add more content to get a full readability analysis.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}