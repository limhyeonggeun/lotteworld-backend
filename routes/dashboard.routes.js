const express = require("express");
const { Order, User } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

function getKSTDate(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

function getKSTTodayRangeAsUTC() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const startUTC = new Date(Date.UTC(y, m, d, -9, 0, 0));
  const endUTC = new Date(Date.UTC(y, m, d + 1, -9, 0, 0) - 1);
  return [startUTC, endUTC];
}

function getUTCStartAndEndFromKST(kstDate) {
  const startUTC = new Date(Date.UTC(kstDate.getFullYear(), kstDate.getMonth(), kstDate.getDate(), -9, 0, 0));
  const endUTC = new Date(Date.UTC(kstDate.getFullYear(), kstDate.getMonth(), kstDate.getDate() + 1, -9, 0, 0) - 1);
  return [startUTC, endUTC];
}

function formatKSTDateYMD(d = new Date()) {
  const kst = getKSTDate(d);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

router.get("/today", async (req, res) => {
  try {
    const [startUTC, endUTC] = getKSTTodayRangeAsUTC();

    const reservationOrders = await Order.findAll({
      where: {
        createdAt: { [Op.between]: [startUTC, endUTC] },
        status: { [Op.not]: "취소완료" },
      },
    });

    const reservationCount = reservationOrders.reduce((acc, order) => {
      try {
        let counts = order.counts;
        if (typeof counts === "string") counts = JSON.parse(counts || "{}");
        const sum = Object.values(counts || {}).reduce((s, n) => s + (Number(n) || 0), 0);
        return acc + (sum > 0 ? sum : (Number(order.quantity) || 0));
      } catch {
        return acc + (Number(order.quantity) || 0);
      }
    }, 0);

    const kstTodayStr = formatKSTDateYMD();
    const visitorOrders = await Order.findAll({
      where: {
        status: "사용완료",
        [Op.or]: [
          { visitDate: { [Op.between]: [startUTC, endUTC] } },
          { visitDate: kstTodayStr },
          { visitDate: { [Op.like]: `${kstTodayStr}%` } },
        ],
      },
    });

    const totalVisitors = visitorOrders.reduce((acc, order) => {
      try {
        let counts = order.counts;
        if (typeof counts === "string") counts = JSON.parse(counts || "{}");
        const sum = Object.values(counts || {}).reduce((s, n) => s + (Number(n) || 0), 0);
        return acc + (sum > 0 ? sum : (Number(order.quantity) || 0));
      } catch {
        return acc + (Number(order.quantity) || 0);
      }
    }, 0);

    res.json({ reservationCount, totalVisitors });
  } catch (err) {
    res.status(500).json({ error: "오늘 예약 정보 조회 실패" });
  }
});

router.get("/reservations-week", async (req, res) => {
  try {
    const kstNow = getKSTDate();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const kstDate = new Date(kstNow);
      kstDate.setDate(kstNow.getDate() - i);
      const [startUTC, endUTC] = getUTCStartAndEndFromKST(kstDate);

      const orders = await Order.findAll({
        where: {
          createdAt: { [Op.between]: [startUTC, endUTC] },
          status: { [Op.not]: "취소완료" },
        },
      });

      const peopleSum = orders.reduce((acc, order) => {
        try {
          let counts = order.counts;
          if (typeof counts === "string") counts = JSON.parse(counts || "{}");
          if (counts && typeof counts === "object") {
            const sum = Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0);
            if (sum > 0) return acc + sum;
          }
        } catch {}
        return acc + (Number(order.quantity) || 0);
      }, 0);

      result.push({
        day: `${kstDate.getMonth() + 1}/${kstDate.getDate()}`,
        value: peopleSum,
      });
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: "예약 추이 조회 실패" });
  }
});

router.get("/members-week", async (req, res) => {
  try {
    const kstNow = getKSTDate();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const kstDate = new Date(kstNow);
      kstDate.setDate(kstNow.getDate() - i);
      const [startUTC, endUTC] = getUTCStartAndEndFromKST(kstDate);

      const count = await User.count({
        where: { createdAt: { [Op.between]: [startUTC, endUTC] } },
      });

      result.push({
        day: `${kstDate.getMonth() + 1}/${kstDate.getDate()}`,
        value: count,
      });
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: "회원 추이 조회 실패" });
  }
});

module.exports = router;