import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';
import { logger } from '../config/logger';
import { getSetting } from './settings-service';

// FSRS integration helpers.

function getParams() {
  const retention = parseFloat(getSetting('fsrs_request_retention') ?? '0.9');
  const maxInterval = parseInt(getSetting('fsrs_maximum_interval') ?? '36500', 10);
  return generatorParameters({ request_retention: retention, maximum_interval: maxInterval });
}

export function initializeCard(): Card {
  return createEmptyCard();
}

export function scheduleReview(
  currentState: Card,
  grade: 1 | 2 | 3 | 4,
  now?: Date,
): { card: Card; log: { card: Card } } {
  const f = fsrs(getParams());
  const reviewDate = now ?? new Date();
  const ratings: Rating[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  const ratingValue = ratings[grade - 1];

  if (ratingValue === undefined) {
    throw new Error(`Invalid grade: ${grade}. Must be 1–4.`);
  }

  const result = f.repeat(currentState, reviewDate) as unknown as Record<
    Rating,
    { card: Card }
  >;
  const scheduled = result[ratingValue];
  logger.debug({ grade, due: scheduled.card.due }, '[srs-fsrs] Review scheduled');

  return { card: scheduled.card, log: scheduled };
}

export function cardToJson(card: Card): string {
  return JSON.stringify(card);
}

export function jsonToCard(json: string): Card {
  return JSON.parse(json) as Card;
}
