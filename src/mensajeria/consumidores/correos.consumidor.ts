import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { COLAS } from '../topologia.js';
import { MensajeriaService } from '../mensajeria.service.js';
import { conReintentos, detalle, esDelMensaje, MensajeInvalido, REINTENTOS } from '../reintentos.js';
import { Notificacion } from '../../persistencia/notificacion.entity.js';

@Injectable()
export class CorreosConsumidor implements OnModuleInit {
  private readonly log = new Logger(CorreosConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(Notificacion)
    private readonly notificaciones: Repository<Notificacion>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.mensajeria.canal.consume(
      COLAS.correos,
      (mensaje) => void this.procesar(mensaje),
      { noAck: false },
    );
    this.log.log(`escuchando la cola ${COLAS.correos}`);
  }

  private async procesar(mensaje: ConsumeMessage | null): Promise<void> {
    if (mensaje === null) return;
    const canal = this.mensajeria.canal;

    try {
      const comando = JSON.parse(mensaje.content.toString()) as Record<string, unknown>;

      if (typeof comando.para !== 'string' || comando.para === '') {
        throw new MensajeInvalido('el comando no trae para');
      }
      if (typeof comando.asunto !== 'string' || comando.asunto === '') {
        throw new MensajeInvalido('el comando no trae asunto');
      }
       if (typeof comando.eventoId !== 'string' || comando.eventoId === '') {
        throw new MensajeInvalido('el comando no trae eventoId');
      }
      const para = comando.para;
      const asunto = comando.asunto;
      const eventoId = comando.eventoId;

      this.log.log(`enviando correo a ${para}: "${asunto}" (origen ${String(comando.origen)})`);

      await conReintentos(
        () =>
          this.notificaciones.insert({
            para,
            asunto,
            estado: 'enviada',
            eventoId,
          }),
        (intento, error) =>
          this.log.warn(`intento ${intento} de ${REINTENTOS.maximo} fallido para ${eventoId}: ${detalle(error)}`),
      );

      canal.ack(mensaje);                          
      this.log.log(`notificacion guardada para el evento ${eventoId}`);
    } catch (error) {
      canal.nack(mensaje, false, false);            
      const ruta = esDelMensaje(error) ? 'mensaje invalido' : `la base no respondio en ${REINTENTOS.maximo} intentos`;
      this.log.error(`${ruta}, hacia la DLQ: ${detalle(error)}`);
    }
  }
}