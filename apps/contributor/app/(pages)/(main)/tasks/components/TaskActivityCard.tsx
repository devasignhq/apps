import { FaChevronRight } from "react-icons/fa6";

type TaskActivityCardProps = {
    issueNumber: number;
    activityTitle: string;
    issueUrl: string;
    onClick?: () => void;
};

const TaskActivityCard = ({ issueNumber, activityTitle, issueUrl, onClick }: TaskActivityCardProps) => {
    return (
        <div 
            onClick={onClick}
            role="button"
            className="w-full p-2.5 border border-primary-200 bg-dark-400 cursor-pointer flex items-center gap-[15px] hover:border-light-100"
        >
            <div className="py-2.5 px-[7px] text-body-tiny 
                text-light-100 bg-[linear-gradient(130.86deg,_rgba(254,_137,_31,_0.175)_15.53%,_rgba(254,_137,_31,_0.075)_79.38%)]"
            >
                #{issueNumber}
            </div>
            <div className="grow space-y-[5px] overflow-hidden">
                <p className="text-body-medium text-light-100 truncate">{activityTitle}</p>
                <p className="text-body-tiny text-dark-100 truncate">{issueUrl}</p>
            </div>
            <FaChevronRight className="text-2xl text-light-100" />
        </div>
    );
};
 
export default TaskActivityCard;
