import * as bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../types';

export async function register(data: {
  companyName: string;
  companyDomain: string;
  name: string;
  email: string;
  password: string;
  companyType?: 'BUYER' | 'SUPPLIER';
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new AppError(409, 'Email already registered');

  const existingCompany = await prisma.company.findUnique({
    where: { domain: data.companyDomain },
  });
  if (existingCompany) throw new AppError(409, 'Company domain already registered');

  const passwordHash = await bcrypt.hash(data.password, 12);

  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      domain: data.companyDomain,
      companyType: data.companyType ?? 'BUYER',
      settings: { create: {} },
      users: {
        create: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];
  const payload: JwtPayload = { userId: user.id, companyId: company.id, role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.setex(`refresh:${user.id}`, 7 * 24 * 3600, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    company: { id: company.id, name: company.name, domain: company.domain },
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) throw new AppError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  const payload: JwtPayload = { userId: user.id, companyId: user.companyId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.setex(`refresh:${user.id}`, 7 * 24 * 3600, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    company: { id: user.company.id, name: user.company.name, domain: user.company.domain },
  };
}

export async function refreshTokens(token: string) {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const stored = await redis.get(`refresh:${payload.userId}`);
  if (stored !== token) throw new AppError(401, 'Refresh token revoked or expired');

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await redis.setex(`refresh:${payload.userId}`, 7 * 24 * 3600, refreshToken);

  return { accessToken, refreshToken };
}

export async function logout(userId: string) {
  await redis.del(`refresh:${userId}`);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: { include: { settings: true } } },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}
