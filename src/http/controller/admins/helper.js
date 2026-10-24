const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const composeFilter = (req) => {
    const { search } = req.query;
    let filter = {};

    if (search && String(search).trim()) {
        // case-insensitive partial match
        const re = new RegExp(escapeRegex(String(search).trim()), "i");
        filter = {
            ...filter,
            $or: [
                { firstName: re },
                { lastName: re },
                { email: re },
                { phoneNumber: re },
            ]
        }
    }

    return filter;
}

module.exports = { composeFilter }
