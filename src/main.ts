import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Patients API')
    .setDescription('환자 정보 등록, 조회 API')
    .setVersion('0.0.1')
    .addServer('http://localhost:3000/', 'Local environment')
    .addTag('')
    .build();

  const documentFactory = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
