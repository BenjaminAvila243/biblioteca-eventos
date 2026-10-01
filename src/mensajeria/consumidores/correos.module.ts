import { Module } from '@nestjs/common';
import { MensajeriaModule } from '../mensajeria.module.js';
import { CorreosConsumidor } from './correos.consumidor.js';

@Module({
  imports: [MensajeriaModule],
  providers: [CorreosConsumidor],
})
export class CorreosModule {}