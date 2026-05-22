'use strict';

/**
 * AWS Bedrock helper — shared by all modules that use AI.
 *
 * Priority: AWS Bedrock → OpenAI/Anthropic direct → null (graceful fallback).
 *
 * Required env vars for Bedrock:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (default: eu-west-1)
 *
 * Embedding model:  amazon.titan-embed-text-v2:0  (1024 dims)
 * Chat model:       anthropic.claude-sonnet-4-5-20250929-v1:0  (via Bedrock)
 *
 * IMPORTANT — Titan Embed V2 outputs 1024-dim vectors vs. OpenAI's 1536-dim.
 * If switching mid-project, all existing embeddings must be re-generated and
 * the pgvector column dimension updated.  The code below checks AWS_BEDROCK_EMBEDDINGS
 * env var so you can keep OpenAI embeddings while using Bedrock for chat.
 */

const { reportError } = require('../instrument');

// ── Lazy client singleton ────────────────────────────────────────────────────
let _client = null;

function getBedrockClient() {
  if (_client) return _client;
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;

  const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
  _client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'eu-west-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

/**
 * Check if Bedrock is available for a given capability.
 * @param {'embeddings'|'chat'} capability
 */
function isBedrockEnabled(capability) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return false;
  if (capability === 'embeddings') {
    // Opt-in: set AWS_BEDROCK_EMBEDDINGS=1 to switch embeddings to Titan.
    // Without this, embeddings keep using OpenAI to avoid dimension mismatch.
    return process.env.AWS_BEDROCK_EMBEDDINGS === '1';
  }
  // Chat/analysis defaults to Bedrock when AWS keys exist
  return true;
}

// ── Embedding via Titan Embed Text V2 ────────────────────────────────────────
const TITAN_EMBED_MODEL = process.env.AWS_EMBED_MODEL || 'amazon.titan-embed-text-v2:0';

/**
 * Single-text embedding via Bedrock Titan.
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
async function bedrockEmbed(text) {
  const client = getBedrockClient();
  if (!client || !text) return null;

  const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

  const command = new InvokeModelCommand({
    modelId: TITAN_EMBED_MODEL,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: text.slice(0, 8000),  // Titan V2 limit ~8K tokens
    }),
  });

  const response = await client.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body.embedding || null;
}

/**
 * Batch embedding — Titan doesn't support native batch, so we loop.
 * @param {string[]} texts
 * @returns {Promise<(number[]|null)[]>}
 */
async function bedrockEmbedBatch(texts) {
  const results = [];
  for (const t of texts) {
    try {
      results.push(await bedrockEmbed(t));
    } catch (err) {
      console.error('[bedrock] embed error:', err.message);
      results.push(null);
    }
  }
  return results;
}

// ── Chat (Claude on Bedrock) ─────────────────────────────────────────────────
const DEFAULT_CHAT_MODEL = process.env.AWS_CHAT_MODEL || 'anthropic.claude-sonnet-4-5-20250929-v1:0';

/**
 * Send a chat message to Claude on Bedrock.
 * @param {object} opts
 * @param {string}        opts.model       - Bedrock model ID (optional)
 * @param {number}        opts.maxTokens   - max_tokens (default 4000)
 * @param {string}        opts.system      - system prompt text
 * @param {Array}         opts.systemBlocks - system as array of {type,text} blocks (overrides opts.system)
 * @param {string}        opts.userMessage  - user message text
 * @returns {Promise<{text: string, usage: {input_tokens: number, output_tokens: number}}>}
 */
async function bedrockChat(opts) {
  const client = getBedrockClient();
  if (!client) throw new Error('Bedrock client not available');

  const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

  const modelId = opts.model || DEFAULT_CHAT_MODEL;

  // Bedrock Anthropic models accept the Messages API format directly
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: opts.maxTokens || 4000,
    messages: [{ role: 'user', content: opts.userMessage }],
  };

  // System prompt — can be string or structured blocks
  if (opts.systemBlocks) {
    payload.system = opts.systemBlocks;
  } else if (opts.system) {
    payload.system = opts.system;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));

  return {
    text: body.content?.[0]?.text || '',
    usage: body.usage || { input_tokens: 0, output_tokens: 0 },
  };
}

module.exports = {
  getBedrockClient,
  isBedrockEnabled,
  bedrockEmbed,
  bedrockEmbedBatch,
  bedrockChat,
  TITAN_EMBED_MODEL,
  DEFAULT_CHAT_MODEL,
};
