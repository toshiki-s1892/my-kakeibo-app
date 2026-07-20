import { getProfileMock } from '@/lib/api/generated/profile/profile.msw';

export const handlers = [...getProfileMock()];
