import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field()
  productId: string;

  @Field()
  name: string;

  @Field(() => Int, { nullable: true })
  price?: number;

  @Field({ nullable: true })
  link?: string;

  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType()
export class SearchResponse {
  @Field(() => [Product])
  products: Product[];

  @Field(() => Int)
  total: number;
}
