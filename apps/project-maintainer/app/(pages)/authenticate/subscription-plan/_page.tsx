"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { SubscriptionPlanDto } from "@/app/models/subscription-plan.model";
import { BsLayers } from "react-icons/bs";
import { FiArrowRight, FiLayers, FiZap } from "react-icons/fi";
import SubscriptionCard from "./components/SubscriptionCard";
import { ROUTES } from "@/app/utils/data";
import { useRouter } from "next/navigation";

const cardIcons: React.ReactNode[] = [
    <BsLayers key="basic" />,
    <FiLayers key="pro" />,
    <FiZap key="enterprise" />
];

const SubscriptionPlan = () => {
    const router = useRouter();

    const handleSubscription = async () => {
        router.push(ROUTES.ONBOARDING);
    };

    return (
        <>
            {/* <button 
                className="gradient-border-btn relative p-2.5 bg-dark-400 text-light-100 text-2xl my-[30px]"
                onClick={() => {}}
            >
                <FiArrowLeft />
            </button> */}
            <h1 className="text-display-large text-light-100 pt-[105px] pb-[42px]">
                Hello, <span className="text-light-200">{" "}lenny_malcolm{" "}</span> 👋
            </h1>
            <h1 className="text-headline-medium text-light-200 pb-[15px]">
                Manage Contributors
            </h1>
            <p className="text-body-small text-light-100">
                How many contributors are working on your project?
            </p>
            <div className="w-[500px] flex flex-col py-10 gap-[15px]">
                {demoSubscriptionPlans.map((plan, index) => (
                    <SubscriptionCard 
                        key={plan.id} 
                        plan={plan}
                        active={index === 0}
                        cardAttributes={{}}
                        icon={cardIcons[index]}
                    />
                ))}
            </div>
            <ButtonPrimary
                format="SOLID"
                text="Get Started"
                sideItem={<FiArrowRight />}
                attributes={{ onClick: handleSubscription }}
            />
        </>
    );
};
 
export default SubscriptionPlan;

const demoSubscriptionPlans: SubscriptionPlanDto[] = [];
