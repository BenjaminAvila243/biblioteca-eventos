import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MensajeriaService } from './mensajeria/mensajeria.service.js';

@Controller('salud')
export class SaludController {
  constructor(
    private readonly mensajeria: MensajeriaService,
    private readonly base: DataSource,
  ) {}

  @Get()
  async estado() {
    const postgres = await this.base.query('select 1').then(() => true, () => false);
    const cuerpo = {
      servicio: 'biblioteca-eventos',
      broker: this.mensajeria.abierto ? 'ok' : 'caido',
      postgres: postgres ? 'ok' : 'caida',
    };
    if (!this.mensajeria.abierto || !postgres) throw new ServiceUnavailableException(cuerpo);
    return cuerpo;
  }
}