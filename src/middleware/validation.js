const Joi = require('joi');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Validation Middleware
 * Validates request query parameters, body, and params using Joi schemas
 */

/**
 * Filter query schema - validates analytics filter parameters
 */
const filterQuerySchema = Joi.object({
  year: Joi.string()
    .valid('all', '2023', '2024', '2025')
    .default('all')
    .messages({
      'any.only': 'Year must be one of: all, 2023, 2024, 2025'
    }),

  quarter: Joi.string()
    .valid('all', 'Q1', 'Q2', 'Q3', 'Q4')
    .default('all')
    .messages({
      'any.only': 'Quarter must be one of: all, Q1, Q2, Q3, Q4'
    }),

  month: Joi.string()
    .valid('all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')
    .default('all')
    .messages({
      'any.only': 'Month must be a number between 1-12 or "all"'
    }),

  status: Joi.string()
    .valid('all', 'completed', 'canceled')
    .default('all')
    .messages({
      'any.only': 'Status must be one of: all, completed, canceled'
    }),

  size: Joi.string()
    .valid('all', 'micro', 'small', 'medium', 'large', 'enterprise')
    .default('all')
    .messages({
      'any.only': 'Size must be one of: all, micro, small, medium, large, enterprise'
    }),

  area: Joi.string()
    .default('all')
    .messages({
      'string.base': 'Area must be a string'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 1000'
    })
}).unknown(false); // Don't allow unknown query parameters

/**
 * Year parameter schema
 */
const yearParamSchema = Joi.object({
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2030)
    .required()
    .messages({
      'number.base': 'Year must be a number',
      'number.min': 'Year must be 2020 or later',
      'number.max': 'Year must be 2030 or earlier',
      'any.required': 'Year is required'
    })
});

/**
 * Date range query schema
 */
const dateRangeQuerySchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    })
});

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Property to validate ('query', 'body', 'params')
 */
const validate = (schema, property = 'query') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown properties
    });

    if (error) {
      // Format error messages
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', {
        property,
        errors: errorMessages,
        url: req.originalUrl
      });

      return next(new ValidationError(
        `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`
      ));
    }

    // Store validated data in a separate property for easy access
    req.validated = req.validated || {};
    req.validated[property] = value;

    logger.debug('Validation passed', {
      property,
      url: req.originalUrl
    });

    next();
  };
};

/**
 * Validate filter query parameters
 * Used for analytics endpoints with filtering
 */
const validateFilters = validate(filterQuerySchema, 'query');

/**
 * Validate year parameter
 * Used for endpoints that require a year in the URL
 */
const validateYearParam = validate(yearParamSchema, 'params');

/**
 * Validate date range query
 * Used for endpoints that accept date ranges
 */
const validateDateRange = validate(dateRangeQuerySchema, 'query');

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, '');

  // Remove potential script injections
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/on\w+\s*=/gi, '');

  return str.trim();
};

/**
 * Sanitize request body middleware
 * Sanitizes all string values in request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

/**
 * Custom validators
 */
const validators = {
  /**
   * Validate merchant ID format
   */
  merchantId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid merchant ID format'
    }),

  /**
   * Validate area name
   */
  areaName: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s-]+$/)
    .messages({
      'string.min': 'Area name must be at least 2 characters',
      'string.max': 'Area name must not exceed 100 characters',
      'string.pattern.base': 'Area name can only contain letters, spaces, and hyphens'
    }),

  /**
   * Validate pagination parameters
   */
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

module.exports = {
  validate,
  validateFilters,
  validateYearParam,
  validateDateRange,
  sanitizeBody,
  validators,
  // Export schemas for reuse
  schemas: {
    filterQuery: filterQuerySchema,
    yearParam: yearParamSchema,
    dateRange: dateRangeQuerySchema
  }
};
