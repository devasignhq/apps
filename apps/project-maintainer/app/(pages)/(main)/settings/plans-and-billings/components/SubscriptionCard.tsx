import { SubscriptionPlanDto } from "@/app/models/subscription-plan.model";
import React from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { GoCheckCircleFill, GoDotFill } from "react-icons/go";

type SubscriptionCardProps = {
    plan: SubscriptionPlanDto;
    active: boolean;
    cardAttributes: React.HTMLAttributes<HTMLDivElement>;
    icon: React.ReactNode;
    planState?: "DOWNGRADE" | "UPGRADE";
}

const SubscriptionCard = ({
    plan,
    active,
    cardAttributes,
    icon,
    planState
}: SubscriptionCardProps) => {
    return (
        <div 
            className={`w-full p-4 border flex justify-between 
                ${active ? "bg-dark-400 border-primary-200" : "border-dark-200 hover:border-dark-100"}
            `}
            {...cardAttributes}
        >
            <div className="flex">
                <div className={`w-8 h-8 border grid place-content-center mr-4 
                    ${active ? "bg-primary-300 border-primary-200 text-primary-100" : "text-dark-200 border-dark-200"}`
                }>
                    {icon}
                </div>
                <div>
                    <h6 className={`text-body-medium font-bold mb-2.5 flex items-center gap-2.5 ${active ? "text-primary-400" : "text-light-100"} `}>
                        <span>{plan.name}</span>
                        <GoDotFill className="text-[10px] text-light-100" />
                        {/* <span className={`${active && "text-light-200"}`}>{plan.priceString[0]}</span> */}
                        
                        {(!active && planState) && (
                            <>
                                <GoDotFill className="text-[10px] text-light-100" />
                                <button 
                                    className="flex items-center gap-[5px] text-primary-400 text-button-large font-extrabold hover:text-light-200"
                                    onClick={() => {}}
                                >
                                    <span>{planState === "DOWNGRADE" ? "Downgrade" : "Buy Plan"}</span>
                                    <FiArrowUpRight className={`text-2xl ${planState === "DOWNGRADE" && "rotate-180"}`} />
                                </button>
                            </>
                        )}
                    </h6>
                    <ul className={`text-body-tiny list-disc list-inside space-y-1 ${active ? "text-light-100" : "text-dark-100"} `}>
                        {/* {plan.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))} */}
                    </ul>
                </div>
            </div>
            {active && (
                <GoCheckCircleFill className="text-xl text-primary-100" />
            )}
        </div>
    );
};
 
export default SubscriptionCard;
