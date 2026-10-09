import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';
import { randomUUID } from 'node:crypto';
import { declararTopologia } from './topologia.js';

@Injectable()
export class MensajeriaService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(MensajeriaService.name);
  private readonly url: string;
  private conexion!: ChannelModel;
  canal!: Channel;
  abierto = false;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('RABBITMQ_URL');
  }

  async onModuleInit(): Promise<void> {
    this.conexion = await connect(this.url);
    this.conexion.on('error', (e: Error) => this.log.error(`conexion: ${e.message}`));
    this.canal = await this.conexion.createChannel();
    this.abierto = true;
    this.canal.on('close', () => { this.abierto = false; });
    await this.canal.prefetch(1);
    this.canal.on('error', (e: Error) => this.log.error(`canal: ${e.message}`));

    await declararTopologia(this.canal);
    this.log.log('topologia declarada, prefetch en 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.canal?.close();
    await this.conexion?.close();
  }

  publicar(exchange: string, routingKey: string, payload: unknown): boolean {
    return this.canal.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
      headers: {
        'x-evento-id': randomUUID(),
        'x-emitido-en': new Date().toISOString(),
      },
    });
  }
}