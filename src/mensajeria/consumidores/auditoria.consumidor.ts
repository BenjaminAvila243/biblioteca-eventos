import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';

@Injectable()
export class AuditoriaConsumidor implements OnModuleInit {
  private readonly log = new Logger(AuditoriaConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.auditoria,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;                       // el broker cancelo el consumidor

        const eventoId = mensaje.properties.headers?.['x-evento-id'];
        const emitidoEn = mensaje.properties.headers?.['x-emitido-en'];
        const payload = JSON.parse(mensaje.content.toString());

        this.log.log(
          `${mensaje.fields.routingKey} | evento ${eventoId} | emitido ${emitidoEn} | ${JSON.stringify(payload)}`,
        );

        canal.ack(mensaje);                         // recien aqui el broker lo borra
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.auditoria}`);
  }
}