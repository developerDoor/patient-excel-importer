import {
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiConsumes, ApiCreatedResponse,
} from '@nestjs/swagger';
import { PatientModel } from './entities/patient.entity'
import { PaginationDto, PaginatedResponseDto } from './dto/patient.dto';
import { UploadExcelDtoResponse } from './dto/upload-excel.dto';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('uploads')
  @ApiOperation({
    summary: '환자 등록 API',
    description: '엑셀 파일을 업로드해 환자 정보를 등록한다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: '등록 성공', type: UploadExcelDtoResponse})
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcelFile(@UploadedFile() file: Express.Multer.File): Promise<UploadExcelDtoResponse> {
    if (!file) {
      throw new BadRequestException('엑셀 파일이 필요합니다.');
    }

    const result = await this.patientsService.processPatientExcel(file);
    return result;
  }

  @Get()
  @ApiOperation({
    summary: '환자 조회 API',
    description: '환자 정보를 조회한다.',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<PatientModel>> {
    const page = paginationDto.page;
    const limit = paginationDto.limit;
    return this.patientsService.findAll(page, limit);
  }
}
