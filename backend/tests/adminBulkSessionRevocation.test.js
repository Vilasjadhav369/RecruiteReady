import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { bulkUpdateStudentStatus } from '../src/controllers/adminController.js';
import User from '../src/models/User.js';
import Session from '../src/models/Session.js';
import * as securityLogger from '../src/services/securityLogger.js';

describe('Admin Bulk Student Status & Session Revocation Suite (Hermetic Mocks)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(securityLogger, 'logSecurityEvent').mockResolvedValue({});
  });

  it('excludes admin accounts before status change and never revokes admin or acting admin sessions', async () => {
    const student1Id = new mongoose.Types.ObjectId();
    const student2Id = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();
    const actingAdminSessionId = new mongoose.Types.ObjectId();

    // Mock User.find to return only students matching role: 'student'
    const findSelectSpy = vi.fn().mockResolvedValue([
      { _id: student1Id },
      { _id: student2Id },
    ]);
    const userFindSpy = vi.spyOn(User, 'find').mockReturnValue({
      select: findSelectSpy,
    });

    const userUpdateManySpy = vi.spyOn(User, 'updateMany').mockResolvedValue({
      modifiedCount: 2,
    });

    const sessionUpdateManySpy = vi.spyOn(Session, 'updateMany').mockResolvedValue({
      modifiedCount: 2,
    });

    const req = {
      body: {
        ids: [student1Id.toString(), student2Id.toString(), adminId.toString()],
        isActive: false,
      },
      user: {
        _id: adminId,
        role: 'admin',
        sessionId: actingAdminSessionId,
      },
    };

    let responseStatus = 200;
    let responseBody = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseBody = data;
            return data;
          },
        };
      },
    };
    const next = vi.fn();

    await bulkUpdateStudentStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(responseStatus).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.modifiedCount).toBe(2);

    // 1. Verify User.find strictly filtered by role: 'student'
    expect(userFindSpy).toHaveBeenCalledTimes(1);
    expect(userFindSpy).toHaveBeenCalledWith({
      _id: { $in: [student1Id.toString(), student2Id.toString(), adminId.toString()] },
      role: 'student',
    });

    // 2. Verify User.updateMany only updated the students, not the admin
    expect(userUpdateManySpy).toHaveBeenCalledTimes(1);
    const userUpdateCall = userUpdateManySpy.mock.calls[0];
    const updatedUserIds = userUpdateCall[0]._id.$in.map((id) => id.toString());
    expect(updatedUserIds).toContain(student1Id.toString());
    expect(updatedUserIds).toContain(student2Id.toString());
    expect(updatedUserIds).not.toContain(adminId.toString());

    // 3. Verify Session.updateMany revoked sessions ONLY for students, never admin or acting admin
    expect(sessionUpdateManySpy).toHaveBeenCalledTimes(1);
    const sessionUpdateCall = sessionUpdateManySpy.mock.calls[0];
    const sessionFilter = sessionUpdateCall[0];
    const sessionUserIds = sessionFilter.user.$in.map((id) => id.toString());

    expect(sessionUserIds).toContain(student1Id.toString());
    expect(sessionUserIds).toContain(student2Id.toString());
    expect(sessionUserIds).not.toContain(adminId.toString());
    expect(sessionFilter._id).toEqual({ $ne: actingAdminSessionId });
    expect(sessionFilter.revokedAt).toBeNull();
  });

  it('does not revoke any sessions or update users when only admin IDs are provided', async () => {
    const adminId = new mongoose.Types.ObjectId();

    // User.find returns no students when only admin ID is queried with role: 'student'
    vi.spyOn(User, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    });

    const userUpdateManySpy = vi.spyOn(User, 'updateMany').mockResolvedValue({
      modifiedCount: 0,
    });
    const sessionUpdateManySpy = vi.spyOn(Session, 'updateMany').mockResolvedValue({
      modifiedCount: 0,
    });

    const req = {
      body: {
        ids: [adminId.toString()],
        isActive: false,
      },
      user: {
        _id: adminId,
        role: 'admin',
        sessionId: new mongoose.Types.ObjectId(),
      },
    };

    let responseBody = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseBody = data;
          return data;
        },
      }),
    };
    const next = vi.fn();

    await bulkUpdateStudentStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.modifiedCount).toBe(0);

    // No updates or session revocations should execute
    expect(userUpdateManySpy).not.toHaveBeenCalled();
    expect(sessionUpdateManySpy).not.toHaveBeenCalled();
  });

  it('does not invoke Session.updateMany when isActive is true (activation)', async () => {
    const studentId = new mongoose.Types.ObjectId();

    vi.spyOn(User, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: studentId }]),
    });
    vi.spyOn(User, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
    const sessionUpdateManySpy = vi.spyOn(Session, 'updateMany');

    const req = {
      body: {
        ids: [studentId.toString()],
        isActive: true,
      },
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'admin',
      },
    };

    const res = {
      status: () => ({
        json: vi.fn(),
      }),
    };
    const next = vi.fn();

    await bulkUpdateStudentStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sessionUpdateManySpy).not.toHaveBeenCalled();
  });
});
