import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { COLAS } from '../topologia.js';
import { MensajeriaService } from '../mensajeria.service.js';
import { conReintentos, detalle, esDelMensaje, MensajeInvalido, REINTENTOS } from '../reintentos.js';
import { EventoAuditoria } from '../../persistencia/evento-auditoria.entity.js';

@Injectable()
export class AuditoriaConsumidor implements OnModuleInit {
  private readonly log = new Logger(AuditoriaConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(EventoAuditoria)
    private readonly eventos: Repository<EventoAuditoria>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.mensajeria.canal.consume(
      COLAS.auditoria,
      (mensaje) => void this.procesar(mensaje),
      { noAck: false },
    );
    this.log.log(`escuchando la cola ${COLAS.auditoria}`);
  }

  private async procesar(mensaje: ConsumeMessage | null): Promise<void> {
    if (mensaje === null) return;
    const canal = this.mensajeria.canal;
    const routingKey = mensaje.fields.routingKey;
    const cabeceras = mensaje.properties.headers ?? {};
    const eventoId = String(cabeceras['x-evento-id'] ?? '');
    const emitidoEn = String(cabeceras['x-emitido-en'] ?? '');

    try {
      if (eventoId === '') throw new MensajeInvalido('el mensaje no trae el header x-evento-id');
      if (Number.isNaN(Date.parse(emitidoEn))) throw new MensajeInvalido('el header x-emitido-en no es una fecha');
      const payload = JSON.parse(mensaje.content.toString()) as Record<string, unknown>;

      await conReintentos(
        () =>
          this.eventos.insert({
            routingKey,
            eventoId,
            usuarioSub: typeof payload.usuarioSub === 'string' ? payload.usuarioSub : null,
            payload,
            emitidoEn: new Date(emitidoEn),
          }),
        (intento, error) =>
          this.log.warn(`intento ${intento} de ${REINTENTOS.maximo} fallido para ${eventoId}: ${detalle(error)}`),
      );

      canal.ack(mensaje);
      this.log.log(`guardado ${routingKey} con evento ${eventoId}`);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        canal.ack(mensaje);
        this.log.warn(`reentrega del evento ${eventoId}: ya estaba guardado, no se duplica`);
        return;
      }
      canal.nack(mensaje, false, false);
      const ruta = esDelMensaje(error) ? 'mensaje invalido' : `la base no respondio en ${REINTENTOS.maximo} intentos`;
      this.log.error(`${ruta}, hacia la DLQ: ${detalle(error)}`);
    }
  }
}