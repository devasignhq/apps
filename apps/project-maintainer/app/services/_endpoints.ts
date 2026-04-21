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
        ADDRESS_BOOK: `${preset.USER}/address-book`
    },
    INSTALLATION: {
        GET_ALL: `${preset.INSTALLATION}`,
        GET_BY_ID: `${preset.INSTALLATION}/{installationId}`,
        CREATE: `${preset.INSTALLATION}`,
        ARCHIVED: `${preset.INSTALLATION}/{installationId}/archive`,

        ADD_TEAM_MEMBER: `${preset.INSTALLATION}/{installationId}/team`,
        UPDATE_TEAM_MEMBER: `${preset.INSTALLATION}/{installationId}/team/{userId}`,
        REMOVE_TEAM_MEMBER: `${preset.INSTALLATION}/{installationId}/team/{userId}`,
        
        GET_INSTALLATION_REPOSITORIES: `${preset.INSTALLATION}/github/{installationId}/repositories`,
        GET_REPOSITORY_ISSUES: `${preset.INSTALLATION}/github/{installationId}/issues`,
        GET_REPOSITORY_RESOURCES: `${preset.INSTALLATION}/github/{installationId}/resources`,
        SET_BOUNTY_LABEL: `${preset.INSTALLATION}/github/{installationId}/set-bounty-label`
    },
    TASK: {
        GET_INSTALLATION_TASKS: `${preset.TASK}/installation/{installationId}`,
        GET_INSTALLATION_TASK_BY_ID: `${preset.TASK}/installation/{installationId}/{taskId}`,
        CREATE: `${preset.TASK}`,
        DELETE: `${preset.TASK}/{taskId}`,

        ADD_BOUNTY_COMMENT_ID: `${preset.TASK}/{taskId}/issue-comment`,
        UPDATE_TASK_BOUNTY: `${preset.TASK}/{taskId}/bounty`,
        UPDATE_TASK_TIMELINE: `${preset.TASK}/{taskId}/timeline`,
        ACCEPT_APPLICATION: `${preset.TASK}/{taskId}/accept/{contributorId}`,
        VALIDATE_COMPLETION: `${preset.TASK}/{taskId}/validate`,
        REPLY_TIMELINE_MODIFICATION_REQUEST: `${preset.TASK}/{taskId}/timeline-extension/reply`,

        GET_ACTIVITIES: `${preset.TASK}/activities/{taskId}`,
        MARK_ACTIVITY_AS_VIEWED: `${preset.TASK}/activities/{taskActivityId}/viewed`
    },
    WALLET: {
        GET_WALLET: `${preset.WALLET}/account`,
        WITHDRAW: `${preset.WALLET}/withdraw`,
        SWAP: `${preset.WALLET}/swap/{installationId}`,
        TRANSACTIONS: `${preset.WALLET}/transactions/installation/{installationId}`,
        RECORD_WALLET_TOPUPS: `${preset.WALLET}/transactions/record-topups`
    }
};
