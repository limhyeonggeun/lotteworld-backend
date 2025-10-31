const express = require('express');
const router = express.Router();
const { CardBenefitGroup, CardBenefitOption } = require('../models');

router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const groups = await CardBenefitGroup.findAll({
      where: { ticketId },
      include: [
        {
          model: CardBenefitOption,
          as: 'options',
        },
      ],
    });

    const cardMap = {};
    const rawCategoryMap = {};

    for (const group of groups) {
      const cardName = group.cardName;
      const category = group.category;

      if (!cardMap[cardName]) {
        cardMap[cardName] = {};
      }

      if (!rawCategoryMap[category]) {
        rawCategoryMap[category] = [];
      }

      if (!rawCategoryMap[category].includes(cardName)) {
        rawCategoryMap[category].push(cardName);
      }

      for (const option of group.options) {
        cardMap[cardName][option.optionName] = {
          basePrice: {
            adult: option.basePriceAdult ?? 0,
            teen: option.basePriceTeen ?? 0,
            child: option.basePriceChild ?? 0,
          },
          discountPercent: {
            adult: option.discountPercentAdult ?? 0,
            teen: option.discountPercentTeen ?? 0,
            child: option.discountPercentChild ?? 0,
          },
          detailText: option.detailText,
          maxCount: {
            adult: option.maxAdult ?? 0,
            teen: option.maxTeen ?? 0,
            child: option.maxChild ?? 0,
          },
        };
      }
    }

    const categoryMap = {
      monthly: rawCategoryMap['이달의 혜택'] || [],
      card: rawCategoryMap['제휴카드'] || [],
      point: rawCategoryMap['포인트'] || [],
    };

    res.status(200).json({ cardMap, categoryMap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '불러오기 실패', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ticketId, cardName, category, options } = req.body;

    const group = await CardBenefitGroup.create({ ticketId, cardName, category });

    const createdOptions = await Promise.all(
      options.map((opt) =>
        CardBenefitOption.create({
          cardBenefitGroupId: group.id,
          optionName: opt.optionName,
          benefit: opt.benefit,
          detailText: opt.detailText,
          maxAdult: opt.maxCount?.adult,
          maxTeen: opt.maxCount?.teen,
          maxChild: opt.maxCount?.child,
          basePriceAdult: opt.basePriceAdult ?? 0,
          basePriceTeen: opt.basePriceTeen ?? 0,
          basePriceChild: opt.basePriceChild ?? 0,
          discountPercentAdult: opt.discountPercentAdult ?? 0,
          discountPercentTeen: opt.discountPercentTeen ?? 0,
          discountPercentChild: opt.discountPercentChild ?? 0,
        })
      )
    );

    res.status(201).json({ group, options: createdOptions });
  } catch (err) {
    console.error('등록 실패:', err);
    res.status(500).json({ error: '등록 실패', details: err.message });
  }
});

module.exports = router;