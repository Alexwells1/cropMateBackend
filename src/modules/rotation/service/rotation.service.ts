import { Types } from 'mongoose';
import { RotationHistoryModel } from '../repository/rotationHistory.model';
import { CropModel } from '../../crop/repository/crop.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { IRotationHistory } from '../../../types';
import logger from '../../../infrastructure/logger';

interface RotationRule {
  nextCrop: string;
  reason: string;
}

// Agronomic rotation knowledge base
const ROTATION_RULES: Record<string, RotationRule> = {
  maize: {
    nextCrop: 'Cowpea',
    reason:
      'Cowpea is a nitrogen-fixing legume that restores soil nitrogen depleted by maize. It also breaks maize-specific pest cycles.',
  },
  corn: {
    nextCrop: 'Cowpea',
    reason:
      'Cowpea restores nitrogen depleted by corn and interrupts rootworm and stalk borer cycles.',
  },
  tomato: {
    nextCrop: 'Onion',
    reason:
      'Onion helps break early blight and fusarium disease cycles common in tomato. The two crops do not share major pests.',
  },
  pepper: {
    nextCrop: 'Maize',
    reason:
      'Maize is unrelated to pepper and does not share its disease pathogens. It also provides windbreak during the next growing season.',
  },
  beans: {
    nextCrop: 'Maize',
    reason:
      'Maize benefits from the residual nitrogen fixed by beans in the previous season.',
  },
  cowpea: {
    nextCrop: 'Sorghum',
    reason:
      'Sorghum benefits from cowpea nitrogen enrichment and is drought-tolerant, making it ideal as a follow-up crop.',
  },
  sorghum: {
    nextCrop: 'Groundnut',
    reason:
      'Groundnut restores nitrogen and organic matter depleted by sorghum, improving soil fertility.',
  },
  groundnut: {
    nextCrop: 'Sorghum',
    reason:
      'Sorghum leverages nitrogen fixed by groundnut and helps suppress groundnut fungal diseases in subsequent seasons.',
  },
  cassava: {
    nextCrop: 'Groundnut',
    reason:
      'Groundnut restores nitrogen and organic matter heavily depleted by cassava cultivation.',
  },
  yam: {
    nextCrop: 'Melon',
    reason:
      'Melon has different nutrient demands than yam and does not share its fungal diseases, allowing soil recovery.',
  },
  rice: {
    nextCrop: 'Beans',
    reason:
      'Beans fix atmospheric nitrogen depleted by rice cultivation and help break rice blast fungus cycles.',
  },
  wheat: {
    nextCrop: 'Sunflower',
    reason:
      'Sunflower breaks cereal disease cycles, has deep roots that improve soil structure, and has minimal shared pests with wheat.',
  },
  onion: {
    nextCrop: 'Carrot',
    reason:
      'Carrot and onion repel each other\'s pests — carrot fly and onion fly — making them an ideal rotation pair.',
  },
  carrot: {
    nextCrop: 'Onion',
    reason:
      'Onion repels carrot fly while carrot repels onion fly. This rotation reduces pesticide dependence.',
  },
  cabbage: {
    nextCrop: 'Legume',
    reason:
      'Legumes replenish nitrogen depleted by heavy-feeding brassicas like cabbage and break clubroot disease cycles.',
  },
};

function getRecommendation(cropName: string): RotationRule {
  const key = cropName.toLowerCase().trim();
  return (
    ROTATION_RULES[key] ?? {
      nextCrop: 'Cowpea',
      reason:
        'Cowpea is a versatile legume that fixes nitrogen, improves soil organic matter, and benefits most subsequent crops.',
    }
  );
}

export interface RotationPlanResult {
  history: IRotationHistory[];
  recommendation: {
    previousCrop: string;
    recommendedNextCrop: string;
    reason: string;
  } | null;
}

export async function getRotationPlan(
  farmId: string,
  userId: string
): Promise<RotationPlanResult> {
  await verifyFarmOwnership(farmId, userId);

  // Get last harvested crop
  const lastHarvested = await CropModel.findOne({
    farmId: new Types.ObjectId(farmId),
    status: 'harvested',
  })
    .sort({ updatedAt: -1 })
    .lean();

  // Get rotation history
  const history = await RotationHistoryModel.find({
  farmId: new Types.ObjectId(farmId),
})
  .sort({ seasonYear: -1 })
  .limit(10)
  .lean() as unknown as IRotationHistory[];

  if (!lastHarvested) {
    return { history, recommendation: null };
  }

  const rule = getRecommendation(lastHarvested.cropName);
  const currentYear = new Date().getFullYear();

  // Record the recommendation (idempotent — skip if already recorded this season)
  const existing = await RotationHistoryModel.findOne({
    farmId: new Types.ObjectId(farmId),
    cropId: lastHarvested._id,
    seasonYear: currentYear,
  });

  if (!existing) {
    await RotationHistoryModel.create({
      farmId: new Types.ObjectId(farmId),
      cropId: lastHarvested._id,
      previousCrop: lastHarvested.cropName,
      seasonYear: currentYear,
      recommendedNextCrop: rule.nextCrop,
      reason: rule.reason,
    });
    logger.info(`[Rotation] Recommendation recorded for farm: ${farmId}`);
  }

  return {
    history,
    recommendation: {
      previousCrop: lastHarvested.cropName,
      recommendedNextCrop: rule.nextCrop,
      reason: rule.reason,
    },
  };
}
