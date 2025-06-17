// middleware/validation.js
const Joi = require('joi');

const eventSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  location: Joi.string().min(1).max(100).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  eventType: Joi.string().valid('outdoor_sports', 'wedding', 'hiking', 'corporate_outdoor', 'general').required(),
  description: Joi.string().max(500).optional()
});

const eventUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  location: Joi.string().min(1).max(100).optional(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventType: Joi.string().valid('outdoor_sports', 'wedding', 'hiking', 'corporate_outdoor', 'general').optional(),
  description: Joi.string().max(500).optional()
});

const validateEvent = (req, res, next) => {
  const { error } = eventSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

const validateEventUpdate = (req, res, next) => {
  const { error } = eventUpdateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

module.exports = {
  validateEvent,
  validateEventUpdate
};