import { Module } from '@nestjs/common';
import { MensajeriaModule } from '../mensajeria.module.js';
import { NotificacionesConsumidor } from './notificaciones.consumidor.js';

@Module({
  imports: [MensajeriaModule],
  providers: [NotificacionesConsumidor],
})
export class NotificacionesModule {}