import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';

@Module({
  imports: [HttpModule],
  providers: [SearchService, SearchResolver],
})
export class SearchModule {}
