import { BalanceLineAsset } from "./horizon.model";
import { UserInstallationPermissionDto } from "./permission.model";
import { InstallationDto } from "./installation.model";
import { TaskDto, TaskSubmission } from "./task.model";
import { TransactionDto } from "./wallet.model";

export type UserDto = {
    userId: string;
    username: string;
    verified: boolean;
    email?: string | null;
    wallet: { address: string };
    techStack: string[];
    addressBook: AddressBook[];
    createdAt: string;
    updatedAt: string;
    _count?: { installations: number };

    contributionSummary?: ContributionSummary | null;
    assets?: BalanceLineAsset[];
    createdTasks?: TaskDto[];
    contributedTasks?: TaskDto[];
    installations?: InstallationDto[];
    userInstallationPermissions?: UserInstallationPermissionDto[];
    transactions?: TransactionDto[];
    tasksAppliedFor?: TaskDto[];
    taskSubmissions?: TaskSubmission[];
}

export type UserBasic = Pick<UserDto, "userId" | "username" | "wallet" | "addressBook" | "createdAt" | "updatedAt">
export type UserProfile = Pick<UserDto, "userId" | "username" | "wallet" | "addressBook" | "createdAt" | "updatedAt" | "contributionSummary" | "assets">

export type AddressBook = {
    name: string;
    address: string;
}

export type ContributionSummary = {
    id: string;
    tasksCompleted: number;
    activeTasks: number;
    totalEarnings: number;
    userId: string;
    user?: Pick<UserDto, "username" | "userId" | "wallet" | "addressBook" | "createdAt" | "updatedAt">;
}

export type CreateUserPayloadDto = {
    githubUsername: string;
}
