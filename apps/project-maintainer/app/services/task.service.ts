import { HttpClient } from "@devasign/shared/lib/axiosInstance";
import { ENDPOINTS } from "./_endpoints";
import {
    AddBountyCommentId,
    CreateTaskDto,
    QueryTaskActivityDto,
    QueryTaskDto,
    ReplyTimelineExtensionRequestDto,
    TaskActivity,
    TaskDto,
    TimelineExtensionResponse,
    UpdateTaskBountyDto,
    UpdateTaskTimelineDto
} from "../models/task.model";
import { ApiResponse, PaginatedApiResponse } from "@devasign/shared/models/_global";

export class TaskAPI {
    static async getInstallationTasks(
        installationId: string,
        query?: QueryTaskDto
    ) {
        return HttpClient.get<PaginatedApiResponse<TaskDto>>(
            ENDPOINTS.TASK.GET_INSTALLATION_TASKS.replace(
                "{installationId}",
                installationId
            ),
            { params: query }
        );
    }

    static async getInstallationTaskById(installationId: string, taskId: string) {
        return HttpClient.get<ApiResponse<TaskDto>>(
            ENDPOINTS.TASK.GET_INSTALLATION_TASK_BY_ID.replace(
                "{installationId}",
                installationId
            ).replace("{taskId}", taskId)
        );
    }

    static async createTask(data: { payload: Omit<CreateTaskDto, "timelineType"> }) {
        return HttpClient.post<ApiResponse<TaskDto>>(ENDPOINTS.TASK.CREATE, data);
    }

    static async addBountyCommentId(taskId: string, data: AddBountyCommentId) {
        return HttpClient.patch<ApiResponse<Pick<TaskDto, "id">>>(
            ENDPOINTS.TASK.ADD_BOUNTY_COMMENT_ID.replace("{taskId}", taskId),
            data
        );
    }

    static async updateTaskBounty(taskId: string, data: UpdateTaskBountyDto) {
        return HttpClient.patch<ApiResponse<Pick<TaskDto, "bounty" | "updatedAt">>>(
            ENDPOINTS.TASK.UPDATE_TASK_BOUNTY.replace("{taskId}", taskId),
            data
        );
    }

    static async updateTaskTimeline(taskId: string, data: UpdateTaskTimelineDto) {
        return HttpClient.patch<
            ApiResponse<Pick<TaskDto, "timeline" | "updatedAt">>
        >(ENDPOINTS.TASK.UPDATE_TASK_TIMELINE.replace("{taskId}", taskId), data);
    }

    static async acceptTaskApplication(taskId: string, contributorId: string) {
        return HttpClient.post<
            ApiResponse<Pick<TaskDto, "status" | "contributor" | "acceptedAt">>
        >(
            ENDPOINTS.TASK.ACCEPT_APPLICATION.replace("{taskId}", taskId).replace(
                "{contributorId}",
                contributorId
            ),
            {}
        );
    }

    static async validateCompletion(taskId: string) {
        return HttpClient.post<
            ApiResponse<Pick<TaskDto, "status" | "completedAt" | "settled" | "updatedAt">>
        >(
            ENDPOINTS.TASK.VALIDATE_COMPLETION.replace("{taskId}", taskId),
            {}
        );
    }

    static async replyTimelineExtensionRequest(
        taskId: string,
        data: ReplyTimelineExtensionRequestDto
    ) {
        return HttpClient.post<ApiResponse<TimelineExtensionResponse>>(
            ENDPOINTS.TASK.REPLY_TIMELINE_MODIFICATION_REQUEST.replace(
                "{taskId}",
                taskId
            ),
            data
        );
    }

    static async getTaskActivities(taskId: string, query?: QueryTaskActivityDto) {
        return HttpClient.get<PaginatedApiResponse<TaskActivity>>(
            ENDPOINTS.TASK.GET_ACTIVITIES.replace("{taskId}", taskId),
            { params: query }
        );
    }

    static async markActivityAsViewed(taskActivityId: string) {
        return HttpClient.patch<
            ApiResponse<Pick<TaskActivity, "id" | "viewed" | "updatedAt">>
        >(
            ENDPOINTS.TASK.MARK_ACTIVITY_AS_VIEWED.replace(
                "{taskActivityId}",
                taskActivityId
            ),
            {}
        );
    }

    static async deleteTask(taskId: string) {
        return HttpClient.delete<ApiResponse<{ refunded: string }>>(
            ENDPOINTS.TASK.DELETE.replace("{taskId}", taskId)
        );
    }
}
