/**
 * Flash Messages Middleware
 * Makes flash messages available to all views
 */
function flashMessages(req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.info = req.flash('info');
    next();
}

module.exports = flashMessages;
