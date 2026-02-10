import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const update = await req.json();
    console.log("Telegram update:", JSON.stringify(update));

    const message = update.message;
    if (!message?.text) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const baseUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const sendMessage = async (text: string, replyToId?: number) => {
      await fetch(`${baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
          ...(replyToId && { reply_to_message_id: replyToId }),
        }),
      });
    };

    // Handle /start command
    if (text === "/start") {
      await sendMessage(
        "👋 *Welcome to TelePost Bot!*\n\n" +
        "I can generate engaging posts for your group.\n\n" +
        "Commands:\n" +
        "📝 `/newpost <topic>` — Generate a new post\n" +
        "✅ `/approve` — Approve the latest draft\n" +
        "✏️ `/revise <feedback>` — Revise with feedback\n" +
        "🖼 `/poster` — Generate a poster for approved post\n" +
        "📤 `/publish` — Publish the approved post here\n" +
        "📋 `/status` — Check current draft status"
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /newpost command
    if (text.startsWith("/newpost")) {
      const topic = text.replace("/newpost", "").trim();
      if (!topic) {
        await sendMessage("⚠️ Please provide a topic: `/newpost your topic here`");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage("⏳ Generating your post...");

      // Call generate-post function
      const genRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ inputText: topic }),
      });

      const genData = await genRes.json();
      if (genData.error) {
        await sendMessage(`❌ Error: ${genData.error}`);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Save to database
      const { data: post, error: dbError } = await supabase
        .from("posts")
        .insert({
          input_text: topic,
          generated_post: genData.generatedPost,
          post_status: "draft",
          telegram_group_id: String(chatId),
        })
        .select()
        .single();

      if (dbError) {
        console.error("DB error:", dbError);
        await sendMessage("❌ Failed to save draft.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage(
        `✨ *Draft Generated:*\n\n${genData.generatedPost}\n\n` +
        `---\n` +
        `✅ \`/approve\` to approve\n` +
        `✏️ \`/revise your feedback\` to revise`
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /approve command
    if (text === "/approve") {
      const { data: post } = await supabase
        .from("posts")
        .select()
        .eq("telegram_group_id", String(chatId))
        .eq("post_status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!post) {
        await sendMessage("⚠️ No draft found. Use `/newpost <topic>` to create one.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await supabase
        .from("posts")
        .update({ post_status: "post_approved" })
        .eq("id", post.id);

      await sendMessage(
        "✅ *Post approved!*\n\n" +
        "🖼 `/poster` — Generate a poster image\n" +
        "📤 `/publish` — Publish text-only now"
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /revise command
    if (text.startsWith("/revise")) {
      const feedback = text.replace("/revise", "").trim();
      if (!feedback) {
        await sendMessage("⚠️ Please provide feedback: `/revise make it more casual`");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const { data: post } = await supabase
        .from("posts")
        .select()
        .eq("telegram_group_id", String(chatId))
        .eq("post_status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!post) {
        await sendMessage("⚠️ No draft to revise. Use `/newpost <topic>` first.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage("⏳ Revising your post...");

      const genRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ inputText: post.input_text, feedback }),
      });

      const genData = await genRes.json();
      if (genData.error) {
        await sendMessage(`❌ Error: ${genData.error}`);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await supabase
        .from("posts")
        .update({ generated_post: genData.generatedPost, feedback })
        .eq("id", post.id);

      await sendMessage(
        `✨ *Revised Draft:*\n\n${genData.generatedPost}\n\n` +
        `---\n` +
        `✅ \`/approve\` to approve\n` +
        `✏️ \`/revise your feedback\` to revise again`
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /poster command
    if (text === "/poster") {
      const { data: post } = await supabase
        .from("posts")
        .select()
        .eq("telegram_group_id", String(chatId))
        .in("post_status", ["post_approved", "poster_approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!post) {
        await sendMessage("⚠️ No approved post found. Approve a draft first with `/approve`.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage("🎨 Generating poster... this may take a moment.");

      const posterRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-poster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ postText: post.generated_post, postId: post.id }),
      });

      const posterData = await posterRes.json();
      if (posterData.error) {
        await sendMessage(`❌ Error generating poster: ${posterData.error}`);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await supabase
        .from("posts")
        .update({ poster_image_url: posterData.posterUrl, post_status: "poster_approved" })
        .eq("id", post.id);

      // Send the poster image
      await fetch(`${baseUrl}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: posterData.posterUrl,
          caption: "🖼 *Your poster is ready!*\n\n📤 `/publish` to post with this poster",
          parse_mode: "Markdown",
        }),
      });

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /publish command
    if (text === "/publish") {
      const { data: post } = await supabase
        .from("posts")
        .select()
        .eq("telegram_group_id", String(chatId))
        .in("post_status", ["post_approved", "poster_approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!post) {
        await sendMessage("⚠️ No approved post to publish. Create and approve one first.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Publish using send-telegram
      const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-telegram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          chatId: chatId,
          postText: post.generated_post,
          posterUrl: post.poster_image_url,
        }),
      });

      const sendData = await sendRes.json();
      if (sendData.error) {
        await sendMessage(`❌ Failed to publish: ${sendData.error}`);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await supabase
        .from("posts")
        .update({ post_status: "posted" })
        .eq("id", post.id);

      await sendMessage("🎉 *Post published successfully!*");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle /status command
    if (text === "/status") {
      const { data: post } = await supabase
        .from("posts")
        .select()
        .eq("telegram_group_id", String(chatId))
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!post) {
        await sendMessage("📋 No posts yet. Use `/newpost <topic>` to get started!");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const statusEmoji: Record<string, string> = {
        draft: "📝",
        post_approved: "✅",
        poster_approved: "🖼",
        posted: "📤",
      };

      await sendMessage(
        `📋 *Latest Post Status:*\n\n` +
        `${statusEmoji[post.post_status] || "❓"} Status: \`${post.post_status}\`\n` +
        `📅 Created: ${new Date(post.created_at).toLocaleString()}\n` +
        `${post.poster_image_url ? "🖼 Poster: Ready" : "🖼 Poster: Not generated"}`
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Unknown command - ignore non-command messages
    if (text.startsWith("/")) {
      await sendMessage("❓ Unknown command. Send `/start` to see available commands.");
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error("telegram-webhook error:", e);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
