import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificaciones' })
@Check('ck_notificaciones_estado', "estado IN ('enviada', 'fallida')")
@Index('ix_notificaciones_evento_id', ['eventoId'])
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  para!: string;

  @Column({ type: 'text' })
  asunto!: string;

  @Column({ type: 'text' })
  estado!: 'enviada' | 'fallida';

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;
}