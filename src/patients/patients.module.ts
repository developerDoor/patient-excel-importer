import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientModel } from './entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientModel])],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
