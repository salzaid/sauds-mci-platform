import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { incidentsRouter } from "./routers/incidents";
import { casualtiesRouter } from "./routers/casualties";
import { orCasesRouter } from "./routers/orCases";
import { resourcesRouter } from "./routers/resources";
import { transportsRouter } from "./routers/transports";
import { icsFormsRouter } from "./routers/icsForms";
import { emtMdsRouter } from "./routers/emtMds";
import { commsRouter } from "./routers/comms";
import { adminRouter } from "./routers/admin";
import { dashboardRouter } from "./routers/dashboard";
import { invitationsRouter } from "./routers/invitations";
import { demoRouter } from "./routers/demo";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  incidents: incidentsRouter,
  casualties: casualtiesRouter,
  orCases: orCasesRouter,
  resources: resourcesRouter,
  transports: transportsRouter,
  icsForms: icsFormsRouter,
  emtMds: emtMdsRouter,
  comms: commsRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
  invitations: invitationsRouter,
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
