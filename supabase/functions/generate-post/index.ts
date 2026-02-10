import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { inputText, inputImageUrl, feedback } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert social media content creator for Telegram groups. Create engaging, well-structured posts.
Rules:
- Use emojis strategically but don't overdo it
- Keep paragraphs short and punchy
- Include a compelling hook in the first line
- Add relevant hashtags at the end
- Format for Telegram (use bold with **, italics with __)
- Keep it concise but impactful
${feedback ? `\nThe user wants these improvements: ${feedback}` : ''}`
      }
    ];

    if (inputImageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: inputText || "Create an engaging Telegram post based on this image." },
          { type: "image_url", image_url: { url: inputImageUrl } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Create an engaging Telegram post about: ${inputText}`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const generatedPost = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ generatedPost }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
