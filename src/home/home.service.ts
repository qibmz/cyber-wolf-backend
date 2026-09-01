import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { AppInfoDto } from './dto/app-info.dto';

@Injectable()
export class HomeService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  appInfo(): AppInfoDto {
    return {
      name: this.configService.get('app.name', { infer: true }) || 'app',
    };
  }
}
