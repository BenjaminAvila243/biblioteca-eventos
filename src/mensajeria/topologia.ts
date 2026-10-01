import { Channel } from 'amqplib';

// Los tres exchanges. El tipo va al lado del nombre porque declararlo con otro tipo es un error.
export const EXCHANGES = {
  eventos: { nombre: 'biblioteca.eventos', tipo: 'topic' },
  comandos: { nombre: 'biblioteca.comandos', tipo: 'direct' },
  dlx: { nombre: 'biblioteca.dlx', tipo: 'direct' },
} as const;

// Las tres colas de trabajo. Las DLQ llegan en L7.
export const COLAS = {
  notificaciones: 'notificaciones',
  auditoria: 'auditoria',
  correos: 'correos',
} as const;

export const ROUTING_KEYS = {
  prestamoCreado: 'prestamo.creado',
  prestamoDevuelto: 'prestamo.devuelto',
  libroAgotado: 'libro.agotado',
  correoEnviar: 'correo.enviar',
} as const;

// Que cola escucha que, y con que patron.
export const BINDINGS = [
  { cola: COLAS.notificaciones, exchange: EXCHANGES.eventos.nombre, patron: 'prestamo.*' },
  { cola: COLAS.auditoria, exchange: EXCHANGES.eventos.nombre, patron: '#' },
  { cola: COLAS.correos, exchange: EXCHANGES.comandos.nombre, patron: ROUTING_KEYS.correoEnviar },
] as const;

export async function declararTopologia(canal: Channel): Promise<void> {
  for (const exchange of Object.values(EXCHANGES)) {
    await canal.assertExchange(exchange.nombre, exchange.tipo, { durable: true });
  }
  for (const cola of Object.values(COLAS)) {
    await canal.assertQueue(cola, { durable: true });
  }
  for (const binding of BINDINGS) {
    await canal.bindQueue(binding.cola, binding.exchange, binding.patron);
  }
}