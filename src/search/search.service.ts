/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponse } from './dto/search-result.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import CircuitBreaker from 'opossum';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private breaker: CircuitBreaker;

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Circuit Breaker configuration
    this.breaker = new CircuitBreaker(this.executeSearch.bind(this), {
      timeout: 10000, // 10 seconds (balanced)
      errorThresholdPercentage: 30, // More sensitive: open breaker if 30% of requests fail
      resetTimeout: 15000, // Try again after 15s instead of 30s
    });

    this.breaker.on('open', () =>
      this.logger.warn('Circuit Breaker OPEN: VTEX Search API is failing'),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.log('Circuit Breaker HALF_OPEN: Testing VTEX Search API'),
    );
    this.breaker.on('close', () =>
      this.logger.log('Circuit Breaker CLOSED: VTEX Search API is healthy'),
    );
  }

  private async executeSearch(
    termo: string,
    count: number,
  ): Promise<SearchResponse> {
    const url = `https://obramax.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(termo)}&page=1&count=${count}`;
    const { data } = await firstValueFrom(this.httpService.get(url));
    this.logger.debug(`VTEX Raw Data for ${termo}: ${JSON.stringify(data)}`);

    const products = data.products || [];
    this.logger.debug(`Mapping ${products.length} products. First product keys: ${products[0] ? Object.keys(products[0]).join(', ') : 'none'}`);
    return {
      products: products.map((p) => ({
        productId: p.productId,
        name: p.productName,
        price:
          p.items?.[0]?.sellers?.[0]?.commertialOffer?.Price ||
          p.priceRange?.sellingPrice?.lowPrice,
        link: p.link,
        imageUrl:
          p.items?.[0]?.images?.[0]?.imageUrl ||
          p.images?.[0]?.imageUrl ||
          p.productImageUrl ||
          'https://via.placeholder.com/300x300?text=Sem+Imagem',
      })),
      total: data.total || products.length,
    };
  }

  async searchProducts(termo: string, count: number): Promise<SearchResponse> {
    const cacheKey = `search_products_${termo}_count_${count}`;

    // 1. Try Cache
    const cachedData = await this.cacheManager.get<SearchResponse>(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache HIT for term: ${termo} (count: ${count})`);
      return cachedData;
    }

    try {
      // 2. Call through Circuit Breaker
      const result = (await this.breaker.fire(termo, count)) as SearchResponse;

      // 3. Save to Cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.log(
        `Cache MISS for term: ${termo} (count: ${count}). Saved to cache.`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `VTEX Search Error for term ${termo}: ${error.message}. Attempting fallback...`,
      );

      // FALLBACK: Try to get any available cached data for this term regardless of count
      // Simple implementation: search for any cache key starting with search_products_${termo}
      // But since cache-manager doesn't support keys search easily, we just try the exact key again
      const staleData = await this.cacheManager.get<SearchResponse>(cacheKey);
      if (staleData) {
        this.logger.warn(`Returning stale cache for term: ${termo}`);
        return staleData;
      }

      throw error;
    }
  }
}
