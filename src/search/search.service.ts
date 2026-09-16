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
      timeout: 5000, // 5 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // Try again after 30s
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

  private async executeSearch(termo: string): Promise<SearchResponse> {
    const url = `https://obramax.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(termo)}&page=1&count=10`;
    const { data } = await firstValueFrom(this.httpService.get(url));

    const products = data.products || [];
    return {
      products: products.map((p) => ({
        productId: p.productId,
        name: p.productName,
        price: p.items?.[0]?.price,
        link: p.productLink,
        imageUrl: p.productImageUrl,
      })),
      total: data.total || 0,
    };
  }

  async searchProducts(termo: string): Promise<SearchResponse> {
    const cacheKey = `search_products_${termo}`;

    // 1. Try Cache
    const cachedData = await this.cacheManager.get<SearchResponse>(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache HIT for term: ${termo}`);
      return cachedData;
    }

    try {
      // 2. Call through Circuit Breaker
      const result = await this.breaker.fire(termo);

      // 3. Save to Cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.log(`Cache MISS for term: ${termo}. Saved to Redis.`);

      return result;
    } catch (error) {
      this.logger.error(
        `VTEX Search Error for term ${termo}: ${error.message}`,
      );
      throw error;
    }
  }
}
