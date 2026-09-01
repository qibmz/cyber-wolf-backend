import { registerAs } from '@nestjs/config';
import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { ObserveConfig } from '../observe-config.type';

class EnvironmentVariablesValidator {
  @IsBooleanString()
  @IsOptional()
  OBSERVE_ENABLED: string;

  @ValidateIf((env) => env.OBSERVE_ENABLED === 'true')
  @IsString()
  OBSERVE_APP_KEY: string;

  @ValidateIf((env) => env.OBSERVE_ENABLED === 'true')
  @IsString()
  OBSERVE_APP_SECRET: string;

  @IsString()
  @IsOptional()
  OBSERVE_SERVICE_ID: string;

  @IsString()
  @IsOptional()
  OBSERVE_SERVICE_VERSION: string;

  @IsNumberString()
  @IsOptional()
  OBSERVE_TRACES_SAMPLE_RATE: string;
}

export default registerAs<ObserveConfig>('observe', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const enabled = process.env.OBSERVE_ENABLED === 'true';

  return {
    enabled,
    appKey: process.env.OBSERVE_APP_KEY,
    appSecret: process.env.OBSERVE_APP_SECRET,
    serviceId: process.env.OBSERVE_SERVICE_ID || 'cyber-wolf-api',
    serviceVersion: process.env.OBSERVE_SERVICE_VERSION,
    tracesSampleRate: process.env.OBSERVE_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.OBSERVE_TRACES_SAMPLE_RATE)
      : 1,
  };
});
