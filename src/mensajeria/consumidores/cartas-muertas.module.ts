import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { MensajeriaModule } from '../mensajeria.module.js';
import { CartasMuertasConsumidor } from './cartas-muertas.consumidor.js';

@Module({
  imports: [MensajeriaModule, PersistenciaModule],
  providers: [CartasMuertasConsumidor],
})
export class CartasMuertasModule {}