const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { Notification, User } = require("../models");
const trySendPush = require("../utils/sendPush");
const { Op } = require("sequelize");

const router = express.Router();

// 🔹 푸시 전송 및 상태 업데이트 공통 함수
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

// ✅ 사용자별 알림 조회
router.get("/user/:userId", auth, async (req, res) => {
  const { userId } = req.params;

  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ message: "접근 권한이 없습니다." });
  }

  try {
    const notifications = await Notification.findAll({
      where: {
        userId,
        [Op.or]: [{ status: "failed" }, { read: false }],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "알림 조회 실패", error: err.message });
  }
});

// ✅ 알림 생성
router.post("/", async (req, res) => {
  const { recipient, userId, type, title, content, scheduledAt, sendImmediately } = req.body;

  if (!recipient || !type || !title || !content) {
    return res.status(400).json({ message: "필수 필드 누락" });
  }

  const now = new Date();
  const status = sendImmediately ? "sent" : "scheduled";
  const deliveryTime = sendImmediately ? now : scheduledAt || now;

  try {
    // 전체 사용자 대상
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

    // 개별 사용자 대상
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

// ✅ 전체 조회
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

// ✅ 삭제 (사용자 기준)
router.delete("/:id", auth, async (req, res) => {
  try {
    const target = await Notification.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: "해당 알림이 존재하지 않습니다." });

    if (target.userId !== req.user.id) {
      return res.status(403).json({ message: "본인의 알림만 삭제할 수 있습니다." });
    }

    await target.update({ read: true });
    res.json({ message: "알림이 삭제되었습니다 (숨김 처리)" });
  } catch (err) {
    res.status(500).json({ message: "알림 삭제 실패", error: err.message });
  }
});

// ✅ 수정
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Notification.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated === 0) return res.status(404).json({ message: "해당 알림이 존재하지 않습니다." });

    const updatedNotification = await Notification.findByPk(req.params.id);
    res.json(updatedNotification);
  } catch (err) {
    res.status(500).json({ message: "알림 수정 실패", error: err.message });
  }
});

// ✅ 일괄 삭제
router.post("/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: "ids 배열이 필요합니다." });

  try {
    const deleteCount = await Notification.destroy({ where: { id: ids } });
    res.json({ message: "일괄 삭제 완료", count: deleteCount });
  } catch (err) {
    res.status(500).json({ message: "일괄 삭제 실패", error: err.message });
  }
});

// ✅ 일괄 재전송
router.post("/bulk-resend", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: "ids 배열이 필요합니다." });

  try {
    const notifications = await Notification.findAll({ where: { id: ids } });
    for (const n of notifications) {
      const targetUser = await User.findByPk(n.userId, { attributes: ["fcmToken"] });
      if (!targetUser?.fcmToken) {
        await n.update({ status: "failed", failReason: "FCM 토큰 없음" });
        continue;
      }
      await sendNotificationStatus(n, targetUser);
    }
    res.json({ message: "일괄 재전송 완료", count: notifications.length });
  } catch (err) {
    res.status(500).json({ message: "일괄 재전송 실패", error: err.message });
  }
});

// ✅ 실패한 알림 조회
router.get("/failed", async (req, res) => {
  try {
    const failed = await Notification.findAll({
      where: { status: "failed" },
      include: [{ model: User, attributes: ["id", "email"] }],
      order: [["updatedAt", "DESC"]],
    });
    res.json(failed);
  } catch (err) {
    console.error("실패한 알림 조회 오류:", err);
    res.status(500).json({ message: "실패한 알림 조회 실패", error: err.message });
  }
});

module.exports = router;