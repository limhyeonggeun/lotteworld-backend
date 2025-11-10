const express = require("express");
const { Notification, User } = require("../models");
const trySendPush = require("../utils/sendPush");
const { Op } = require("sequelize");

const router = express.Router();

async function sendNotificationStatus(notification, user) {
  try {
    const success = await trySendPush(notification, user.fcmToken);
    await notification.update({
      status: success ? "sent" : "failed",
      failReason: success ? null : "FCM 전송 실패 또는 유효하지 않은 토큰",
    });
  } catch (err) {
    await notification.update({
      status: "failed",
      failReason: err.message || "알 수 없는 오류로 전송 실패",
    });
  }
}

router.post("/", async (req, res) => {
  const { recipient, userId, type, title, content, scheduledAt, sendImmediately } = req.body;
  if (!recipient || !type || !title || !content) {
    return res.status(400).json({ message: "필수 필드 누락" });
  }

  const now = new Date();
  const status = sendImmediately ? "sent" : "scheduled";
  const deliveryTime = sendImmediately ? now : scheduledAt || now;

  try {
    if (recipient === "all_users") {
      const allUsers = await User.findAll({ attributes: ["id", "fcmToken"] });

      const notifications = await Promise.all(
        allUsers.map((user) =>
          Notification.create({
            userId: user.id,
            type,
            title,
            content,
            deliveryMethod: "push",
            recipient,
            status,
            scheduledAt: deliveryTime,
            read: false,
          })
        )
      );

      if (sendImmediately) {
        await Promise.all(
          notifications.map(async (n) => {
            const user = allUsers.find((u) => u.id === n.userId);
            if (!user?.fcmToken) {
              await n.update({
                status: "failed",
                failReason: "FCM 토큰 없음",
              });
              return;
            }
            await sendNotificationStatus(n, user);
          })
        );
      }

      return res.status(201).json({
        message: "전체 사용자에게 알림 전송 완료",
        count: notifications.length,
      });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId는 필수입니다." });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      content,
      deliveryMethod: "push",
      recipient,
      status,
      scheduledAt: deliveryTime,
      read: false,
    });

    if (sendImmediately) {
      const targetUser = await User.findByPk(userId, { attributes: ["fcmToken"] });
      if (!targetUser?.fcmToken) {
        await notification.update({
          status: "failed",
          failReason: "FCM 토큰 없음",
        });
      } else {
        await sendNotificationStatus(notification, targetUser);
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "알림 생성 실패", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "알림 전체 조회 실패", error: err.message });
  }
});

router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids 배열이 필요합니다." });
    }

    const targets = await Notification.findAll({ where: { id: ids } });
    if (!targets.length)
      return res.status(404).json({ message: "삭제할 알림을 찾을 수 없습니다." });

    const deleteConditions = targets.map((target) => {
      if (target.recipient === "all_users") {
        return {
          recipient: "all_users",
          title: target.title,
          content: target.content,
          type: target.type,
          scheduledAt: target.scheduledAt,
        };
      }
      return { id: target.id };
    });

    const deleteCount = await Notification.destroy({
      where: { [Op.or]: deleteConditions },
    });

    res.json({ message: "관리자 일괄 삭제 완료", count: deleteCount });
  } catch (err) {
    res.status(500).json({ message: "일괄 삭제 실패", error: err.message });
  }
});

router.post("/bulk-resend", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "ids 배열이 필요합니다." });

    const notifications = await Notification.findAll({
      where: { id: ids },
      include: [{ model: User, attributes: ["fcmToken"] }],
    });

    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      notifications.map(async (n) => {
        const user = n.User;
        if (!user?.fcmToken) {
          failCount++;
          await n.update({ status: "failed", failReason: "FCM 토큰 없음" });
          return;
        }

        const success = await trySendPush(n, user.fcmToken);
        await n.update({
          status: success ? "sent" : "failed",
          failReason: success ? null : "FCM 전송 실패",
          scheduledAt: new Date(),
        });
        success ? successCount++ : failCount++;
      })
    );

    res.json({
      message: `관리자 일괄 재전송 완료 (${successCount} 성공, ${failCount} 실패)`,
      successCount,
      failCount,
    });
  } catch (err) {
    res.status(500).json({ message: "일괄 재전송 실패", error: err.message });
  }
});

router.get("/failed", async (req, res) => {
  try {
    const failed = await Notification.findAll({
      where: { status: "failed" },
      include: [{ model: User, attributes: ["id", "email"] }],
      order: [["updatedAt", "DESC"]],
    });
    res.json(failed);
  } catch (err) {
    res.status(500).json({ message: "실패한 알림 조회 실패", error: err.message });
  }
});

router.post("/:id/resend", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification)
      return res.status(404).json({ message: "해당 알림이 존재하지 않습니다." });

    if (notification.recipient === "all_users") {
      const failedNotifications = await Notification.findAll({
        where: {
          title: notification.title,
          content: notification.content,
          type: notification.type,
          scheduledAt: notification.scheduledAt,
          recipient: "all_users",
          status: "failed",
        },
        include: [{ model: User, attributes: ["id", "fcmToken"] }],
      });

      if (!failedNotifications.length)
        return res.json({ message: "실패한 대상이 없습니다.", success: true });

      let sentCount = 0;
      let failCount = 0;

      await Promise.all(
        failedNotifications.map(async (n) => {
          const user = n.User;
          if (!user?.fcmToken) {
            await n.update({ failReason: "FCM 토큰 없음" });
            failCount++;
            return;
          }

          const success = await trySendPush(n, user.fcmToken);
          await n.update({
            status: success ? "sent" : "failed",
            failReason: success ? null : "FCM 전송 실패",
            scheduledAt: new Date(),
          });

          success ? sentCount++ : failCount++;
        })
      );

      return res.json({
        message: `실패 사용자 재전송 완료 (${sentCount} 성공, ${failCount} 실패)`,
        success: true,
        sentCount,
        failCount,
      });
    }

    const targetUser = await User.findByPk(notification.userId, {
      attributes: ["fcmToken"],
    });

    if (!targetUser?.fcmToken) {
      await notification.update({
        status: "failed",
        failReason: "FCM 토큰 없음",
      });
      return res.status(400).json({ message: "FCM 토큰이 없습니다." });
    }

    const success = await trySendPush(notification, targetUser.fcmToken);
    await notification.update({
      status: success ? "sent" : "failed",
      failReason: success ? null : "FCM 전송 실패",
      scheduledAt: new Date(),
      deliveryMethod: "push",
    });

    res.json({
      message: success ? "즉시 전송 완료" : "전송 실패",
      success,
    });
  } catch (err) {
    res.status(500).json({
      message: "재전송 중 오류 발생",
      error: err.message,
    });
  }
});

// ✅ 사용자별 알림 조회
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "유효하지 않은 userId" });
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // 알림이 없어도 200으로 빈 배열 반환 (프론트 404 방지)
    return res.status(200).json(notifications);
  } catch (err) {
    console.error("사용자 알림 조회 실패:", err);
    res.status(500).json({ message: "사용자 알림 조회 실패", error: err.message });
  }
});

module.exports = router;