import { Resolver, Query, Args } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { SearchResponse } from './dto/search-result.dto';

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => SearchResponse)
  async searchProducts(@Args('query') term: string): Promise<SearchResponse> {
    return this.searchService.searchProducts(term);
  }
}
