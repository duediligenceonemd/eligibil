'use strict';

const { z } = require('zod');

// ── Middleware factory ───────────────────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Date invalide',
        details: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email().max(254).transform(s => s.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});

const registerSchema = z.object({
  email:       z.string().email().max(254).transform(s => s.toLowerCase().trim()),
  password:    z.string().min(8).max(128),
  firstName:   z.string().max(100).optional(),
  lastName:    z.string().max(100).optional(),
  role:        z.string().max(50).optional(),
  startupName: z.string().max(200).optional(),
  website:     z.string().max(500).optional(),
  pitch:       z.string().max(2000).optional(),
  sector:      z.string().max(100).optional(),
  stage:       z.string().max(100).optional(),
  trl:         z.coerce.number().int().min(1).max(9).optional(),
  country:     z.string().max(100).optional(),
  teamSize:    z.string().max(50).optional(),
  github:      z.string().max(500).optional(),
  goals:       z.array(z.string().max(200)).max(20).optional(),
  amountIdx:   z.coerce.number().int().min(0).max(5).optional(),
  horizon:     z.string().max(100).optional(),
  priority:    z.string().max(100).optional(),
});

// ── Comments / Reactions ─────────────────────────────────────────────────────
const commentSchema = z.object({
  content_type: z.enum(['grant', 'blog_post', 'news_article']),
  content_id:   z.string().min(1).max(100),
  body:         z.string().min(1).max(5000).transform(s => s.trim()),
});

const reactionToggleSchema = z.object({
  content_type: z.enum(['grant', 'blog_post', 'news_article']),
  content_id:   z.string().min(1).max(100),
});

// ── Newsletter ───────────────────────────────────────────────────────────────
const newsletterSchema = z.object({
  email:   z.string().email().max(254).transform(s => s.toLowerCase().trim()),
  context: z.string().max(32).optional().default('page'),
});

// ── Profile update ───────────────────────────────────────────────────────────
const profileUpdateSchema = z.object({
  startupName: z.string().max(200).optional(),
  website:     z.string().max(500).optional(),
  pitch:       z.string().max(2000).optional(),
  sector:      z.string().max(100).optional(),
  stage:       z.string().max(100).optional(),
  trl:         z.coerce.number().int().min(1).max(9).optional(),
  country:     z.string().max(100).optional(),
  teamSize:    z.string().max(50).optional(),
  github:      z.string().max(500).optional(),
  goals:       z.array(z.string().max(200)).max(20).optional(),
  amountIdx:   z.coerce.number().int().min(0).max(5).optional(),
  horizon:     z.string().max(100).optional(),
  priority:    z.string().max(100).optional(),
});

// ── Pipeline ─────────────────────────────────────────────────────────────────
const pipelineSchema = z.object({
  grantId:   z.string().max(100).optional(),
  grantName: z.string().max(300).optional(),
  stage:     z.string().max(50).optional().default('research'),
  notes:     z.string().max(2000).optional(),
  deadline:  z.string().max(100).optional(),
});

// ── Waitlist ─────────────────────────────────────────────────────────────────
const waitlistSchema = z.object({
  email:   z.string().email().max(254).transform(s => s.toLowerCase().trim()),
  source:  z.enum(['popup', 'exit_intent', 'inline', 'lead_magnet', 'referral']),
  variant: z.enum(['A', 'B', 'C']).optional(),
  locale:  z.enum(['ro', 'en', 'ru', 'ua']).default('ro'),
});

// ── Stripe (placeholder for future payment integration) ─────────────────────
// When Stripe is integrated, card data must NEVER touch this server.
// Use Stripe Elements / Checkout — only the payment_intent_id arrives here.
// const paymentSchema = z.object({
//   payment_intent_id: z.string().min(1).max(200),
//   amount: z.number().positive().max(1_000_000),
//   currency: z.enum(['RON', 'EUR', 'USD']),
// });

module.exports = {
  validate,
  loginSchema,
  registerSchema,
  commentSchema,
  reactionToggleSchema,
  newsletterSchema,
  profileUpdateSchema,
  pipelineSchema,
  waitlistSchema,
};
