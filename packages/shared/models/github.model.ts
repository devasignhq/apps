export type RepositoryDto = {
    id: string;
    databaseId: number;
    name: string;
    nameWithOwner: string;
    owner: GitHubUser;
    isPrivate: boolean;
    description: string | null;
    url: string;
    homepageUrl: string;
}

export type IssueDto = {
    id: string;
    number: number;
    title: string;
    body?: string | null;
    url: string;
    state: string;
    labels: { nodes: IssueLabel[] };
    locked: boolean;
    repository: Pick<RepositoryDto, "url">;
    createdAt: string;
    updatedAt: string;
}

export type IssueLabel = {
    id: string;
    name: string;
    color: string;
    description: string | null;
}

export type IssueMilestone = {
    id: string;
    number: number;
    title: string;
}

export type GitHubUser = {
    login: string;
    id: string;
    avatarUrl: string;
    url: string;
}

export type GetRepositoryResourcesResponse = {
    labels: IssueLabel[];
    milestones: IssueMilestone[];
}

export type GetOrCreateBountyLabelResponse = {
    valid: boolean;
    bountyLabel: IssueLabel;
}

export type QueryRepositoryIssues = {
    repoUrl: string;
    title?: string;
    labels?: string[];
    milestone?: string | "none" | "*";
    sort?: "created" | "updated" | "comments";
    direction?: "asc" | "desc";
    page: number;
    perPage: number;
}
