"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AmazonSyncProps {
  bookId: number;
  initialPrice: number;
  initialStock: number;
  onSyncComplete?: () => void;
}
const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL;
const FRONTEND_JWT_SECRET = process.env.NEXT_PUBLIC_FRONTEND_JWT_SECRET || "default_fallback_secret";

async function generateLocalToken(secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { user_id: 1, session_id: "auto-generated-frontend-session", exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) };
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

export default function AmazonSyncButton({ bookId, initialPrice, initialStock, onSyncComplete }: AmazonSyncProps) {
  const [sellPrice, setSellPrice] = useState<number>(initialPrice || 0);
  const [stock, setStock] = useState<number>(initialStock || 1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleAmazonPush = async () => {
    if (sellPrice <= 0) {
      setStatus('error');
      setMessage('Valid price required.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);
      const response = await fetch(`${CRMSERVER_API_URL}/api/amazon/list_product/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sell_price: Number(sellPrice), stock: Number(stock), session_id: "admin_dash_" + Date.now() })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage('Success! Listed.');
        if (onSyncComplete) {
          setTimeout(() => { onSyncComplete(); }, 2500); 
        }
      } else {
        setStatus('error');
        // This will now catch the specific Amazon issue text sent from the backend fix
        setMessage(result.details || result.error || 'Failed to list.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Network error.');
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 bg-gray-50 p-2 rounded border border-gray-100 w-fit">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 uppercase font-bold">Price (₹)</label>
          <input 
            type="number" 
            value={sellPrice} 
            onChange={(e) => setSellPrice(parseFloat(e.target.value))}
            disabled={status === 'loading' || status === 'success'}
            className="w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 uppercase font-bold">Stock</label>
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(parseInt(e.target.value))}
            disabled={status === 'loading' || status === 'success'}
            className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div className="flex flex-col justify-end h-full pt-4">
          <button 
            onClick={handleAmazonPush} 
            disabled={status === 'loading' || status === 'success'}
            className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'success' ? 'Listed' : 'Push to Amazon'}
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`text-[11px] font-medium px-1 max-w-[300px] leading-tight ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </div>
      )}
    </div>
  );
}