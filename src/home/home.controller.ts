import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../utils/dto/api-success-response.dto';
import { AppInfoDto } from './dto/app-info.dto';
import { HomeService } from './home.service';

@ApiTags('home')
@Controller()
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Get()
  @ApiOperation({ summary: '应用信息' })
  @ApiOkResponse({ type: ApiSuccessResponse(AppInfoDto) })
  appInfo(): AppInfoDto {
    return this.service.appInfo();
  }
}
