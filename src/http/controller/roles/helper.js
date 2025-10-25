const basePermission = {
    canCreate: false,
    canView: false,
    canUpdate: false,
    canDelete: false,
}

const permissionFeatures = [
    {
        module: "Admin",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Wallet",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Role",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Customer",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Shop",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Shipping",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Order",
        permissions: {
            canView: false,
        },
    },
    {
        module: "Trade",
        permissions: {
            canTreat: false,
        },
    },
    {
        module: "Rate",
        permissions: {
            ...basePermission,
        },
    },
]

module.exports = { permissionFeatures }