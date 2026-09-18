import { z } from 'zod';

export const countryCodeSchema = z
  .string()
  .regex(/^\d{1,3}$/, 'countryCode must be 1-3 digits, no leading "+"');

export const phoneNumberValueSchema = z
  .string()
  .regex(/^\d{4,14}$/, 'number must be 4-14 digits, no spaces or symbols');
