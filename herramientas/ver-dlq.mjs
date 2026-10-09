import { connect } from 'amqplib';

const cola = process.argv[2] ?? 'auditoria.dlq';

const conexion = await connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();

const mensaje = await canal.get(cola, { noAck: false });

if (mensaje === false) {
  console.log(`la cola ${cola} esta vacia`);
} else {
  console.log(`cola:        ${cola}`);
  console.log(`routing key: ${mensaje.fields.routingKey}`);
  console.log(`payload:     ${mensaje.content.toString()}`);
  console.log('headers:');
  console.log(JSON.stringify(mensaje.properties.headers, null, 2));
  canal.nack(mensaje, false, true);
  console.log(`\nmensaje devuelto a ${cola}: sigue ahi`);
}

await canal.close();
await conexion.close();