const composeDropOffFilter = (req) => {
  const { status, customerUserId } = req.query;
  let filter = {};
  if (status) filter = { ...filter, status };
  if (customerUserId) filter = { ...filter, customerUserId };

  return filter;
};

module.exports = { composeDropOffFilter }