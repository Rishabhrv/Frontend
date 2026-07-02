"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";

const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL;
const FRONTEND_JWT_SECRET = process.env.NEXT_PUBLIC_FRONTEND_JWT_SECRET || "default_fallback_secret";

async function generateLocalToken(secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    user_id: 1,
    session_id: "auto-generated-frontend-session",
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
  };
  const base64UrlEncode = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const head64 = base64UrlEncode(header);
  const pay64 = base64UrlEncode(payload);
  const data = `${head64}.${pay64}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sig64}`;
}

import { BROWSE_NODES } from "@/utils/browseNodes"

// ─── SMALL FORM PRIMITIVES (keeps every section visually consistent) ────────
const FieldInput = ({
  label,
  hint,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  mono = false,
  step,
  prefix,
}: {
  label: string;
  hint?: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  step?: string;
  prefix?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
      {label}
      {hint && <span className="text-slate-400 font-normal normal-case ml-1">{hint}</span>}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        className={`border border-slate-200 rounded-md ${prefix ? 'pl-6 pr-3' : 'px-2.5'} py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-full bg-white transition-colors ${mono ? 'font-mono' : ''}`}
      />
    </div>
  </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200">
    <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

// ─── INDIVIDUAL ROW COMPONENT WITH ACCORDION ─────────────────────────────────
const BookRow = ({ book, onSyncComplete }: { book: any, onSyncComplete: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // 👇 ── NEW: User Assignment States ── 👇
  const [activeUsers, setActiveUsers] = useState<{id: number, username: string}[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // ── AI States ──
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const aiSteps = [
    "🚀 Loading AI data...",
    "🧠 Analyzing book content...",
    "💻 Generating Title & SEO...",
    "📈 Assigning BISAC Codes...",
    "🚀 Finalizing Audience & Genres..."
  ];

  // ── Asset Fetching State ──
  const [hasFetchedAssets, setHasFetchedAssets] = useState(false);

  const isPending = book.amazon_pending == 1;

  // 👇 ── NEW: Fetch Active Users on mount ── 👇
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await generateLocalToken(FRONTEND_JWT_SECRET);
        const res = await fetch(`${CRMSERVER_API_URL}/api/active_users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setActiveUsers(json.data);
      } catch (err) {
        console.error("Failed to fetch active users", err);
      }
    };
    fetchUsers();
  }, []);

  const fetchAmazonAssets = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${book.book_id}/amazon-assets`);
      const json = await res.json();
      
      if (json.success) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        setFormData(prev => ({
          ...prev,
          title: json.data.title || prev.title,
          description: json.data.description || prev.description,
          sell_price: json.data.sell_price || prev.sell_price, // <-- Catch and set the sell_price here
          image_url: json.data.image_url ? `${API_URL}${json.data.image_url}` : prev.image_url,
          other_image_1: json.data.other_image_1 ? `${API_URL}${json.data.other_image_1}` : prev.other_image_1,
          other_image_2: json.data.other_image_2 ? `${API_URL}${json.data.other_image_2}` : prev.other_image_2,
          other_image_3: json.data.other_image_3 ? `${API_URL}${json.data.other_image_3}` : prev.other_image_3,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  }, [book.id]);

  useEffect(() => {
    if (isOpen && !hasFetchedAssets) {
      fetchAmazonAssets();
      setHasFetchedAssets(true); 
    }
  }, [isOpen, hasFetchedAssets, fetchAmazonAssets]);

  const [formData, setFormData] = useState({
    title: book.amazon_defaults?.title || book.title || "",
    isbn: book.isbn || "",
    authors: book.amazon_defaults?.authors || "Unknown Author",
    binding: "paperback",
    sell_price: book.amazon_defaults?.sell_price || book.book_mrp || 0,
    stock: book.amazon_defaults?.stock || book.agph_stock || book.temp_physical_count || 1,
    number_of_items: 1,
    pub_date: book.amazon_defaults?.pub_date || new Date().toISOString().split('T')[0],
    edition: book.amazon_defaults?.edition || "First Edition",
    language: "English",
    language_type: "original",
    pages: book.amazon_defaults?.pages || book.no_of_pages || 1,
    weight: book.amazon_defaults?.weight || 0.40,
    package_weight: 0.40,
    length: book.amazon_defaults?.length || 22.86,
    width: book.amazon_defaults?.width || 15.24,
    height: book.amazon_defaults?.height || 1.60,
    subject: book.subject || "Fiction",
    subject_code: "FIC000000",
    genre: "",
    subject_keyword: "",
    recommended_browse_nodes: book.amazon_defaults?.recommended_browse_nodes || "1318068031",
    target_audience: "",
    min_age: 17,
    max_age: 80,
    image_url: "",
    other_image_1: "",
    other_image_2: "",
    other_image_3: "",
    keywords: book.amazon_defaults?.keywords || book.tags || "",
    description: book.amazon_defaults?.description || book.about_book || "",
  });

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    let stepTimer: NodeJS.Timeout;

    if (isGeneratingAI) {
      countdownTimer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      stepTimer = setInterval(() => {
        setAiStepIndex((prev) => (prev < aiSteps.length - 1 ? prev + 1 : prev));
      }, 8000);
    } else {
      setAiStepIndex(0);
    }

    return () => {
      clearInterval(countdownTimer);
      clearInterval(stepTimer);
    };
  }, [isGeneratingAI, aiSteps.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "isbn") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/-/g, "") }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatAmazonTime = (dateString: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString; // Fallback if invalid
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

  const handleGenerateAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingAI(true);
    setTimeLeft(120);
    setStatus('idle');
    setMessage('');

    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);
      
      const res = await fetch(`${CRMSERVER_API_URL}/api/amazon/enhance_metadata`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setFormData(prev => ({
          ...prev,
          title: data.enhanced.new_title || prev.title,
          language: data.enhanced.language || prev.language,
          target_audience: data.enhanced.target_audience || prev.target_audience,
          subject: data.enhanced.primary_subject || prev.subject,
          subject_code: data.enhanced.bisac_code || prev.subject_code,
          genre: data.enhanced.genre || prev.genre,
          subject_keyword: data.enhanced.subject_keywords || prev.subject_keyword,
          keywords: data.enhanced.keywords || prev.keywords
        }));
        
        setStatus('idle');
        setMessage('AI has successfully enhanced your listing metadata!');
      } else {
        throw new Error(data.error || "AI Generation Failed");
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || "Failed to connect to the AI service.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAmazonPush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (formData.sell_price <= 0) {
      setStatus('error');
      setMessage('Valid price required.');
      setIsOpen(true);
      return;
    }

    // 👇 ── NEW: Validation for User ── 👇
    if (!selectedUserId) {
      setStatus('error');
      setMessage('Please assign a user.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);

      const payload = {
        ...formData,
        session_id: "admin_dash_" + Date.now()
      };

      const response = await fetch(`${CRMSERVER_API_URL}/api/amazon/list_product/${book.book_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 👇 ── NEW: Trigger Webhook ── 👇
        try {
          await fetch(`${CRMSERVER_API_URL}/api/amazon-store-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book_id: book.book_id,
              amazon_user_id: Number(selectedUserId),
              amazon_stock: Number(formData.stock),
              amazon_pending: 1 
            })
          });
        } catch (webhookErr) {
          console.error("Amazon Webhook failed to trigger", webhookErr);
        }

        setStatus('success');
        setMessage('Successfully pushed to Amazon!');
        setTimeout(() => { onSyncComplete(); }, 2500);
      } else {
        setStatus('error');
        setMessage(result.details || result.error || 'Failed to list.');
        setIsOpen(true); 
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Network error while connecting to the server.');
      setIsOpen(true);
    }
  };

  // Push button visual state is derived explicitly so the disabled/pending
  // look never relies on opacity fades (which made it unreadable before).
  const pushButtonClasses = isPending && status !== 'success'
    ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
    : status === 'success'
      ? 'bg-emerald-600 text-white cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${isPending ? 'border-l-amber-400' : 'border-l-blue-500'} rounded-lg overflow-hidden mb-4 transition-colors ${isOpen ? 'ring-1 ring-blue-200' : ''}`}>

      {/* ─── VISIBLE FLEX HEADER ─── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 w-1/2">
          <div className="h-10 w-9 flex-shrink-0 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-slate-500">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{formData.title || "Untitled Book"}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-3 flex-wrap">
              <span>ID: {book.book_id}</span>
              <span>ISBN: {formData.isbn || "Missing"}</span>
              {isPending && book.amazon_updated_at && (
                <span className="text-blue-700 bg-blue-50 font-sans px-1.5 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                  Uploaded at: {formatAmazonTime(book.amazon_updated_at)}
                </span>
              )}
            </p>
            
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {status === 'error' && <span className="text-[11px] text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded flex items-center gap-1 border border-rose-200"><AlertCircle className="w-3.5 h-3.5"/> Error</span>}
          {status === 'success' && <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> Success</span>}

          <div onClick={(e) => e.stopPropagation()}>
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={status === 'loading' || status === 'success' || isPending}
              className={`w-32 px-2 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 ${!selectedUserId && status === 'error' ? 'border-rose-300' : 'border-slate-200'}`}
            >
              <option value="" disabled>Assign User *</option>
              {activeUsers.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAmazonPush}
            disabled={status === 'loading' || status === 'success' || isPending}
            className={`min-w-[104px] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md flex items-center justify-center gap-2 transition-colors ${pushButtonClasses}`}
          >
            {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status === 'success' ? 'Listed' : (isPending ? 'Pending' : 'Push to Amazon')}
          </button>

          <div className="text-slate-400 p-1 border border-transparent rounded-md hover:bg-slate-100 hover:text-slate-600 transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* ─── EXPANDABLE ACCORDION BODY ─── */}
      {isOpen && (
        <fieldset disabled={isGeneratingAI} className={`border-t border-slate-200 bg-slate-50 p-4 space-y-4 ${isGeneratingAI ? "opacity-60 pointer-events-none transition-opacity duration-300" : ""}`}>
          
          {/* ─── AI ENHANCEMENT BUTTON BAR ─── */}
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800">AI Metadata Optimization</h4>
              <p className="text-xs text-slate-500">Auto-fill Title, SEO, Audience, and BISAC categories based on the description.</p>
            </div>
            
            {isGeneratingAI ? (
              <div className="flex gap-2 items-center text-xs text-blue-700 font-medium px-3 py-1.5 pointer-events-auto">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-medium">
                  {aiSteps[aiStepIndex]} {formatTime(timeLeft)}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateAI}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors pointer-events-auto uppercase tracking-wide"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Enhance Listing
              </button>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-md text-xs font-semibold border ${status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {message}
            </div>
          )}

          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
  
  {/* Section 7: Images (Left Side - Takes 1/3) */}
  <div className="lg:col-span-1">
    <SectionCard title="Images">
      <div className="flex flex-col gap-5 items-center">
        {/* Main Image */}
        <div className=" mt-3 w-full sm:w-2/3 md:w-1/2">
          <ImagePreviewInput 
            label="Main Image URL" 
            name="image_url" 
            value={formData.image_url} 
            onChange={handleChange} 
            isMain={true}
          />
        </div>

        {/* Thumbnail Row */}
        <div className=" mt-3 mb-3 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <ImagePreviewInput 
            label="Other Image 1" 
            name="other_image_1" 
            value={formData.other_image_1} 
            onChange={handleChange} 
          />
          <ImagePreviewInput 
            label="Other Image 2" 
            name="other_image_2" 
            value={formData.other_image_2} 
            onChange={handleChange} 
          />
          <ImagePreviewInput 
            label="Other Image 3" 
            name="other_image_3" 
            value={formData.other_image_3} 
            onChange={handleChange} 
          />
        </div>
      </div>
    </SectionCard>
  </div>

  {/* Section 1: Core Information (Right Side - Takes 2/3) */}
  <div className="lg:col-span-2 space-y-4">
    <SectionCard title="Core Information">
      <FieldInput label="Full Title" name="title" value={formData.title} onChange={handleChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FieldInput label="ISBN" name="isbn" value={formData.isbn} onChange={handleChange} mono />
        <FieldInput label="Authors" hint="(comma separated)" name="authors" value={formData.authors} onChange={handleChange} />
      </div>
      <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Binding</label>
                  <select
                    name="binding"
                    value={formData.binding}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-full bg-white text-slate-700"
                  >
                    <option value="paperback">Paperback</option>
                    <option value="hardcover">Hardcover</option>
                  </select>
                </div>
    </SectionCard>

      {/* Section 2: Pricing & Inventory */}
            <SectionCard title="Pricing & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldInput label="Sell Price" type="number" name="sell_price" value={formData.sell_price} onChange={handleChange} />
                <FieldInput label="Stock" type="number" name="stock" value={formData.stock} onChange={handleChange} />
                <FieldInput label="No. of Items" type="number" name="number_of_items" value={formData.number_of_items} onChange={handleChange} />
              </div>
            </SectionCard>

             {/* Section 4: Physical Dimensions */}
            <SectionCard title="Physical Dimensions">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FieldInput label="Weight (kg)" type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} />
                <FieldInput label="Package Weight (kg)" type="number" step="0.01" name="package_weight" value={formData.package_weight} onChange={handleChange} />
                <FieldInput label="Length (cm)" type="number" step="0.01" name="length" value={formData.length} onChange={handleChange} />
                <FieldInput label="Width (cm)" type="number" step="0.01" name="width" value={formData.width} onChange={handleChange} />
                <FieldInput label="Height (cm)" type="number" step="0.01" name="height" value={formData.height} onChange={handleChange} />
              </div>
            </SectionCard>
  </div>
  
</div>
        

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          

            {/* Section 3: Publication Details */}
            <SectionCard title="Publication Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="Pub Date" hint="(YYYY-MM-DD)" name="pub_date" value={formData.pub_date} onChange={handleChange} />
                <FieldInput label="Edition" name="edition" value={formData.edition} onChange={handleChange} />
                <FieldInput label="Language" name="language" value={formData.language} onChange={handleChange} />
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Language Type</label>
                  <select
                    name="language_type"
                    value={formData.language_type}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-full bg-white text-slate-700"
                  >
                    <option value="original">Original Language</option>
                    <option value="published">Published</option>
                    <option value="spoken">Spoken</option>
                    <option value="subtitled">Subtitled</option>
                    <option value="translation">Translation</option>
                  </select>
                </div>
                <FieldInput label="Pages" type="number" name="pages" value={formData.pages} onChange={handleChange} />
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            

            {/* Section 5: Category & Classification */}
            <SectionCard title="Category & Classification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="Primary Subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g., Fiction" />
                <FieldInput label="BISAC Subject Code" name="subject_code" value={formData.subject_code} onChange={handleChange} mono placeholder="e.g., FIC000000" />
                <FieldInput label="Genre" hint="(e.g., Sports, Biography)" name="genre" value={formData.genre} onChange={handleChange} placeholder="Comma separated" />
                <FieldInput label="Subject Keywords" hint="(e.g., History, Science)" name="subject_keyword" value={formData.subject_keyword} onChange={handleChange} placeholder="Comma separated" />
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Browse Node ID</label>
                <select
                  name="recommended_browse_nodes"
                  value={formData.recommended_browse_nodes}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-full bg-white text-slate-700"
                >
                  <option value="" disabled>Select a category...</option>
                  {BROWSE_NODES.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Section 6: Audience & Targeting */}
            <SectionCard title="Audience & Targeting">
              <FieldInput 
                label="Target Audience" 
                hint="(comma separated, max 5. e.g., Tweens, Academics, Professionals)" 
                name="target_audience" 
                value={formData.target_audience} 
                onChange={handleChange} 
                placeholder="e.g., Tweens, Students, Academics" 
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FieldInput label="Min Reading Age" type="number" name="min_age" value={formData.min_age} onChange={handleChange} />
                <FieldInput label="Max Reading Age" type="number" name="max_age" value={formData.max_age} onChange={handleChange} />
              </div>
            </SectionCard>

          </div>

          {/* Section 8: Content & Description */}
          <SectionCard title="Content & Description">
            <FieldInput label="Keywords" hint="(comma separated, max 5)" name="keywords" value={formData.keywords} onChange={handleChange} />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Product Description (HTML supported)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-full resize-y font-mono text-[13px] bg-white text-slate-800"
              />
            </div>
          </SectionCard>

          {/* Fixed Amazon Settings */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wide text-[11px]"><Info className="w-3.5 h-3.5 text-slate-400"/> Fixed Amazon Settings</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div><strong className="text-slate-700 block">Tax Code:</strong> A_GEN_PEAK680</div>
              <div><strong className="text-slate-700 block">HSN Code:</strong> 4901</div>
              <div><strong className="text-slate-700 block">Condition:</strong> new_new</div>
              <div><strong className="text-slate-700 block">Publisher</strong> AGPH BOOKS</div>
              <div><strong className="text-slate-700 block">Origin:</strong> IN</div>
              <div><strong className="text-slate-700 block">Lead Time:</strong> 2 Days</div>
              <div><strong className="text-slate-700 block">Item Type:</strong> Book</div>
              <div><strong className="text-slate-700 block">Dangerous Goods:</strong> Not Applicable</div>
            </div>
          </div>

        </fieldset>
      )}
    </div>
  );
};



// ─── MAIN TABLE / LIST COMPONENT ─────────────────────────────────────────────
export default function AmazonProductTable() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPendingBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);
      // NOTE: Pointed at the newly created API endpoint from the previous step
      const res = await fetch(`${CRMSERVER_API_URL}/api/amazon/pending_books`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch pending books");
      const json = await res.json();
      setBooks(json.status === "success" ? (json.data || []) : []);
    } catch (error) {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPendingBooks(); }, [fetchPendingBooks]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim().toLowerCase());
  };

  const filteredBooks = books.filter(b => (!searchQuery || b.title?.toLowerCase().includes(searchQuery)));
  const total = filteredBooks.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const visibleBooks = filteredBooks.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-6 sm:p-8 w-full mx-auto min-h-screen">

      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Amazon SP-API Linker</h1>
          <p className="text-sm text-slate-500 mt-1">Review metadata and publish unlisted titles directly to Amazon.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search titles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 bg-white transition-colors"
            />
          </div>
          <button type="submit" className="rounded-md px-3.5 py-1.5 text-sm bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-col">
  {loading ? (
    <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
      <p className="font-medium text-sm text-slate-500">Fetching eligible books from database...</p>
    </div>
  ) : visibleBooks.length === 0 ? (
    <div className="py-20 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-7 h-7 text-slate-400" />
      </div>
      <p className="font-semibold text-base text-slate-900">All caught up!</p>
      <p className="text-sm mt-1">No pending books found matching your criteria.</p>
    </div>
  ) : (
    <div className="space-y-6">

         {/* ── 👇 SECTION 1: NORMAL / AVAILABLE BOOKS ── */}
      {visibleBooks.filter(b => b.amazon_pending != 1).length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Ready to Push ({visibleBooks.filter(b => b.amazon_pending != 1).length})
          </h2>
          {visibleBooks
            .filter(b => b.amazon_pending != 1)
            .map((book) => (
              <BookRow key={book.book_id} book={book} onSyncComplete={fetchPendingBooks} />
            ))}
        </div>
      )}
      {/* ── 👇 SECTION 2: PENDING BOOKS ── */}
      {visibleBooks.filter(b => b.amazon_pending == 1).length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Amazon ({visibleBooks.filter(b => b.amazon_pending == 1).length})
          </h2>
          {visibleBooks
            .filter(b => b.amazon_pending == 1)
            .map((book) => (
              <BookRow key={book.book_id} book={book} onSyncComplete={fetchPendingBooks} />
            ))}
        </div>
      )}

   
    </div>
  )}
</div>

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 gap-4">
          <div>Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> listings</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3.5 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors text-slate-600">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3.5 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors text-slate-600">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}


const ImagePreviewInput = ({
  label,
  name,
  value,
  onChange,
  isMain = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMain?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Track the specific URL that failed so we don't get stuck in a loop
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Check if the current value is the one that failed
  const hasError = value && failedUrl === value;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      
      {!isEditing ? (
        <div
          className={`relative cursor-pointer border-2 ${
            hasError ? 'border-rose-300 bg-rose-50' : 'border-dashed border-slate-300 bg-slate-50'
          } hover:border-blue-400 rounded-md overflow-hidden transition-colors flex items-center justify-center group ${
            isMain ? 'aspect-[3/4] w-full max-w-sm mx-auto' : 'aspect-[3/4] w-full'
          }`}
          onClick={() => setIsEditing(true)}
        >
          {value && !hasError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={value} 
              alt={label} 
              className="object-contain w-full h-full"
              onError={() => {
                // Instead of flipping to edit mode, we just mark this URL as failed
                setFailedUrl(value);
              }}
            />
          ) : (
            // Placeholder when no URL is provided OR when URL failed to load
            <div className={`flex flex-col items-center justify-center transition-colors px-2 text-center ${
              hasError ? 'text-rose-400 group-hover:text-rose-500' : 'text-slate-300 group-hover:text-blue-400'
            }`}>
              {hasError ? (
                <>
                  <AlertCircle className="w-7 h-7 mb-1.5 opacity-60" />
                  <span className="text-[11px] font-medium leading-tight">Invalid URL</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-7 h-7 mb-1.5 opacity-50" />
                  <span className="text-[11px] font-medium leading-tight">Click to add</span>
                </>
              )}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-[11px] font-semibold bg-slate-900/60 px-2.5 py-1 rounded-full backdrop-blur-sm text-center">
              {value ? "Click to edit URL" : "Add Image URL"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder="https://..."
            autoFocus
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditing(false);
            }}
            className={`border ${
              hasError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
            } rounded-md px-2.5 py-1.5 text-sm focus:ring-1 outline-none w-full bg-white transition-colors text-slate-800`}
          />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[11px] text-blue-600 font-semibold uppercase tracking-wide hover:underline self-start"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};