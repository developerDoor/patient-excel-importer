import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'Patient' })
@Index(['name', 'phoneNumber', 'chartNumber'], { unique: true })
export class PatientModel {
  @ApiProperty({
    description: '환자 ID',
  })
  @PrimaryGeneratedColumn()
  id: string;

  @ApiProperty({
    description: '환자 이름',
    maxLength: 16,
  })
  @Column({ length: 16, nullable: false })
  name: string;

  @ApiProperty({
    description: '전화번호',
    maxLength: 11,
  })
  @Column({ length: 11, nullable: false })
  phoneNumber: string;

  @ApiProperty({
    description: '주민등록번호',
    maxLength: 14,
  })
  @Column({ length: 14, nullable: false })
  registrationNumber: string;

  @ApiProperty({
    description: '차트 번호',
    maxLength: 20,
    required: false,
    nullable: true,
  })
  @Column({ length: 20, nullable: true, default: null })
  chartNumber: string;

  @ApiProperty({
    description: '주소',
    maxLength: 255,
    required: false,
    nullable: true,
  })
  @Column({ length: 255, nullable: true, default: null })
  address: string;

  @ApiProperty({
    description: '메모',
    required: false,
    nullable: true,
  })
  @Column({ type: 'text', nullable: true, default: null })
  memo: string;

  @ApiProperty({
    description: '생성일시',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: '삭제일시',
    nullable: true,
  })
  @DeleteDateColumn()
  deletedAt: Date;
}
