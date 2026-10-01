import { Module } from '@nestjs/common';
import { MensajeriaService } from './mensajeria.service.js';

@Module({
  providers: [MensajeriaService],
  exports: [MensajeriaService],
})
export class MensajeriaModule {}