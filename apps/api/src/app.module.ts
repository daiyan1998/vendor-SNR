import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv } from './config/env.schema.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module.js';
import { ShopVerificationModule } from './modules/shop-verification/shop-verification.module.js';
import { CatalogInventoryModule } from './modules/catalog-inventory/catalog-inventory.module.js';
import { BargainingMessagingModule } from './modules/bargaining-messaging/bargaining-messaging.module.js';
import { CartCheckoutModule } from './modules/cart-checkout/cart-checkout.module.js';
import { OrderFulfillmentModule } from './modules/order-fulfillment/order-fulfillment.module.js';
import { ReturnsDisputesModule } from './modules/returns-disputes/returns-disputes.module.js';
import { V2VCoordinationModule } from './modules/v2v-coordination/v2v-coordination.module.js';
import { FinancialLedgerModule } from './modules/financial-ledger/financial-ledger.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { SubscriptionBillingModule } from './modules/subscription-billing/subscription-billing.module.js';
import { TrustSafetyModule } from './modules/trust-safety/trust-safety.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID(),
      },
    }),
    PrismaModule,
    IdentityAccessModule,
    ShopVerificationModule,
    CatalogInventoryModule,
    BargainingMessagingModule,
    CartCheckoutModule,
    OrderFulfillmentModule,
    ReturnsDisputesModule,
    V2VCoordinationModule,
    FinancialLedgerModule,
    ReviewsModule,
    SubscriptionBillingModule,
    TrustSafetyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
