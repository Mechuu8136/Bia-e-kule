import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ default: true })
  is_published!: boolean;

  @CreateDateColumn()
  published_at!: Date;
}
