import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesS3PresignedService } from './files.service';
import { FileUploadDto } from './dto/file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { ApiSuccessResponse } from '../../../../utils/dto/api-success-response.dto';

@ApiTags('文件')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesS3PresignedController {
  constructor(private readonly filesService: FilesS3PresignedService) {}

  @ApiCreatedResponse({
    type: ApiSuccessResponse(FileResponseDto, { codeExample: 201 }),
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiOperation({ summary: '获取预签名上传地址' })
  async uploadFile(@Body() file: FileUploadDto) {
    return this.filesService.create(file);
  }
}
