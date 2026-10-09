import { connect } from 'amqplib';

const cuantos = Number(process.argv[2] ?? 1);

const conexion = await connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();
await canal.prefetch(cuantos);

console.log(`prefetch en ${cuantos}. Escuchando auditoria y sin hacer ack. Corta con Ctrl+C.`);

await canal.consume(
  'auditoria',
  (mensaje) => {
    if (mensaje === null) return;
    const id = mensaje.properties.headers?.['x-evento-id'];
    console.log(`recibido, sin ack: ${mensaje.fields.routingKey} ${id}`);
  },
  { noAck: false },
);