import bcrypt from 'bcryptjs';

export class BcryptService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}


