import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MachineRepository } from '../domain/machine.repository';
import {
  GeoPolygon,
  Machine,
  NewPosition,
  Position,
} from '../domain/machine.types';

interface MachineWithPositionRow {
  id: string;
  name: string;
  pos_id: string | null;
  lat: number | null;
  lng: number | null;
  timestamp: Date | null;
}

interface PositionRow {
  id: string;
  machine_id: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

interface DistanceRow {
  distance: number;
}

@Injectable()
export class PrismaMachineRepository implements MachineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithLastPosition(): Promise<Machine[]> {
    const rows = await this.prisma.$queryRaw<MachineWithPositionRow[]>`
      SELECT
        m.id,
        m.name,
        p.id AS pos_id,
        ST_Y(p.location) AS lat,
        ST_X(p.location) AS lng,
        p.timestamp
      FROM machines m
      LEFT JOIN LATERAL (
        SELECT id, location, timestamp
        FROM positions
        WHERE machine_id = m.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) p ON true
      ORDER BY m.id
    `;

    return rows.map((row) => this.toMachine(row));
  }

  async findTraceByPeriod(
    machineId: string,
    from: Date,
    to: Date,
  ): Promise<Position[]> {
    const rows = await this.prisma.$queryRaw<PositionRow[]>`
      SELECT
        id,
        machine_id,
        ST_Y(location) AS lat,
        ST_X(location) AS lng,
        timestamp
      FROM positions
      WHERE machine_id = ${machineId}
        AND timestamp BETWEEN ${from} AND ${to}
      ORDER BY timestamp ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      machineId: row.machine_id,
      location: { lat: row.lat, lng: row.lng },
      timestamp: row.timestamp,
    }));
  }

  async findMachinesInZone(zone: GeoPolygon): Promise<Machine[]> {
    const rows = await this.prisma.$queryRaw<MachineWithPositionRow[]>`
      SELECT
        m.id,
        m.name,
        p.id AS pos_id,
        ST_Y(p.location) AS lat,
        ST_X(p.location) AS lng,
        p.timestamp
      FROM machines m
      JOIN LATERAL (
        SELECT id, location, timestamp
        FROM positions
        WHERE machine_id = m.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) p ON true
      WHERE ST_Within(
        p.location,
        ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326)
      )
      ORDER BY m.id
    `;

    return rows.map((row) => this.toMachine(row));
  }

  async getDistanceInZone(
    machineId: string,
    zone: GeoPolygon,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<DistanceRow[]>`
      SELECT COALESCE(
        ST_Length(
          ST_Intersection(
            ST_MakeLine(location ORDER BY timestamp),
            ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326)
          )::geography
        ),
        0
      ) AS distance
      FROM positions
      WHERE machine_id = ${machineId}
    `;

    return rows[0]?.distance ?? 0;
  }

  async saveMachine(machine: { id: string; name: string }): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO machines (id, name)
      VALUES (${machine.id}, ${machine.name})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
  }

  async savePosition(position: NewPosition): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO positions (id, machine_id, location, timestamp)
      VALUES (
        gen_random_uuid(),
        ${position.machineId},
        ST_SetSRID(ST_MakePoint(${position.lng}, ${position.lat}), 4326),
        ${position.timestamp}
      )
    `;
  }

  async deleteAllPositions(): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM positions`;
  }

  private toMachine(row: MachineWithPositionRow): Machine {
    const machine: Machine = { id: row.id, name: row.name };

    if (row.pos_id && row.lat !== null && row.lng !== null && row.timestamp) {
      machine.positions = [
        {
          id: row.pos_id,
          machineId: row.id,
          location: { lat: row.lat, lng: row.lng },
          timestamp: row.timestamp,
        },
      ];
    }

    return machine;
  }
}
