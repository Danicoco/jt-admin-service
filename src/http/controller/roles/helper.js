const basePermission = {
    canCreate: false,
    canView: false,
    canUpdate: false,
    canDelete: false,
}

const permissionFeatures = [    
     {
        module: "Dashboard",
        permissions: {
            canView: false,
        },
    },
    {
        module: "Admin",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Banner",
        permissions: {
            ...basePermission,
        },
    },
    {
        module: "Notification",
        permissions: {
            ...basePermission,
        },
    },
    // {
    //     module: "Wallet",
    //     permissions: {
    //         ...basePermission,
    //     },
    // },
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
    // {
    //     module: "Shop",
    //     permissions: {
    //         ...basePermission,
    //     },
    // },
    // {
    //     module: "Shipping",
    //     permissions: {
    //         ...basePermission,
    //     },
    // },
    // {
    //     module: "Order",
    //     permissions: {
    //         canView: false,
    //     },
    // },
    {
        module: "Trade",
        permissions: {
            ...basePermission,
            canTreat: false,
        },
    },
    {
        // BVN watchlist: canView = see the list, canCreate = add / upload CSV,
        // canDelete = remove entries
        module: "Watchlist",
        permissions: {
            canView: false,
            canCreate: false,
            canDelete: false,
        },
    },
    {
        // outgoing withdrawals (page and customer tab)
        module: "Withdrawal",
        permissions: {
            canView: false,
        },
    },
    {
        // transaction monitoring: canView = see alerts/cases, canUpdate = work
        // alerts, holds and cases, canConfigure = edit rules and settings
        module: "Monitoring",
        permissions: {
            canView: false,
            canUpdate: false,
            canConfigure: false,
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