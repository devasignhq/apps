import { SubscriptionPlanDto } from "@/app/models/subscription-plan.model";
import React from "react";
import { FaRegCircle } from "react-icons/fa";
import { GoCheckCircleFill, GoDotFill } from "react-icons/go";

type SubscriptionCardProps = {
    plan: SubscriptionPlanDto;
    active: boolean;
    cardAttributes: React.HTMLAttributes<HTMLDivElement>;
    icon: React.ReactNode;
}

const SubscriptionCard = ({
    plan,
    active,
    cardAttributes,
    icon
}: SubscriptionCardProps) => {
    return (
        <div 
            className={`w-full p-4 border flex justify-between cursor-pointer
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
                        <GoDotFill className="text-light-100" />
                        {/* <span className={`${active && "text-light-200"}`}>{plan.priceString[0]}</span>
                        {plan.priceString[1] && (
                            <>
                            <GoDotFill className="text-light-100" />
                            <span>{plan.priceString[1]}</span>
                            </>
                        )} */}
                    </h6>
                    {/* <ul className={`text-body-tiny list-disc list-inside space-y-1 ${active ? "text-light-100" : "text-dark-100"} `}>
                        {plan.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul> */}
                </div>
            </div>
            <div className="text-xl text-dark-100">
                {active ? (
                    <GoCheckCircleFill className="text-primary-100" />
                ) : (
                    <FaRegCircle />
                )}
            </div>
        </div>
    );
};
 
export default SubscriptionCard;
