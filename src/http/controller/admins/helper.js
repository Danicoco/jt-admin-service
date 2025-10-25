const composeFilter = (req) => {
    const { search } = req.query;
    let filter = {};

    if (search) {
        filter = {
            ...filter,
            $or: [
                { firstName: search }, 
                { lastName: search },
                { email: search },
                { phoneNumber: search },
            ]
        }
    }
}

module.exports = { composeFilter }