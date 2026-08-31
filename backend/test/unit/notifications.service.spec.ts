import { describe, expect, it, vi } from "vitest";
import { NotificationsService } from "../../src/modules/notifications/notifications.service";

function setup() {
  const notification = {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    create: vi.fn().mockResolvedValue({ id: "notification-1" }),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const prisma = {
    notification,
    user: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  return { service: new NotificationsService(prisma as any), prisma, notification };
}

describe("NotificationsService recipient isolation", () => {
  it("lists staff notifications only for the authenticated user", async () => {
    const { service, notification } = setup();
    await service.list({ userId: "user-a" });

    expect(notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-a", volunteerId: null },
    }));
    expect(notification.count).toHaveBeenCalledWith({
      where: { userId: "user-a", volunteerId: null, readAt: null },
    });
  });

  it("lists volunteer notifications only for the authenticated volunteer", async () => {
    const { service, notification } = setup();
    await service.list({ volunteerId: "volunteer-a" });

    expect(notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { volunteerId: "volunteer-a", userId: null },
    }));
  });

  it("cannot mark another user's notification as read", async () => {
    const { service, notification } = setup();
    notification.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.markRead("owned-by-b", { userId: "user-a" })).rejects.toMatchObject({ status: 404 });
    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { id: "owned-by-b", userId: "user-a", volunteerId: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("marks all as read without crossing principal boundaries", async () => {
    const { service, notification } = setup();
    await service.markAllRead({ volunteerId: "volunteer-a" });

    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { volunteerId: "volunteer-a", userId: null, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
