'use strict';

const { z } = require('zod');

function cleanString(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function optionalCleanString(max) {
  return z.preprocess((value) => {
    const cleaned = cleanString(value);
    return cleaned ? cleaned : undefined;
  }, z.string().max(max).optional());
}

function optionalUrl(max = 300) {
  return z.preprocess((value) => {
    const cleaned = cleanString(value);
    if (!cleaned) return undefined;
    const normalized = /^[a-z]+:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    return normalized;
  }, z.string().url().max(max).optional());
}

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.preprocess((v) => cleanString(v), z.string().min(32).max(256)),
  password: z.string()
    .min(10, 'Parola trebuie să aibă minimum 10 caractere')
    .max(128)
    .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
    .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
    .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră'),
});

const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(10, 'Parola trebuie să aibă minimum 10 caractere')
    .max(128)
    .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
    .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
    .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră'),
  firstName: z.preprocess((v) => cleanString(v), z.string().min(2).max(100)),
  lastName: z.preprocess((v) => cleanString(v), z.string().min(2).max(100)),
  role: optionalCleanString(60),
  startupName: optionalCleanString(140),
  website: optionalUrl(300),
  pitch: optionalCleanString(4000),
  sector: optionalCleanString(80),
  stage: optionalCleanString(80),
  trl: z.coerce.number().int().min(1).max(9).optional(),
  country: optionalCleanString(80),
  teamSize: optionalCleanString(80),
  github: optionalUrl(300),
  goals: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  amountIdx: z.coerce.number().int().min(0).max(5).optional(),
  horizon: optionalCleanString(80),
  priority: optionalCleanString(120),
});

const profileSchema = registerSchema.omit({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

const newsletterSchema = z.object({
  email: emailSchema,
  context: z.preprocess((v) => cleanString(v || 'page').slice(0, 32), z.string().min(1).max(32)),
});

const pipelineSchema = z.object({
  grantId: optionalCleanString(80),
  grantName: optionalCleanString(200),
  stage: z.preprocess((v) => cleanString(v || 'research').toLowerCase(), z.enum(['research', 'drafting', 'submitted', 'won', 'archived']).default('research')),
  notes: optionalCleanString(2000),
  deadline: z.preprocess((v) => {
    const cleaned = cleanString(v);
    return cleaned || undefined;
  }, z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())),
});

const commentSchema = z.object({
  content_type: z.enum(['grant', 'blog_post', 'news_article']),
  content_id: z.preprocess((v) => cleanString(v), z.string().min(1).max(120)),
  body: z.preprocess((v) => cleanString(v), z.string().min(1).max(5000)),
});

const reactionSchema = z.object({
  content_type: z.enum(['grant', 'blog_post', 'news_article']),
  content_id: z.preprocess((v) => cleanString(v), z.string().min(1).max(120)),
});

const feedbackSchema = z.object({
  rating: z.enum(['yes', 'no', 'unsure']),
  funding_type_interest: z.enum(['grant', 'accelerator', 'investor', 'credit', 'european_program', 'unknown']),
  message: z.preprocess((v) => {
    const cleaned = cleanString(v);
    return cleaned || undefined;
  }, z.string().max(1200).optional()),
  page: z.preprocess((v) => cleanString(v), z.string().min(1).max(300)),
  language: z.preprocess((v) => cleanString(v || 'ro').toLowerCase(), z.string().min(2).max(8)),
});

function parseBody(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = result.error.flatten();
    return { ok: false, error };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  cleanString,
  commentSchema,
  forgotPasswordSchema,
  loginSchema,
  newsletterSchema,
  parseBody,
  pipelineSchema,
  profileSchema,
  reactionSchema,
  registerSchema,
  resetPasswordSchema,
  feedbackSchema,
};
