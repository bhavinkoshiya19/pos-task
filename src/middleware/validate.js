const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'params' ? req.params : req.body;
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (source === 'params') req.params = value;
  else req.body = value;

  next();
};

module.exports = validate;
