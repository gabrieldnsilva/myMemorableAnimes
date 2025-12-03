import { body, ValidationChain } from 'express-validator';
import { WatchStatus } from '../../models/UserAnimeList';

export const addToListValidator: ValidationChain[] = [
  body('status')
    .optional()
    .isIn(Object.values(WatchStatus))
    .withMessage(
      `Status must be one of: ${Object.values(WatchStatus).join(', ')}`
    ),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('watchedEpisodes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Watched episodes must be a non-negative integer'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const updateAnimeValidator: ValidationChain[] = [
  body('status')
    .optional()
    .isIn(Object.values(WatchStatus))
    .withMessage(
      `Status must be one of: ${Object.values(WatchStatus).join(', ')}`
    ),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('watchedEpisodes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Watched episodes must be a non-negative integer'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const updateRatingValidator: ValidationChain[] = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
];
