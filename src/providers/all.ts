import { Sourcerer } from '@/providers/base';
import { foreverPlayerScraper } from './sources/foreverplayer';

export function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [
    foreverPlayerScraper,
  ];
}

export function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [
    // Bu fonksiyon şu an boş, çünkü foreverPlayerScraper bir embed değil, bir kaynaktır.
    // Eğer ileride embed'ler eklerseniz, buraya ekleyebilirsiniz.
  ];
}