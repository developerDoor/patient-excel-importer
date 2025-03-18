import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { PatientModel } from './entities/patient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientModel)
    private readonly patientRepository: Repository<PatientModel>,
    private readonly dataSource: DataSource,
  ) {}
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [patients, total] = await this.patientRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'DESC'
      }
    })

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async processPatientExcel(file) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    // 첫번째 시트 사용
    const worksheet = workbook.getWorksheet(1); // 첫 번째 시트 사용

    if (!worksheet) {
      throw new BadRequestException('엑셀 파일에 유효한 시트가 없습니다.');
    }

    // 컬럼 매핑 정보 (첫번째 행이 헤더)
    const headerRow = worksheet.getRow(1);

    const results = {
      totalProcessCount: 0,
      successCount: 0,
      errorCount: 0,
      errors: [] as Array<{ row: number; message: string }>,
      chartNumberUpdatedCount: 0,
    };


    const queryRunner = this.dataSource.createQueryRunner();
    const patientsRepository = this.dataSource.getRepository(PatientModel);
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const patients: PatientModel[] = [];
      // 데이터 처리 시작 (2번쨰 행부터)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // 빈 행 건너뛰기
        if (this.isEmptyRow(row)) {
          continue;
        }

        results.totalProcessCount++;

        try {
          // 환자 데이터 추출 및 유효성 검증
          const patientsData = this.validateAndFormatPatientData(row);

          const patient = patientsRepository.create(patientsData)
          patients.push(patient);

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: rowNumber,
            message: error.message
          });
          // this.logger.error(`Row ${rowNumber} 처리 중 오류: ${error.message}`);
        }
      }
      await patientsRepository.upsert(patients, ['name', 'phoneNumber', 'chartNumber'])

      const duplicatePatientsId = await patientsRepository.query(`
        WITH DuplicateNames AS (
          SELECT name, 
                 phoneNumber
          FROM Patient
          WHERE deletedAt IS NULL
          GROUP BY name, phoneNumber
          HAVING COUNT(*) >= 2
        )
        SELECT p.id
          FROM Patient p
          JOIN DuplicateNames dn ON p.name = dn.name AND p.phoneNumber = dn.phoneNumber
          WHERE p.chartNumber = '차트번호없음' AND
                p.deletedAt IS NULL
          ORDER BY p.name, p.phoneNumber;
      `);
      const result = await patientsRepository.softDelete(duplicatePatientsId);
      results.chartNumberUpdatedCount = result.affected as number;
      await queryRunner.commitTransaction();
      return results;

    } catch (error) {
      // 에러 발생시 롤백
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('서버에서 오류가 발생했습니다. 재시도해주세요.');
    } finally {
      await queryRunner.release();
    }
  }

  private isEmptyRow(row: ExcelJS.Row): boolean {
    if (row.values.length === 0) {
      return true;
    }
    return false;
  }

  private validateAndFormatPatientData(row: ExcelJS.Row): object {
    const values = row.values;

    let chartNumber = values[1];
    const name = values[2];
    let phoneNumber = values[3].toString();
    let registrationNumber = values[4];
    const address = values[5];
    const memo = values[6];

    // 0. 차트번호 데이터가 없으면 '차트번호없음'으로 넣어준다.
    if (!chartNumber) {
      chartNumber = '차트번호없음';
    }

    // 1. 이름 검증
    if (!name) {
      throw new BadRequestException('이름은 필수 항목입니다.');
    }

    if (name.length > 16) {
      throw new BadRequestException('이름은 최대 16자까지만 허용됩니다.');
    }

    // 2. 전화번호 검증
    if (!phoneNumber) {
      throw new BadRequestException('전화번호는 필수 항목입니다.');
    }

    phoneNumber = this.preprocessPhoneNumber(phoneNumber);

    // 3. 주민등록번호 처리
    if (!registrationNumber || registrationNumber.trim() === '') {
      throw new BadRequestException('주민등록번호가 비어있습니다.');
    }

    const maskedPattern = /^\d{6}-\d{1}\*{6}$/;
    if (!maskedPattern.test(registrationNumber)) {
      // 1. 주민등록번호는 숫자 또는 '-'만 포함해야 함
      if (/[^0-9\-]/.test(registrationNumber)) {
        throw new BadRequestException(
          '주민등록번호는 숫자 또는 하이픈(-)만 포함해야 합니다.',
        );
      }

      // 하이픈 제거
      const digitsOnly: string = registrationNumber.replace(/\-/g, '');

      // 2. 문자를 제외한 주민등록번호는 6자리 혹은 13자리여야 함
      if (digitsOnly.length !== 6 && digitsOnly.length !== 13) {
        throw new BadRequestException(
          '주민등록번호는 숫자 6자리 또는 13자리여야 합니다.',
        );
      }

      // 앞 6자리 추출
      let frontPart: string = digitsOnly.substring(0, 6);

      // 3. 6자리 주민등록번호일 경우 (앞자리만 제공받은 경우)
      if (digitsOnly.length === 6) {
        registrationNumber = `${frontPart}-0******`;
      }

      if (digitsOnly.length === 13) {
        // 4. 13자리 주민등록번호일 경우
        // 뒷자리의 첫번째 숫자 추출
        const firstDigitOfBackPart: string = digitsOnly.substring(6, 7);

        // 마스킹된 뒷자리 생성
        const maskedBackPart: string = firstDigitOfBackPart + '******';

        // 결과 반환 (앞자리-뒷자리 형식)
        registrationNumber = `${frontPart}-${maskedBackPart}`;
      }
    }

    return {
      name,
      phoneNumber,
      registrationNumber,
      chartNumber,
      address,
      memo,
    };
  }

  private preprocessPhoneNumber(phoneNumber: string): string {
    const digitsOnly: string = phoneNumber.replace(/\D/g, '');

    if (!digitsOnly) {
      throw new BadRequestException('전화번호는 숫자만 작성되어야합니다.');
    }

    if (!digitsOnly.startsWith('0')) {
      return '0' + digitsOnly;
    }

    return digitsOnly;
  }
}
