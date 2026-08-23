import { RouteHandler } from '@hono/zod-openapi';
import { getCategoriesRoute } from '../schema/categoryListSchema';
export const getCategoriesHandler: RouteHandler<typeof getCategoriesRoute> = async (c) => {
  return c.json({ categories: [] }, 200);
};
