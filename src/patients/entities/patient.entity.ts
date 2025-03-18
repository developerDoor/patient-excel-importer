import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'Patient' })
@Index(['name', 'phoneNumber', 'chartNumber'], { unique: true })
export class PatientModel {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 16, nullable: false })
  name: string;

  @Column({ length: 11, nullable: false })
  phoneNumber: string;

  @Column({ length: 14, nullable: false })
  registrationNumber: string;

  @Column({ length: 20, nullable: true, default: null })
  chartNumber: string;

  @Column({ length: 255, nullable: true, default: null })
  address: string;

  @Column({ type: 'text', nullable: true, default: null })
  memo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
