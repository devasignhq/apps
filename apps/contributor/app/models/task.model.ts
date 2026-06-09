import { IssueDto, IssueLabel } from "@devasign/shared/models/github.model";
import { InstallationDto } from "./installation.model";
import { UserDto } from "./user.model";
import { TransactionDto } from "./wallet.model";

export const TASK_STATUS = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    MARKED_AS_COMPLETED: "MARKED_AS_COMPLETED",
    COMPLETED: "COMPLETED"
};
export type TaskStatus = keyof typeof TASK_STATUS

export type TaskDto = {
    id: string;
    number: number;
    issue: TaskIssue;
    timeline: number;
    bounty: number;
    status: TaskStatus;
    escrowTransactions: EscrowTransaction[];
    settled: boolean;
    acceptedAt: string | null;
    completedAt: string | null;
    creatorId: string;
    contributorId: string | null;
    installationId: string;
    createdAt: string;
    updatedAt: string;

    applications?: UserDto[];
    creator?: UserDto;
    contributor?: UserDto | null;
    installation?: InstallationDto;
    transactions?: TransactionDto[];
    taskSubmissions?: TaskSubmission[];
    taskActivities?: TaskActivity[];
}

export type TaskIssue = Omit<IssueDto, "labels"> & {
    labels: IssueLabel[];
    bountyCommentId?: string;
}

export type EscrowTransaction = {
    txHash: string;
    method: "creation"
    | "increase_bounty"
    | "decrease_bounty"
    | "assign_contributor"
    | "bounty_payout";
}

export type TaskSubmission = {
    id: string;
    userId: string;
    taskId: string;
    installationId: string;
    pullRequest: string;
    attachmentUrl: string | null;
    createdAt: string;
    updatedAt: string;

    user?: UserDto;
    task?: TaskDto;
    installation?: InstallationDto;
}

export type TaskActivity = {
    id: string;
    taskId: string;
    userId: string | null;
    taskSubmissionId: string | null;
    createdAt: string;
    updatedAt: string;

    task?: TaskDto;
    user?: UserDto | null;
    taskSubmission?: TaskSubmission | null;
}

export type RequestTimelineExtensionDto = {
    githubUsername: string;
    requestedTimeline: number;
    reason: string;
    attachments?: string[];
}

export type MarkAsCompleteDto = {
    pullRequest: string;
    attachmentUrl?: string;
}

export type QueryTaskDto = {
    status?: TaskStatus;
    installationId?: string;
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
    repoUrl?: string;
    issueTitle?: string;
    issueLabels?: string[];
}

export type QueryTaskActivityDto = {
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
}

export type FilterTasks = Pick<QueryTaskDto, "status" | "repoUrl" | "issueTitle" | "issueLabels">;
