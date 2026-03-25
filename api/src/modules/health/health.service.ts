import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  checkHealth() {
    return { status: 'ok', info: { api: { status: 'up' } } };
  }
}
