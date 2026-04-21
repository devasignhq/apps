import { HttpClient } from "@devasign/shared/lib/axiosInstance";
import { ENDPOINTS } from "./_endpoints";
import {
    MarkAsCompleteDto,
    QueryTaskActivityDto,
    QueryTaskDto,
    RequestTimelineExtensionDto,
    TaskActivity,
    TaskDto
} from "../models/task.model";
import { ApiResponse, PaginatedApiResponse } from "@devasign/shared/models/_global";
import { MessageDto } from "@devasign/shared/models/message.model";

export class TaskAPI {
    static async getTasks(query?: QueryTaskDto) {
        return HttpClient.get<PaginatedApiResponse<TaskDto>>(ENDPOINTS.TASK.GET_ALL, {
            params: query
        });
    }

    static async getContributorTasks(query?: QueryTaskDto) {
        return HttpClient.get<PaginatedApiResponse<TaskDto>>(
            ENDPOINTS.TASK.GET_CONTRIBUTOR_TASKS,
            { params: query }
        );
    }

    static async getTaskById(taskId: string) {
        return HttpClient.get<ApiResponse<TaskDto>>(
            ENDPOINTS.TASK.GET_BY_ID.replace("{taskId}", taskId)
        );
    }

    static async getContributorTaskById(taskId: string) {
        return HttpClient.get<ApiResponse<TaskDto>>(
            ENDPOINTS.TASK.GET_CONTRIBUTOR_TASK_BY_ID.replace("{taskId}", taskId)
        );
    }

    static async getTaskActivities(taskId: string, query?: QueryTaskActivityDto) {
        return HttpClient.get<PaginatedApiResponse<TaskActivity>>(
            ENDPOINTS.TASK.GET_ACTIVITIES.replace("{taskId}", taskId),
            { params: query }
        );
    }

    static async submitTaskApplication(taskId: string) {
        return HttpClient.post<ApiResponse<null>>(
            ENDPOINTS.TASK.SUBMIT_APPLICATION.replace("{taskId}", taskId),
            {}
        );
    }

    static async markAsComplete(taskId: string, data: MarkAsCompleteDto) {
        return HttpClient.post<ApiResponse<Pick<TaskDto, "status" | "taskSubmissions" | "updatedAt">>>(
            ENDPOINTS.TASK.MARK_AS_COMPLETE.replace("{taskId}", taskId), 
            data
        );
    }

    static async requestTimelineModification(
        taskId: string,
        data: RequestTimelineExtensionDto
    ) {
        return HttpClient.post<ApiResponse<MessageDto>>(
            ENDPOINTS.TASK.REQUEST_TIMELINE_MODIFICATION.replace("{taskId}", taskId),
            data
        );
    }
}
