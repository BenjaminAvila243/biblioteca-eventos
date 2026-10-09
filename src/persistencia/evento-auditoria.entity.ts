import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'eventos_auditoria' })
@Unique('uq_eventos_auditoria_evento_id', ['eventoId'])
@Index('ix_eventos_auditoria_routing_recibido', ['routingKey', 'recibidoEn'])
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'routing_key', type: 'text' })
  routingKey!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @Column({ name: 'usuario_sub', type: 'text', nullable: true })
  usuarioSub!: string | null;

  @Column({ type: 'jsonb' })
  payload!: object;

  @Column({ name: 'emitido_en', type: 'timestamptz' })
  emitidoEn!: Date;

  @CreateDateColumn({ name: 'recibido_en', type: 'timestamptz' })
  recibidoEn!: Date;
}