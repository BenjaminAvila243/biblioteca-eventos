import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { MensajeriaModule } from '../mensajeria.module.js';
import { CorreosConsumidor } from './correos.consumidor.js';

@Module({
  imports: [MensajeriaModule, PersistenciaModule],
  providers: [CorreosConsumidor],
})
export class CorreosModule {}