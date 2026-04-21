"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import InputField from "@devasign/shared/components/Input/InputField";
import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { IoIosCheckbox, IoMdClose } from "react-icons/io";
import { MdMail, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";

const NewTeamMemberSection = () => {
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
        permissions.reduce((acc, _, index) => ({ ...acc, [`${index}`]: false }), {})
    );

    const toggleItems = (field: string) => {
        setSelectedItems(previousValue => {
            if (previousValue[field]) {
                return { ...previousValue, [field]: false };
            }
            return { ...previousValue, [field]: true };
        });
    };

    return (
        <>
            <section className="w-full p-[30px] space-y-[30px] border-b border-dark-200">
                <div className="space-y-2.5">
                    <h5 className="text-headline-small text-light-100">Add Team Members</h5>
                    <p className="text-body-medium text-dark-100">
                    Invite other collaborators to help manage your project developement.
                    </p>
                </div>
                <form className="space-y-[25px]">
                    <InputField 
                        Icon={MdMail}
                        attributes={{
                            placeholder: "Enter email address",
                            name: "",
                            style: { fontSize: "12px" }
                        }}
                        extendedContainerClassName="w-[437px]"
                        extendedInputClassName="text-body-tiny text-light-100 border-light-100"
                    />
                    <ul className="flex flex-col gap-3 list-none items-start">
                        {permissions.map((permission, index) => (
                            <li 
                                key={index} 
                                className="flex items-center gap-2.5 cursor-pointer"
                                onClick={() => toggleItems(`${index}`)}
                            >
                                {selectedItems[`${index}`] ? (
                                    <IoIosCheckbox className="text-[18px] text-primary-100" />
                                ) : (
                                    <MdOutlineCheckBoxOutlineBlank className="text-[18px] text-dark-100" />
                                )}
                                <span className={`text-body-medium ${selectedItems[`${index}`] ? "text-light-200" : "text-light-100"}`}>
                                    {permission}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <ButtonPrimary
                        format="SOLID"
                        text="Send Invitation"
                        sideItem={<FiArrowUpRight />}
                        attributes={{
                            onClick: () => {}
                        }}
                        extendedClassName="bg-light-200 hover:bg-light-100"
                    />
                </form>
                <div className="space-y-5">
                    <h5 className="text-headline-small text-light-100">Pending Invitations</h5>
                    <div className="flex gap-2.5">
                        {emails.map((email, index) => (
                            <div key={index} className="p-2.5 bg-dark-400 border border-primary-200 flex items-center gap-[5px]">
                                <span className="text-body-medium text-light-200">{email}</span>
                                <button 
                                    className="text-indicator-500 text-2xl"
                                    onClick={() => {}}
                                >
                                    <IoMdClose />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* <RequestResponseModal 
            Icon={MdGroupAdd}
            title="Invitation Sent"
            description={<>
                Your team member will receive an email to <br /> 
                collaborate with you on this project shortly.
            </>}
            buttonTitle="Go Back"
            onButtonClick={() => {}}
        /> */}
        </>
    );
};
 
export default NewTeamMemberSection;

const permissions = [
    "Create tasks and assign bounties",
    "View and edit tasks",
    "View and edit project settings",
    "View and edit project members",
    "View and edit project billing"
];

const emails = [
    "L0h4T@example.com",
    "H6yWm@example.com",
    "IhH5b@example.com"
];
