"use client";
import AccountPlanSection from "./sections/AccountPlanSection";
import BillingSection from "./sections/BillingSection";

const PlansAndBillings = () => {
    return (
        <section className="grow overflow-y-auto">
            <AccountPlanSection />
            <BillingSection />
        </section>
    );
};
 
export default PlansAndBillings;
