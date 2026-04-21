import { UserInstallationPermissionDto } from "./permission.model";
import { SubscriptionPlanDto } from "./subscription-plan.model";
import { TaskDto, TaskSubmission } from "./task.model";
import { UserDto } from "./user.model";
import { TransactionDto } from "./wallet.model";

export type InstallationDto = {
    id: string;
    htmlUrl: string;
    targetId: number;
    targetType: string;
    status: "ACTIVE" | "ARCHIVED";
    account: InstallationAccount;
    wallet: { address: string };
    subscriptionPackageId: string | null;
    createdAt: string;
    updatedAt: string;
      
    stats?: InstallationStats;
    subscriptionPackage?: SubscriptionPlanDto | null;
    tasks?: TaskDto[];
    users?: UserDto[];
    userInstallationPermissions?: UserInstallationPermissionDto[];
    transactions?: TransactionDto[];
    taskSubmissions?: TaskSubmission[];
}

export type InstallationAccount = {
    login: string;
    nodeId: string;
    avatarUrl: string;
    htmlUrl: string;
}

export type InstallationStats = {
    totalBounty: number;
    openTasks: number;
    completedTasks: number;
    totalTasks: number;
    totalMembers: number;
}

export type CreateInstallationDto = {
    installationId: string;
}

export type AddTeamMemberDto = {
    username: string;
    email?: string;
    permissionCodes: string[];
}

export type UpdateTeamMemberDto = {
    permissionCodes: string[];
}

export type QueryInstallationDto = {
    page?: string;
    limit?: string;
    sort?: "asc" | "desc";
}

export type QueryInstallationIssues = {
    page?: number;
    limit?: number;
    labels?: string;
    milestone?: number;
    sort?: number;
    direction?: number;
}

export type AddTeamMemberResponseDto = {
    username: string;
    status: "added" | "invited" | "not_found";
}
