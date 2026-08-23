import { RouteHandler } from '@hono/zod-openapi';
import { deleteCategoryPinRoute, putCategoryPinRoute } from '../schema/categoryPinSchema';

export const putCategoryPinHandler: RouteHandler<typeof putCategoryPinRoute> = async (c) => {
  return c.body(null, 204);
};

export const deleteCategoryPinHandler: RouteHandler<typeof deleteCategoryPinRoute> = async (c) => {
  return c.body(null, 204);
};
