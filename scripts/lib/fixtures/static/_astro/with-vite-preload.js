import { _ as u } from './preload-helper.fake.js';

(async function () {
  const { value } = await u(async () => ({ value: 'preload-shimmed' }), ['missing-chunk.js']);
  document.documentElement.dataset.preload = value;
})();
