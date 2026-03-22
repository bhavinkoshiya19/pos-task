const reportService = require('../services/report.service');

const getMembershipSalesReport = async (req, res, next) => {
  try {
    const report = await reportService.getMembershipSalesReport(req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getMembershipStatusReport = async (req, res, next) => {
  try {
    const report = await reportService.getMembershipStatusReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getMembershipRevenueReport = async (req, res, next) => {
  try {
    const report = await reportService.getMembershipRevenueReport(req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getMembershipRenewalRate = async (req, res, next) => {
  try {
    const report = await reportService.getRenewalRate();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getLoyaltyPointsIssuedReport = async (req, res, next) => {
  try {
    const report = await reportService.getPointsIssuedReport(req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getLoyaltyPointsRedeemedReport = async (req, res, next) => {
  try {
    const report = await reportService.getPointsRedeemedReport(req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getLoyaltyOutstandingLiability = async (req, res, next) => {
  try {
    const report = await reportService.getOutstandingLiability();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getTopLoyalCustomersReport = async (req, res, next) => {
  try {
    const report = await reportService.getTopLoyalCustomers(parseInt(req.query.limit) || 10);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMembershipSalesReport,
  getMembershipStatusReport,
  getMembershipRevenueReport,
  getMembershipRenewalRate,
  getLoyaltyPointsIssuedReport,
  getLoyaltyPointsRedeemedReport,
  getLoyaltyOutstandingLiability,
  getTopLoyalCustomersReport
};
