import { prisma } from './client';
import { mapUser } from './mappers';
import type { IUserRepository } from '../interfaces';
import type { User, UserRole } from '@nextride/shared';
import type { UpdateUserInput } from '@nextride/shared';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { externalId } });
    return row ? mapUser(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await prisma.user.findMany({ orderBy: { displayName: 'asc' } });
    return rows.map(mapUser);
  }

  async upsertFromToken(claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }): Promise<User> {
    const role = deriveRole(claims.roles ?? []);
    const displayName = claims.name ?? claims.preferred_username ?? claims.email;

    const row = await prisma.user.upsert({
      where: { externalId: claims.sub },
      create: {
        externalId: claims.sub,
        email: claims.email,
        displayName,
        role,
        notificationChannels: ['email'],
      },
      update: {
        email: claims.email,
        displayName,
      },
    });
    return mapUser(row);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: {
        displayName: data.displayName,
        phone: data.phone,
        notificationChannels: data.notificationChannels,
      },
    });
    return mapUser(row);
  }

  async deactivate(id: string): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    return mapUser(row);
  }
}

/** Map Keycloak realm roles to our UserRole enum. */
function deriveRole(roles: string[]): UserRole {
  if (roles.includes('coordinator')) return 'coordinator';
  if (roles.includes('facility')) return 'facility';
  if (roles.includes('pilot')) return 'pilot';
  return 'rider';
}
