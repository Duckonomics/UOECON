import { DurableObject } from "cloudflare:workers";
import { PAPER_CONTENT } from "./paper-config.js";

const SESSION_LIMIT = 3;
const MAX_QUESTION_LENGTH = 1000;
const MAX_HISTORY_ANSWER_LENGTH = 4000;
const MAX_CONTEXT_CHARS = 18000;
const STOP_WORDS = new Set([
  "about", "after", "again", "also", "and", "are", "because", "before",
  "between", "could", "does", "from", "have", "into", "more", "paper",
  "that", "their", "there", "these", "they", "this", "through", "what",
  "when", "where", "which", "with", "would", "your"
]);

export class RateLimiter extends DurableObject {
  async reserve(limit) {
    const current = Number((await this.ctx.storage.get("count")) || 0);
    if (current >= limit) return { allowed: false, remaining: 0 };
    const next = current + 1;
    await this.ctx.storage.put("count", next);
    return { allowed: true, remaining: Math.max(0, limit - next) };
  }

  async release() {
    const current = Number((await this.ctx.storage.get("count")) || 0);
    const next = Math.max(0, current - 1);
    await this.ctx.storage.put("count", next);
    return next;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/chat") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    if (!env.OPENAI_API_KEY || !env.RATE_LIMIT_SALT) {
      return json({ error: "The interactive paper is not configured yet." }, 503);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }

    const question = String(payload.question || "").trim();
    const history = normalizeHistory(payload.history);
    const audience = ["researcher", "policy", "general"].includes(payload.audience)
      ? payload.audience
      : "researcher";
    if (!question || question.length > MAX_QUESTION_LENGTH) {
      return json({ error: `Questions must contain 1–${MAX_QUESTION_LENGTH} characters.` }, 400);
    }
    if (history.filter((item) => item.role === "user").length >= SESSION_LIMIT) {
      return json({ error: "This conversation has reached its three-question limit.", code: "session_limit" }, 429);
    }

    const dailyLimit = boundedInt(env.DAILY_QUESTION_LIMIT, 10, 1, 100);
    const monthlyCap = boundedInt(env.MONTHLY_REQUEST_CAP, 2500, 1, 1000000);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const month = day.slice(0, 7);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const visitorHash = await sha256(`${env.RATE_LIMIT_SALT}|${ip}|${day}`);

    const dailyStub = env.RATE_LIMITER.getByName(`daily:${day}:${visitorHash}`);
    const daily = await dailyStub.reserve(dailyLimit);
    if (!daily.allowed) {
      return json({
        error: "You have reached today's question limit.",
        code: "daily_limit",
        contact: env.CONTACT_EMAIL || "replace@uoregon.edu"
      }, 429);
    }

    const monthlyStub = env.RATE_LIMITER.getByName(`monthly:${month}`);
    const monthly = await monthlyStub.reserve(monthlyCap);
    if (!monthly.allowed) {
      await dailyStub.release();
      return json({
        error: "This interactive paper has reached its monthly usage limit. Please contact the authors.",
        code: "monthly_limit",
        contact: env.CONTACT_EMAIL || "replace@uoregon.edu"
      }, 503);
    }

    try {
      const paperRequest = new Request(new URL(PAPER_CONTENT.sourcePath, request.url));
      const paperResponse = await env.ASSETS.fetch(paperRequest);
      if (!paperResponse.ok) throw new Error("Paper source unavailable");
      const paper = await paperResponse.text();
      const context = retrieveContext(paper, question);
      const answer = await askOpenAI(env, question, history, context, audience);
      return json({
        answer,
        figure: selectMatch(PAPER_CONTENT.figures, question),
        table: selectMatch(PAPER_CONTENT.tables, question),
        remainingToday: daily.remaining,
        remainingInConversation: SESSION_LIMIT - history.filter((item) => item.role === "user").length - 1
      });
    } catch (error) {
      await Promise.allSettled([dailyStub.release(), monthlyStub.release()]);
      console.error(error);
      return json({ error: "The paper assistant is temporarily unavailable. Your question was not counted." }, 502);
    }
  }
};

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-6).flatMap((item) => {
    const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
    if (!role) return [];
    const limit = role === "assistant" ? MAX_HISTORY_ANSWER_LENGTH : MAX_QUESTION_LENGTH;
    const content = String(item.content || "").trim().slice(0, limit);
    return content ? [{ role, content }] : [];
  });
}

function retrieveContext(paper, question) {
  const terms = tokenize(question);
  const chunks = paper
    .split(/(?=^## |^### |^#### |^\[Page \d+)/m)
    .map((text, index) => ({ text: text.trim(), index }))
    .filter((item) => item.text.length > 40);

  for (const chunk of chunks) {
    const lower = chunk.text.toLowerCase();
    chunk.score = terms.reduce((score, term) => {
      const matches = lower.split(term).length - 1;
      return score + Math.min(matches, 8) * (term.length > 7 ? 3 : 1);
    }, 0);
    if (/figure|table|appendix/.test(question.toLowerCase()) && /figure|table|appendix/.test(lower)) {
      chunk.score += 3;
    }
  }

  const selected = chunks
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 7)
    .sort((a, b) => a.index - b.index);

  let context = "";
  for (const item of selected) {
    if (context.length + item.text.length > MAX_CONTEXT_CHARS) break;
    context += `\n\n--- SOURCE PASSAGE ---\n${item.text}`;
  }
  return `${PAPER_CONTENT.evidencePolicy}\n${context || paper.slice(0, MAX_CONTEXT_CHARS)}`;
}

function tokenize(text) {
  return [...new Set(
    text.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g)?.filter((word) => !STOP_WORDS.has(word)) || []
  )].slice(0, 20);
}

async function askOpenAI(env, question, history, context, audience) {
  const audienceInstruction = audience === "general"
    ? "Explain for an intelligent general reader. Minimize jargon and define necessary technical terms."
    : audience === "policy"
      ? "Explain for a policy or practice audience. Emphasize magnitudes, uncertainty, relevance, and limitations."
      : "Explain for a researcher. Include design, estimand, uncertainty, and robustness details when relevant.";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      max_output_tokens: 900,
      instructions: [
        `You are the interactive companion to the research paper ${env.PAPER_TITLE || "the supplied paper"} by ${env.PAPER_AUTHORS || "the listed authors"}.`,
        PAPER_CONTENT.evidencePolicy,
        audienceInstruction,
        "Use concise Markdown when helpful. Be concise but substantive."
      ].join(" "),
      input: [
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: `QUESTION:\n${question}\n\nRELEVANT PAPER PASSAGES:\n${context}` }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${JSON.stringify(data).slice(0, 500)}`);
  const text = (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("OpenAI returned no answer text");
  return text;
}

function selectMatch(items, question) {
  const item = (items || []).find((candidate) => candidate.match?.test(question));
  if (!item) return null;
  const { match, ...publicItem } = item;
  return publicItem;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

