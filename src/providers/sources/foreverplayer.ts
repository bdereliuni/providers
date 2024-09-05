import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const CONSUMET_API_BASE = 'https://consumet-api-1ozb.onrender.com/movies/flixhq';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    title: ctx.media.title,
    type: ctx.media.type,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  async function getStreamingData(title: string): Promise<SourcererOutput> {
    try {
      const formattedTitle = title.toLowerCase().replace(/ /g, '-');
      const searchResponse = await ctx.fetcher(`${CONSUMET_API_BASE}/${formattedTitle}?page=1`);
      const searchData = await searchResponse.json();

      const exactMatch = searchData.results.find((result: { title: string }) => result.title === title);
      if (!exactMatch) {
        throw new NotFoundError('No exact match found');
      }

      const mediaId = exactMatch.id;

      const infoResponse = await ctx.fetcher(`${CONSUMET_API_BASE}/info?id=${mediaId}`);
      const infoData = await infoResponse.json();

      let episodeId;
      if (query.type === 'show') {
        const targetEpisode = infoData.episodes.find((ep: { number: number; season: number }) => 
          ep.number === query.episode && ep.season === query.season
        );
        if (!targetEpisode) {
          throw new NotFoundError('Episode not found');
        }
        episodeId = targetEpisode.id;
      } else {
        episodeId = infoData.episodes[0].id;
      }

      const serversResponse = await ctx.fetcher(`${CONSUMET_API_BASE}/servers?episodeId=${episodeId}&mediaId=${mediaId}`);
      const serversData = await serversResponse.json();

      const embeds = serversData.map((server: { name: string }) => ({
        embedId: server.name,
        url: JSON.stringify({
          episodeId,
          mediaId,
          server: server.name,
        }),
      }));

      return { embeds };
    } catch (error) {
      console.error('Error in getStreamingData:', error);
      throw new NotFoundError('Failed to get streaming data');
    }
  }

  return getStreamingData(query.title);
}

export const foreverPlayerScraper = makeSourcerer({
  id: 'foreverplayer',
  name: 'ForeverPlayer',
  rank: 130,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});