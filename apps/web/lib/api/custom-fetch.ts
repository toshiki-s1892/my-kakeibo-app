import { ApiError, ErrorBody } from './api-error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Orvalの規約上、型引数を1つ取る形である必要がある
export type ErrorType<T> = ApiError;

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, options);
  const bodyText = await res.text();
  const data = bodyText ? parseJson(bodyText) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, data as ErrorBody | undefined);
  }

  return data as T;
};
