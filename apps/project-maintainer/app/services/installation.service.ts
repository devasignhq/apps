import { HttpClient } from "@devasign/shared/lib/axiosInstance";
import { ENDPOINTS } from "./_endpoints";
import {
    AddTeamMemberDto,
    AddTeamMemberResponseDto,
    CreateInstallationDto,
    InstallationDto,
    QueryInstallationDto,
    UpdateTeamMemberDto
} from "../models/installation.model";
import { PaginatedApiResponse, ApiResponse } from "@devasign/shared/models/_global";
import {
    RepositoryDto,
    QueryRepositoryIssues,
    GetRepositoryResourcesResponse,
    GetOrCreateBountyLabelResponse,
    IssueDto
} from "@devasign/shared/models/github.model";

export class InstallationAPI {
    static async getInstallations(query?: QueryInstallationDto) {
        return HttpClient.get<PaginatedApiResponse<InstallationDto>>(
            ENDPOINTS.INSTALLATION.GET_ALL,
            { params: query }
        );
    }

    static async getInstallationById(installationId: string) {
        return HttpClient.get<ApiResponse<InstallationDto>>(
            ENDPOINTS.INSTALLATION.GET_BY_ID.replace(
                "{installationId}",
                installationId
            )
        );
    }

    static async createInstallation(installation: CreateInstallationDto) {
        return HttpClient.post<ApiResponse<InstallationDto>>(
            ENDPOINTS.INSTALLATION.CREATE,
            installation
        );
    }

    static async archiveInstallation(
        installationId: string,
        walletAddress: string
    ) {
        return HttpClient.patch<ApiResponse<{ refunded: string }>>(
            ENDPOINTS.INSTALLATION.ARCHIVED.replace(
                "{installationId}",
                installationId
            ),
            { walletAddress }
        );
    }

    // ==========================================================
    // ==========================================================

    static async addTeamMember(installationId: string, data: AddTeamMemberDto) {
        return HttpClient.post<ApiResponse<AddTeamMemberResponseDto>>(
            ENDPOINTS.INSTALLATION.ADD_TEAM_MEMBER.replace(
                "{installationId}",
                installationId
            ),
            data
        );
    }

    static async updateTeamMember(
        installationId: string,
        userId: string,
        data: UpdateTeamMemberDto
    ) {
        return HttpClient.patch<ApiResponse<{}>>(
            ENDPOINTS.INSTALLATION.UPDATE_TEAM_MEMBER.replace(
                "{installationId}",
                installationId
            ).replace("{userId}", userId),
            data
        );
    }

    static async removeTeamMember(installationId: string, userId: string) {
        return HttpClient.delete<ApiResponse<{}>>(
            ENDPOINTS.INSTALLATION.REMOVE_TEAM_MEMBER.replace(
                "{installationId}",
                installationId
            ).replace("{userId}", userId)
        );
    }

    // ==========================================================
    // ==========================================================\

    static async getInstallationRepositories(installationId: string) {
        return HttpClient.get<PaginatedApiResponse<RepositoryDto>>(
            ENDPOINTS.INSTALLATION.GET_INSTALLATION_REPOSITORIES.replace(
                "{installationId}",
                installationId
            )
        );
    }

    static async getRepositoryIssues(
        installationId: string,
        query: QueryRepositoryIssues
    ) {
        return HttpClient.get<PaginatedApiResponse<IssueDto>>(
            ENDPOINTS.INSTALLATION.GET_REPOSITORY_ISSUES.replace(
                "{installationId}",
                installationId
            ),
            { params: query }
        );
    }

    static async getRepositoryResources(installationId: string, repoUrl: string) {
        return HttpClient.get<ApiResponse<GetRepositoryResourcesResponse>>(
            ENDPOINTS.INSTALLATION.GET_REPOSITORY_RESOURCES.replace(
                "{installationId}",
                installationId
            ),
            { params: { repoUrl } }
        );
    }

    static async getOrCreateBountyLabel(
        installationId: string,
        repositoryId: string
    ) {
        return HttpClient.get<ApiResponse<GetOrCreateBountyLabelResponse>>(
            ENDPOINTS.INSTALLATION.SET_BOUNTY_LABEL.replace(
                "{installationId}",
                installationId
            ),
            { params: { repositoryId } }
        );
    }
}
