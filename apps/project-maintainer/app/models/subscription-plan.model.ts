export type SubscriptionPlanDto = {
    id: string
    name: string
    description: string
    maxTasks: number
    maxUsers: number
    paid: boolean
    price: number
    active: boolean
    createdAt: string
    updatedAt: string
}
