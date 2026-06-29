"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from "lucide-react";

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

// ─── INDIVIDUAL ROW COMPONENT WITH ACCORDION ─────────────────────────────────
const BookRow = ({ book, onSyncComplete }: { book: any, onSyncComplete: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // We map EVERY editable field sent to Amazon into this state
  const [formData, setFormData] = useState({
    title: book.amazon_defaults?.title || book.title || "",
    isbn: book.isbn || "",
    authors: book.amazon_defaults?.authors || "Unknown Author",
    publisher: book.amazon_defaults?.publisher || book.publisher || "AG Publishing House",
    
    sell_price: book.amazon_defaults?.sell_price || book.book_mrp || 0,
    stock: book.amazon_defaults?.stock || book.agph_stock || book.temp_physical_count || 1,
    
    pages: book.amazon_defaults?.pages || book.no_of_pages || 1,
    weight: book.amazon_defaults?.weight || 0.40,
    length: book.amazon_defaults?.length || 22.86,
    width: book.amazon_defaults?.width || 15.24,
    height: book.amazon_defaults?.height || 1.60,
    
    pub_date: book.amazon_defaults?.pub_date || new Date().toISOString().split('T')[0],
    edition: book.amazon_defaults?.edition || "First Edition",
    language: book.amazon_defaults?.language || "english",
    language_type: "original", // Added

    recommended_browse_nodes: book.amazon_defaults?.recommended_browse_nodes || "1318068031",
    
    keywords: book.amazon_defaults?.keywords || book.tags || "",
    description: book.amazon_defaults?.description || book.about_book || "",
    image_url: "", 
    other_image_1: "", 
    other_image_2: "", 
    other_image_3: "",
    target_audience: "",
    number_of_items: 1,
    subject_keyword: "",
    min_age: 17, 
    max_age: 80,
    genre: "",
    subject_code: "FIC000000",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "isbn") {
      setFormData(prev => ({ ...prev, [name]: value.replace(/-/g, "") }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
        setStatus('success');
        setMessage('Successfully pushed to Amazon!');
        setTimeout(() => { onSyncComplete(); }, 2500);
      } else {
        setStatus('error');
        setMessage(result.details || result.error || 'Failed to list.');
        setIsOpen(true); // Open the accordion so they can see the error
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Network error while connecting to the server.');
      setIsOpen(true);
    }
  };

  return (
    <div className={`bg-white border transition-all duration-200 overflow-hidden mb-3 shadow-sm ${isOpen ? 'border-blue-300 ring-1 ring-blue-100 rounded-lg' : 'border-gray-200 rounded-lg'}`}>
      
      {/* ─── VISIBLE FLEX HEADER ─── */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4 w-1/2">
          <div className="h-12 w-10 flex-shrink-0 bg-blue-100 border border-blue-200 rounded flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{formData.title || "Untitled Book"}</h3>
            <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-3">
              <span>ID: {book.book_id}</span>
              <span>ISBN: {formData.isbn || "Missing"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {status === 'error' && <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Error</span>}
          {status === 'success' && <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Listed</span>}
          
          <button 
            onClick={handleAmazonPush} 
            disabled={status === 'loading' || status === 'success'}
            className="px-5 py-2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wide rounded hover:bg-orange-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'success' ? 'Listed' : 'Push to Amazon'}
          </button>

          <div className="text-gray-400 p-1 border border-transparent rounded hover:bg-gray-100 hover:border-gray-200">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* ─── EXPANDABLE ACCORDION BODY ─── */}
      {isOpen && (
        <div className="border-t border-blue-100 bg-slate-50/50 p-5">
          
          {/* Main Editable Form Grid */}
          <div className="py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            
            {/* Group 1: Core Identifiers */}
            <div className="xl:col-span-2 space-y-4 bg-white p-4 rounded border border-gray-100 shadow-sm">
              <h4 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-3">Core Information</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow font-mono"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Authors (Comma separated)</label>
                  <input type="text" name="authors" value={formData.authors} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Publisher / Brand</label>
                <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
              </div>
            </div>

            {/* Group 2: Pricing, Stock, & Specifics */}
            <div className="xl:col-span-2 space-y-4 bg-white p-4 rounded border border-gray-100 shadow-sm grid grid-cols-2 gap-x-4 gap-y-0 content-start">
              <h4 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-3 col-span-2">Pricing & Logistics</h4>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Sell Price (INR) & MRP</label>
                <div className="relative">
                  <input type="number" name="sell_price" value={formData.sell_price} onChange={handleChange} className="border border-gray-300 rounded pl-7 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Inventory Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Pub Date (YYYY-MM-DD)</label>
                <input type="text" name="pub_date" value={formData.pub_date} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition-shadow"/>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Language</label>
              <input 
                type="text" 
                name="language" 
                value={formData.language} 
                onChange={handleChange} 
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Language Type</label>
              <select 
                name="language_type" 
                value={formData.language_type} 
                onChange={handleChange} 
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
              >
                <option value="original">Original Language</option>
                <option value="published">Published</option>
                <option value="spoken">Spoken</option>
                <option value="subtitled">Subtitled</option>
                <option value="translation">Translation</option>
              </select>
            </div>
            </div>

            {/* Group 3: Physical Dimensions */}
            <div className="xl:col-span-2 space-y-4 bg-white p-4 rounded border border-gray-100 shadow-sm grid grid-cols-3 gap-x-4 gap-y-0 content-start">
              <h4 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-3 col-span-3">Physical Dimensions</h4>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Pages</label>
                <input type="number" name="pages" value={formData.pages} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Edition</label>
                <input type="text" name="edition" value={formData.edition} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Weight (kg)</label>
                <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Length (cm)</label>
                <input type="number" step="0.01" name="length" value={formData.length} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Width (cm)</label>
                <input type="number" step="0.01" name="width" value={formData.width} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Height (cm)</label>
                <input type="number" step="0.01" name="height" value={formData.height} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>
            </div>

            {/* Group 4: Discoverability */}
            <div className="xl:col-span-2 space-y-4 bg-white p-4 rounded border border-gray-100 shadow-sm flex flex-col">
              <h4 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-1">Content & Discoverability</h4>
              
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Keywords (Comma separated, Max 5)</label>
                <input type="text" name="keywords" value={formData.keywords} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
              </div>



              <div className="flex flex-col gap-1.5  shrink-0">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Browse Node ID</label>
                  <select 
                    name="recommended_browse_nodes" 
                    value={formData.recommended_browse_nodes} 
                    onChange={handleChange} 
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white text-gray-700"
                  >
                    <option value="" disabled>Select a category...</option>
                    {BROWSE_NODES.map((node) => (
                      <option key={node.id} value={node.id}>
                        {/* This now displays ID first, then Name */}
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Main Image URL</label>
                <input type="text" name="image_url" value={formData.image_url} placeholder="https://..." onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full text-blue-600"/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="text" name="other_image_1" value={formData.other_image_1} placeholder="Other Image 1 URL" onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
                  <input type="text" name="other_image_2" value={formData.other_image_2} placeholder="Other Image 2 URL" onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
                  <input type="text" name="other_image_3" value={formData.other_image_3} placeholder="Other Image 3 URL" onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"/>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Description (HTML Supported)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full resize-y font-mono text-[13px]"/>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 space-y-4 bg-white p-4 rounded border border-gray-100 shadow-sm flex flex-col my-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Target Audience</label>
                <input 
                  type="text" 
                  name="target_audience" 
                  value={formData.target_audience} 
                  placeholder="e.g., Tweens, Students, Academics"
                  onChange={handleChange} 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Number of Items</label>
              <input type="number" name="number_of_items" value={formData.number_of_items} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"/>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Subject Keywords 
                    <span className="text-gray-400 font-normal ml-1">(e.g., Education, History, Science)</span>
                </label>
                <input 
                  type="text" 
                  name="subject_keyword" 
                  value={formData.subject_keyword} 
                  placeholder="Enter keywords separated by commas"
                  onChange={handleChange} 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
                />
              </div>

              <div className="flex gap-5">
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Min Reading Age</label>
                  <input type="number" name="min_age" value={formData.min_age} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"/>
                </div>
    
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Max Reading Age</label>
                  <input type="number" name="max_age" value={formData.max_age} onChange={handleChange} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"/>
                </div>
              </div>


              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Genre
                    <span className="text-gray-400 font-normal ml-1">(e.g., Fiction, Sports, Biography)</span>
                </label>
                <input 
                  type="text" 
                  name="genre" 
                  value={formData.genre} 
                  placeholder="Enter genres separated by commas"
                  onChange={handleChange} 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    BISAC Subject Code
                </label>
                <input 
                  type="text" 
                  name="subject_code" 
                  value={formData.subject_code} 
                  placeholder="e.g., FIC000000"
                  onChange={handleChange} 
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white font-mono"
                />
              </div>
          </div>

          {/* Hardcoded Settings Info Box */}
          <div className="mx-5 mb-5 p-4 rounded bg-blue-50/50 border border-blue-100 text-xs text-gray-600 mt-5">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide"><Info className="w-3.5 h-3.5"/> Fixed Amazon Settings</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div><strong className="text-gray-700 block">Tax Code:</strong> A_GEN_PEAK680</div>
              <div><strong className="text-gray-700 block">HSN Code:</strong> 4901</div>
              <div><strong className="text-gray-700 block">Condition:</strong> new_new</div>
              <div><strong className="text-gray-700 block">Binding:</strong> Paperback</div>
              <div><strong className="text-gray-700 block">Origin:</strong> IN</div>
              <div><strong className="text-gray-700 block">Lead Time:</strong> 2 Days</div>
              <div><strong className="text-gray-700 block">Item Type:</strong> Book</div>
              <div><strong className="text-gray-700 block">Dangerous Goods:</strong> Not Applicable</div>
            </div>
          </div>

          {message && (
            <div className={`mx-5 mb-5 p-4 rounded text-sm font-semibold border ${status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {message}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

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
    <div className="p-10 w-full mx-auto min-h-screen">
      
      <div className="mb-8  flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Amazon SP-API Linker</h1>
          <p className="text-sm text-gray-500 mt-1.5">Review metadata and publish unlisted titles directly to Amazon.</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search titles..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72 shadow-sm transition-all" 
            />
          </div>
          <button type="submit" className="rounded-lg px-4 py-2 shadow-sm bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-col">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
            <p className="font-medium text-base">Fetching eligible books from database...</p>
          </div>
        ) : visibleBooks.length === 0 ? (
          <div className="py-32 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-lg text-gray-900">All caught up!</p>
            <p className="text-sm mt-1">No pending books found matching your criteria.</p>
          </div>
        ) : (
          visibleBooks.map((book) => (
            <BookRow key={book.book_id} book={book} onSyncComplete={fetchPendingBooks} />
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 bg-white p-5 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div>Showing <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-gray-900">{total}</span> listings</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}