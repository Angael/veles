import { eq, inArray, sql } from 'drizzle-orm';
import {
  calorieGoals,
  foodLogs,
  foodLogShareItems,
  foodLogShares,
  foodProducts,
} from '@veles/db/schema';
import { db } from '@/server/db.server';
import { defineAgentResource } from './resource.server';

/** A share belongs to its sender and recipient; it does not grant access to the sender's diary. */
const shareScope = (userId: string) =>
  sql`(${foodLogShares.senderUserId} = ${userId} OR ${foodLogShares.recipientUserId} = ${userId})`;

export const nutritionResources = [
  defineAgentResource(
    'food_logs',
    'Your food diary. *Hundredths values are divided by 100 for kcal/grams. kcal is energy; protein, fat, carbs are separate macros.',
    foodLogs,
    {
      productId: foodLogs.productId,
      imageUploadObjectId: foodLogs.imageUploadObjectId,
      name: foodLogs.name,
      gramsHundredths: foodLogs.gramsHundredths,
      logDate: foodLogs.logDate,
      kcalHundredths: foodLogs.kcalHundredths,
      proteinHundredths: foodLogs.proteinHundredths,
      fatHundredths: foodLogs.fatHundredths,
      carbsHundredths: foodLogs.carbsHundredths,
      consumedAt: foodLogs.consumedAt,
      createdAt: foodLogs.createdAt,
    },
    foodLogs.id,
    (userId) => eq(foodLogs.userId, userId),
  ),
  defineAgentResource(
    'calorie_goals',
    'Your nutrition goals by effectiveDate. Divide *Hundredths by 100. kcal is energy; protein, fat, carbs are grams.',
    calorieGoals,
    {
      effectiveDate: calorieGoals.effectiveDate,
      kcalLimitHundredths: calorieGoals.kcalLimitHundredths,
      proteinLimitHundredths: calorieGoals.proteinLimitHundredths,
      fatLimitHundredths: calorieGoals.fatLimitHundredths,
      carbsLimitHundredths: calorieGoals.carbsLimitHundredths,
      createdAt: calorieGoals.createdAt,
      updatedAt: calorieGoals.updatedAt,
    },
    calorieGoals.id,
    (userId) => eq(calorieGoals.userId, userId),
  ),
  defineAgentResource(
    'food_products',
    'The shared public food catalog used by your logs. Divide *Hundredths by 100; nutrition is per 100g. Catalog entries are not user-owned.',
    foodProducts,
    {
      barcode: foodProducts.barcode,
      name: foodProducts.name,
      namePl: foodProducts.namePl,
      imageUploadObjectId: foodProducts.imageUploadObjectId,
      productSizeGramsHundredths: foodProducts.productSizeGramsHundredths,
      kcalPer100gHundredths: foodProducts.kcalPer100gHundredths,
      proteinPer100gHundredths: foodProducts.proteinPer100gHundredths,
      fatPer100gHundredths: foodProducts.fatPer100gHundredths,
      carbsPer100gHundredths: foodProducts.carbsPer100gHundredths,
      createdAt: foodProducts.createdAt,
      updatedAt: foodProducts.updatedAt,
    },
    foodProducts.id,
    () => sql`true`,
  ),
  defineAgentResource(
    'food_log_shares',
    'Pending food shares you sent or received. This includes only share metadata, not another user’s food diary.',
    foodLogShares,
    {
      senderUserId: foodLogShares.senderUserId,
      recipientUserId: foodLogShares.recipientUserId,
      createdAt: foodLogShares.createdAt,
    },
    foodLogShares.id,
    shareScope,
  ),
  defineAgentResource(
    'food_log_share_items',
    'Items in your sent or received shares. foodLogId is a reference, not permission to read another user’s log. Amounts are grams in hundredths.',
    foodLogShareItems,
    {
      shareId: foodLogShareItems.shareId,
      foodLogId: foodLogShareItems.foodLogId,
      gramsHundredths: foodLogShareItems.gramsHundredths,
    },
    foodLogShareItems.id,
    (userId) =>
      inArray(
        foodLogShareItems.shareId,
        db.select({ id: foodLogShares.id }).from(foodLogShares).where(shareScope(userId)),
      ),
  ),
];
