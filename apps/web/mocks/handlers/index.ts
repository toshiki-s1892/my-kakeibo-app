import { getProfileMock } from '@/lib/api/generated/profile/profile.msw';
import { categoriesHandler } from './categories';

export const handlers = [...getProfileMock(), categoriesHandler];
