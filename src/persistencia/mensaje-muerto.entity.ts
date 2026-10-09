import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mensajes_muertos' })
@Check('ck_mensajes_muertos_intentos', 'intentos >= 1')
export class MensajeMuerto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cola_origen', type: 'text' })
  colaOrigen!: string;

  @Column({ name: 'routing_key', type: 'text' })
  routingKey!: string;

  @Column({ type: 'text' })
  motivo!: string;

  @Column({ type: 'int', default: 1 })
  intentos!: number;

  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn({ name: 'recibido_en', type: 'timestamptz' })
  recibidoEn!: Date;
}