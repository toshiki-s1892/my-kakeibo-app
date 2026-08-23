import {
  futureDateNotAllowedMessage,
  GENDER_OPTIONS,
  maxLengthMessage,
  minDateMessage,
  REGION_OPTIONS,
  requiredMessage,
} from '@repo/common';
import z from 'zod';

export const profileSetupFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: requiredMessage })
    .max(50, { message: maxLengthMessage(50) }),
  gender: z.enum(
    GENDER_OPTIONS.map((option) => option.value),
    {
      error: (issue) => (issue.input === undefined ? requiredMessage : undefined),
    }
  ),
  birthday: z
    .date({ error: (issue) => (issue.input === undefined ? requiredMessage : undefined) })
    .min(new Date('1900-01-01'), { message: minDateMessage('1900-01-01') })
    .refine((date) => date <= new Date(), { message: futureDateNotAllowedMessage }),
  regionCode: z.enum(
    REGION_OPTIONS.map((option) => option.value),
    {
      error: (issue) => (issue.input === undefined ? requiredMessage : undefined),
    }
  ),
});

export type ProfileSetupFormValues = z.infer<typeof profileSetupFormSchema>;
