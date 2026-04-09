import type { User } from '@nextride/shared';
import type { IUserRepository } from '../repositories/interfaces';
import type { UpdateUserInput } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class UserService {
  constructor(private users: IUserRepository) {}

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
  }

  async listAll(): Promise<User[]> {
    return this.users.findAll();
  }

  async upsertFromToken(claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }): Promise<User> {
    return this.users.upsertFromToken(claims);
  }

  // TODO: Expose a coordinator-only endpoint to deactivate a user account.
  // MockUserRepository.deactivate() and IUserRepository already define the
  // contract; it just needs a route + service method wired up.

  async updateMe(id: string, data: UpdateUserInput): Promise<User> {
    try {
      return await this.users.update(id, data);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === 'P2025' || (err instanceof Error && err.message.includes('not found'))) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }
      throw err;
    }
  }
}
