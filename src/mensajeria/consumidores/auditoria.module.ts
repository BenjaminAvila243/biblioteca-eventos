import { Module } from '@nestjs/common';
import { MensajeriaModule } from '../mensajeria.module.js';
import { AuditoriaConsumidor } from './auditoria.consumidor.js';

@Module({
  imports: [MensajeriaModule],
  providers: [AuditoriaConsumidor],
})
export class AuditoriaModule {}