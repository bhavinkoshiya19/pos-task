const authService = require('../services/auth.service');

const registerUser = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    if (!result) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getLoginUser = (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ success: true, data: { id, name, email, role } });
};

const getAllUser = async (req, res) => {
  try {
    const result = await authService.getAllUser();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getLoginUser,
  getAllUser
};
