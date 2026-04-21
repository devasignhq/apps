"use client";
import ActiveTeamMembersSection from "./sections/ActiveTeamMembersSection";
import NewTeamMemberSection from "./sections/NewTeamMemberSection";

const ManageTeam = () => {
    
    return (
        <section className="grow overflow-y-auto">
            <NewTeamMemberSection />
            <ActiveTeamMembersSection />
        </section>
    );
};
 
export default ManageTeam;
