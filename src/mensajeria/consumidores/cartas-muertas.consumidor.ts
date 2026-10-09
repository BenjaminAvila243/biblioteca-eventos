import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { DLQ } from '../topologia.js';
import { MensajeriaService } from '../mensajeria.service.js';
import { MensajeMuerto } from '../../persistencia/mensaje-muerto.entity.js';
import { detalle } from '../reintentos.js';

interface Defuncion {
  count: number;
  reason: string;
  queue: string;
  'routing-keys': string[];
}

@Injectable()
export class CartasMuertasConsumidor implements OnModuleInit {
  private readonly log = new Logger(CartasMuertasConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(MensajeMuerto)
    private readonly muertos: Repository<MensajeMuerto>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const cola of Object.values(DLQ)) {
      await this.mensajeria.canal.consume(
        cola,
        (mensaje) => {
          if (mensaje === null) return;
          this.procesar(cola, mensaje).catch((error: Error) => {
            this.log.error(`no se pudo registrar la carta muerta de ${cola}, se reintenta en 5 s: ${detalle(error)}`);
            setTimeout(() => this.mensajeria.canal.nack(mensaje, false, true), 5000);
          });
        },
        { noAck: false },
      );
      this.log.log(`escuchando la cola ${cola}`);
    }
  }

  private async procesar(cola: string, mensaje: ConsumeMessage | null): Promise<void> {
    if (mensaje === null) return;
    const canal = this.mensajeria.canal;
    const defunciones = (mensaje.properties.headers?.['x-death'] ?? []) as Defuncion[];
    const muerte = defunciones[0]; 

    const registro = {
      colaOrigen: String(mensaje.properties.headers?.['x-first-death-queue'] ?? muerte?.queue ?? cola),
      routingKey: muerte?.['routing-keys']?.[0] ?? mensaje.fields.routingKey,
      motivo: muerte?.reason ?? 'desconocido',
      intentos: muerte?.count ?? 1,
      payload: mensaje.content.toString(),
    };

    this.log.error(
      `carta muerta en ${cola}: cola de origen ${registro.colaOrigen}, ` +
        `routing key ${registro.routingKey}, motivo ${registro.motivo}, ` +
        `intentos ${registro.intentos}`,
    );

    await this.muertos.insert(registro);
    canal.ack(mensaje);
  }
}