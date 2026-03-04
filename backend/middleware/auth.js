// No auth required - use guest profile for all requests
const GUEST_PARAMEDIC = {
  paramedic_id: 'guest',
  badge_number: 'GUEST',
  role: 'PCP',
  first_name: 'Guest',
  last_name: 'User',
  station: 'Demo',
  unit: 'N/A',
  email: 'guest@parahelper.demo'
};

function authMiddleware(req, res, next) {
  req.paramedic = GUEST_PARAMEDIC;
  next();
}

module.exports = authMiddleware;
