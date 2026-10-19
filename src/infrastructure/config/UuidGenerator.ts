import { randomUUID } from 'crypto';
import { IIdGenerator } from '../../domain/ports/IIdGenerator';

export class UuidGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
