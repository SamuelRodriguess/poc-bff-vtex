/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponse } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(private readonly httpService: HttpService) {}

  async searchProducts(termo: string): Promise<SearchResponse> {
    const url = `https://obramax.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(termo)}&page=1&count=10`;

    try {
      const { data } = await firstValueFrom(this.httpService.get(url));

      // Mapping the VTEX response to our DTO
      // Based on common VTEX Intelligent Search response structure
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
    } catch (error) {
      console.error('VTEX Search Error:', error.message);
      throw error;
    }
  }
}
