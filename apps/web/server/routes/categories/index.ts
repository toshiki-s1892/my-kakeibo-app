import { validationErrorHook } from '@/server/shared/default-hook';
import { OpenAPIHono } from '@hono/zod-openapi';
import { getCategoriesHandler } from './handler/categoryListHandler';
import { deleteCategoryPinHandler, putCategoryPinHandler } from './handler/categoryPinHandler';
import { getCategoriesRoute } from './schema/categoryListSchema';
import { deleteCategoryPinRoute, putCategoryPinRoute } from './schema/categoryPinSchema';

const categoriesRouter = new OpenAPIHono({ defaultHook: validationErrorHook });
categoriesRouter.openapi(getCategoriesRoute, getCategoriesHandler);
categoriesRouter.openapi(putCategoryPinRoute, putCategoryPinHandler);
categoriesRouter.openapi(deleteCategoryPinRoute, deleteCategoryPinHandler);

export default categoriesRouter;
