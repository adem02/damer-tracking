import { Module } from '@nestjs/common';
import { MACHINE_REPOSITORY } from './domain/machine.repository';
import { PrismaMachineRepository } from './infrastructure/prisma-machine.repository';

@Module({
  providers: [
    { provide: MACHINE_REPOSITORY, useClass: PrismaMachineRepository },
  ],
  exports: [MACHINE_REPOSITORY],
})
export class MachinesModule {}
