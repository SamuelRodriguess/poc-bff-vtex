import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SearchModule } from './search/search.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      introspection: true,
      csrfPrevention: false,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(configService.get('RATE_LIMIT_TTL')) || 60,
            limit: Number(configService.get('RATE_LIMIT_LIMIT')) || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');

        if (!redisHost) {
          return {
            ttl: Number(configService.get('CACHE_TTL')) || 600,
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: Number(configService.get('REDIS_PORT')) || 6379,
            },
          }),
          ttl: Number(configService.get('CACHE_TTL')) || 600,
        };
      },
      inject: [ConfigService],
    }),
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
