import { Router } from 'express';
import { requireActor } from '../../middleware/actor';
import { validate } from '../../middleware/validate';
import { listingController as c } from './listing.controller';
import { createListingBody, listingIdParams, listListingsQuery } from './listing.schema';

export function listingRoutes() {
  const router = Router();
  router.use(requireActor);

  router.get('/', validate({ query: listListingsQuery }), c.list);
  router.post('/', validate({ body: createListingBody }), c.create);

  for (const action of ['withdraw', 'claim', 'unclaim', 'approve', 'reject'] as const) {
    router.post(`/:id/${action}`, validate({ params: listingIdParams }), c.action(action));
  }

  return router;
}
