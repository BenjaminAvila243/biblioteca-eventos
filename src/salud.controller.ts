import { Controller, Get } from '@nestjs/common';

@Controller('salud')
export class SaludController {
  @Get()
  estado() {
    return { servicio: 'biblioteca-eventos', estado: 'vivo' };
  }
}