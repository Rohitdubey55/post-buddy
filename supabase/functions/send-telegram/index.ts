import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { chatId, postText, posterUrl, action } = await req.json();
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const baseUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    if (action === 'getUpdates') {
      // Get recent chats/groups the bot is in
      const res = await fetch(`${baseUrl}/getUpdates?limit=100`);
      const data = await res.json();
      
      // Extract unique chats
      const chats = new Map();
      for (const update of data.result || []) {
        const chat = update.message?.chat || update.my_chat_member?.chat;
        if (chat && (chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel')) {
          chats.set(chat.id, { id: chat.id, title: chat.title, type: chat.type });
        }
      }

      return new Response(JSON.stringify({ chats: Array.from(chats.values()) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chatId) throw new Error("chatId is required");

    // Send poster image first if available
    if (posterUrl) {
      const photoRes = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: posterUrl,
          caption: postText,
          parse_mode: 'Markdown',
        }),
      });
      const photoData = await photoRes.json();
      if (!photoData.ok) throw new Error(`Telegram error: ${photoData.description}`);
    } else {
      // Send text-only post
      const msgRes = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: postText,
          parse_mode: 'Markdown',
        }),
      });
      const msgData = await msgRes.json();
      if (!msgData.ok) throw new Error(`Telegram error: ${msgData.description}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-telegram error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
