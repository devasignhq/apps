import { InstallationDto } from "./installation.model";
import { UserDto } from "./user.model";

export type PermissionDto = {
    code: string
    name: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

export type UserInstallationPermissionDto = {
    id: string
    userId: string
    projectId: string
    permissionCodes: string[]
    assignedBy: string | null
    assignedAt: string

    permissions?: PermissionDto[]
    user?: UserDto
    installation?: InstallationDto
}
