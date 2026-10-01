import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchService } from './search.service.js';
import { SearchResolver } from './search.resolver.js';

@Module({
  imports: [HttpModule],
  providers: [SearchService, SearchResolver],
})
export class SearchModule {}
