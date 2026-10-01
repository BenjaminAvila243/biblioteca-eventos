import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS, EXCHANGES, ROUTING_KEYS } from '../topologia.js';

@Injectable()
export class NotificacionesConsumidor implements OnModuleInit {
  private readonly log = new Logger(NotificacionesConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.notificaciones,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;
        const evento = JSON.parse(mensaje.content.toString());

        this.log.log(`${mensaje.fields.routingKey} | aviso para ${evento.usuarioSub ?? 'nadie'}`);

        this.mensajeria.publicar(EXCHANGES.comandos.nombre, ROUTING_KEYS.correoEnviar, {
          para: 'lector@biblioteca.test',
          asunto: `Tu prestamo ${evento.prestamoId}`,
          cuerpo: `El libro ${evento.libroId} es tuyo hasta el ${evento.hasta}.`,
          origen: mensaje.fields.routingKey,
        });

        canal.ack(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.notificaciones}`);
  }
}