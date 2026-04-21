const preset = {
    USER: "/users",
    INSTALLATION: "/installations",
    TASK: "/tasks",
    WALLET: "/wallet"
};

export const ENDPOINTS = {
    USER: {
        GET: `${preset.USER}`,
        CREATE: `${preset.USER}`,
        ADDRESS_BOOK: `${preset.USER}/address-book`,
        GENERATE_SUMSUB_TOKEN: `${preset.USER}/sumsub-token`
    },
    TASK: {
        GET_ALL: `${preset.TASK}/public`,
        GET_CONTRIBUTOR_TASKS: `${preset.TASK}/contributor/tasks`,
        GET_BY_ID: `${preset.TASK}/public/{taskId}`,
        GET_CONTRIBUTOR_TASK_BY_ID: `${preset.TASK}/contributor/tasks/{taskId}`,

        SUBMIT_APPLICATION: `${preset.TASK}/{taskId}/apply`,
        MARK_AS_COMPLETE: `${preset.TASK}/{taskId}/complete`,
        REQUEST_TIMELINE_MODIFICATION: `${preset.TASK}/{taskId}/timeline-extension`,

        GET_ACTIVITIES: `${preset.TASK}/activities/{taskId}`,
        MARK_ACTIVITY_AS_VIEWED: `${preset.TASK}/activities/{taskActivityId}/viewed`
    },
    WALLET: {
        GET_WALLET: `${preset.WALLET}/account`,
        WITHDRAW: `${preset.WALLET}/withdraw`,
        TRANSACTIONS: `${preset.WALLET}/transactions/user`
    }
};
