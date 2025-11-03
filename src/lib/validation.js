const { z } = require('zod');

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Enter a valid email')
  .transform((value) => value.trim().toLowerCase())
  .max(255, 'Email too long');

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or less');

const nameSchema = z
  .string({ required_error: 'Required' })
  .trim()
  .min(1, 'Required')
  .max(60, 'Too long');

const roleSchema = z.enum(['TALENT', 'AGENCY']);

const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
});

const signupSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema
});

const applySchema = z
  .object({
    first_name: nameSchema,
    last_name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    city: nameSchema,
    height_cm: z
      .preprocess((val) => (typeof val === 'string' ? val.trim() : val), z.string().min(1))
      .transform((val) => parseInt(val, 10))
      .refine((val) => Number.isFinite(val) && val >= 120 && val <= 220, {
        message: 'Provide height in cm between 120 and 220'
      }),
    measurements: z
      .string({ required_error: 'Measurements required' })
      .trim()
      .min(2, 'Measurements required')
      .max(60, 'Too long'),
    bio: z
      .string({ required_error: 'Bio required' })
      .trim()
      .min(10, 'Tell us more so we can curate')
      .max(600, 'Bio is too long'),
    partner_agency_email: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val ? val.toLowerCase() : undefined))
      .refine((val) => !val || /@/.test(val), { message: 'Enter a valid email' })
  })
  .strict();

const partnerClaimSchema = z.object({
  slug: z.string().trim().min(1, 'Profile required')
});

module.exports = {
  loginSchema,
  signupSchema,
  applySchema,
  partnerClaimSchema
};
