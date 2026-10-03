/**
 * Pagination Middleware
 * Provides pagination utilities for routes
 */

/**
 * Get pagination parameters from query string
 * @param {Object} req - Express request object
 * @param {Number} defaultLimit - Default items per page
 * @returns {Object} Pagination parameters
 */
function getPaginationParams(req, defaultLimit = 10) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
}

/**
 * Calculate pagination metadata
 * @param {Number} totalItems - Total number of items
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
function getPaginationMeta(totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
        startIndex: (page - 1) * limit + 1,
        endIndex: Math.min(page * limit, totalItems)
    };
}

/**
 * Build search query from search parameters
 * @param {String} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in
 * @returns {Object} MongoDB query object
 */
function buildSearchQuery(searchTerm, searchFields) {
    if (!searchTerm || !searchFields || searchFields.length === 0) {
        return {};
    }

    return {
        $or: searchFields.map(field => ({
            [field]: new RegExp(searchTerm, 'i')
        }))
    };
}

/**
 * Paginate Mongoose query
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated results
 */
async function paginateQuery(model, query = {}, options = {}) {
    const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        populate = null,
        select = null
    } = options;

    const skip = (page - 1) * limit;

    let queryBuilder = model.find(query).sort(sort).skip(skip).limit(limit);

    if (populate) {
        if (Array.isArray(populate)) {
            populate.forEach(pop => queryBuilder = queryBuilder.populate(pop));
        } else {
            queryBuilder = queryBuilder.populate(populate);
        }
    }

    if (select) {
        queryBuilder = queryBuilder.select(select);
    }

    const [results, totalItems] = await Promise.all([
        queryBuilder.exec(),
        model.countDocuments(query)
    ]);

    const pagination = getPaginationMeta(totalItems, page, limit);

    return {
        results,
        pagination
    };
}

/**
 * Middleware to add pagination utilities to request object
 */
function paginationMiddleware(req, res, next) {
    req.pagination = {
        getParams: (defaultLimit) => getPaginationParams(req, defaultLimit),
        getMeta: getPaginationMeta,
        buildSearch: buildSearchQuery
    };
    next();
}

module.exports = {
    getPaginationParams,
    getPaginationMeta,
    buildSearchQuery,
    paginateQuery,
    paginationMiddleware
};
