import { connect } from 'amqplib';
import { randomUUID } from 'node:crypto';

const cuantos = Number(process.argv[2] ?? 1);
const roto = process.argv.includes('--roto');
const repetido = process.argv.includes('--repetido');
const ID_FIJO = '11111111-2222-3333-4444-555555555555';

const conexion = await connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();

for (let i = 1; i <= cuantos; i++) {
  const eventoId = repetido ? ID_FIJO : randomUUID();
  const cuerpo = roto
    ? Buffer.from('{ esto no es JSON valido')
    : Buffer.from(
        JSON.stringify({
          prestamoId: i,
          libroId: 10 + i,
          usuarioSub: 'a4c8e1f2-3b5d-4a7e-9c01-2f6b8d4e5a90',
          hasta: '2026-10-31',
        }),
      );

  canal.publish('biblioteca.eventos', 'prestamo.creado', cuerpo, {
    contentType: 'application/json',
    persistent: true,
    headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() },
  });

  console.log(`publicado prestamo.creado  x-evento-id=${eventoId}  roto=${roto}`);
}

await canal.close();
await conexion.close();