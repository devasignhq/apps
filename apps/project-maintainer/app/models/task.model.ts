import { MessageDto } from "@devasign/shared/models/message.model";
import { IssueDto, IssueLabel } from "@devasign/shared/models/github.model";
import { InstallationDto } from "./installation.model";
import { UserDto } from "./user.model";
import { TransactionDto } from "./wallet.model";

export const TASK_STATUS = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    MARKED_AS_COMPLETED: "MARKED_AS_COMPLETED",
    COMPLETED: "COMPLETED",
    ARCHIVED: "ARCHIVED"
};
export type TaskStatus = keyof typeof TASK_STATUS

export const TIMELINE_TYPE = {
    WEEK: "WEEK",
    DAY: "DAY"
};
export type TimelineType = keyof typeof TIMELINE_TYPE

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
    _count?: { taskActivities: number };

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
    viewed: boolean;
    createdAt: string;
    updatedAt: string;

    task?: TaskDto;
    user?: UserDto | null;
    taskSubmission?: TaskSubmission | null;
}

export type CreateTaskDto = {
    installationId: string;
    issue: TaskIssue;
    timeline: number;
    timelineType?: TimelineType;
    bounty: string;
    bountyLabelId: string;
    repoId?: string; // For internal tracking during task creation
}

export type AddBountyCommentId = {
    bountyCommentId: number;
}

export type UpdateTaskBountyDto = {
    newBounty: string;
}

export type UpdateTaskTimelineDto = {
    newTimeline: number;
}

export type ReplyTimelineExtensionRequestDto = {
    accept: boolean;
    requestedTimeline: number;
}

export type QueryTaskDto = {
    status?: TaskStatus;
    detailed?: boolean;
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

export type TimelineExtensionResponse = {
    message: MessageDto;
    task?: Pick<TaskDto, "timeline" | "status" | "updatedAt">;
}
