import { validationErrorHook } from '@/server/shared/default-hook';
import { OpenAPIHono } from '@hono/zod-openapi';
import { profileSetupHandler } from './handler';
import { createUserRoute } from './schema';

const profileRouter = new OpenAPIHono({ defaultHook: validationErrorHook });

profileRouter.openapi(createUserRoute, profileSetupHandler);

export default profileRouter;
