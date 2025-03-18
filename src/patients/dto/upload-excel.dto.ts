import { ApiProperty } from '@nestjs/swagger';

export class ProcessErrorDto {
  @ApiProperty({
    description: '오류가 발생한 행 번호',
    example: 5,
  })
  row: number;

  @ApiProperty({
    description: '오류 메시지',
    example: '유효하지 않은 차트 번호 형식입니다.',
  })
  message: string;
}

export class UploadExcelDtoResponse {
  @ApiProperty({
    description: '전체 처리된 항목 수',
    example: 100,
  })
  totalProcessCount: number;

  @ApiProperty({
    description: '성공적으로 처리된 항목 수',
    example: 95,
  })
  successCount: number;

  @ApiProperty({
    description: '오류가 발생한 항목 수',
    example: 5,
  })
  errorCount: number;

  @ApiProperty({
    description: '오류 정보 목록',
    type: [ProcessErrorDto],
    isArray: true,
  })
  errors: ProcessErrorDto[];

  @ApiProperty({
    description: '차트 번호가 업데이트된 항목 수',
    example: 20,
  })
  chartNumberUpdatedCount: number;
}
