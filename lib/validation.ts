import { z } from 'zod';

export const contentInput = z.object({
  profileId: z.string().min(1), templateId: z.string().min(1), title: z.string().max(160).default(''),
  topic: z.string().min(2).max(250), objective: z.string().max(1000).default(''),
  body: z.string().max(4000).default(''), caption: z.string().max(5000).default(''),
  sourceUrl: z.union([z.url(), z.literal('')]).default(''),
  sourceDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(new Date(value).getTime())), z.literal('')]).default(''), photoUrl: z.union([z.string().regex(/^\/uploads\/[a-zA-Z0-9_.-]+$/), z.literal('')]).default(''),
  slides: z.array(z.object({
    headline: z.string().min(1).max(180), body: z.string().max(1200), footer: z.string().max(500),
    accent: z.string().max(180), photoUrl: z.union([z.string().regex(/^\/(uploads|reference)\/[a-zA-Z0-9_.-]+$/), z.literal('')]),
  })).length(5).nullable().default(null),
});

export const profileInput = z.object({
  name: z.string().min(2).max(70), description: z.string().max(800), audience: z.string().max(300),
  voice: z.string().max(600), ctas: z.array(z.string().max(300)), permittedTerms: z.array(z.string().max(100)),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontHeading: z.string().max(70), fontBody: z.string().max(70),
  logoUrl: z.union([z.string().regex(/^\/(uploads|brand-assets)\/[a-zA-Z0-9_.-]+$/), z.literal('')]), driveFolderId: z.string().max(800), brandFolderId: z.string().max(800).default(''),
  instagramId: z.string().max(200), formats: z.array(z.string()).min(1),
});
