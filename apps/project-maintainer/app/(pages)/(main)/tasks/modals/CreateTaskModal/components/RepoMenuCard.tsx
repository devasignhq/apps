"use client";

type RepoMenuCardProps = {
    repoName: string;
    repoUrl: string;
    active?: boolean;
    onClick?: () => void;
}

const RepoMenuCard = ({ repoName, repoUrl, active, onClick }: RepoMenuCardProps) => {
    return (
        <button 
            onClick={onClick} 
            className={`group p-2.5 space-y-[5px] text-start hover:bg-dark-400 ${active && "bg-dark-400 border-b border-primary-400"}`}
        >
            <p className={`text-body-tiny group-hover:text-light-100 ${active ? "text-light-100" : "text-dark-200"}`}>{repoName}</p>
            <p className="text-body-micro text-dark-100 max-w-[136px] truncate">{repoUrl}</p>
        </button>
    );
};
 
export default RepoMenuCard;
