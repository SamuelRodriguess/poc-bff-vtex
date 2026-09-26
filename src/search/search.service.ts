/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponse } from './dto/search-result.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import CircuitBreaker from 'opossum';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private breaker: CircuitBreaker;

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.breaker = new CircuitBreaker(this.executeSearch.bind(this), {
      timeout: 10000,
      errorThresholdPercentage: 30,
      resetTimeout: 15000,
    });

    this.breaker.on('open', () =>
      this.logger.warn('Circuit Breaker OPEN: VTEX Search API failing'),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.log('Circuit Breaker HALF_OPEN: Testing VTEX Search API'),
    );
    this.breaker.on('close', () =>
      this.logger.log('Circuit Breaker CLOSED: VTEX Search API healthy'),
    );
  }

  private async executeSearch(
    termo: string,
    count: number,
  ): Promise<SearchResponse> {
    const url = `https://obramax.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(termo)}&page=1&count=${count}`;
    const { data } = await firstValueFrom(this.httpService.get(url));

    const products = data.products || [];
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
    const cachedData = await this.cacheManager.get<SearchResponse>(cacheKey);

    if (cachedData) return cachedData;

    try {
      const result = (await this.breaker.fire(termo, count)) as SearchResponse;
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error: any) {
      this.logger.error(
        `VTEX Search Error: ${error.message}. Attempting fallback...`,
      );
      const staleData = await this.cacheManager.get<SearchResponse>(cacheKey);
      if (staleData) return staleData;
      throw error;
    }
  }
}
