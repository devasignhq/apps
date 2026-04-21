"use client";
import { IoIosCheckbox } from "react-icons/io";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import RegularDropdown from "@devasign/shared/components/Dropdown/Regular";
import { IssueDto } from "@/app/models/github.model";
import { CreateTaskDto, TimelineType } from "@/app/models/task.model";
import { useState } from "react";
import { object, string, number } from "yup";
import { useFormik } from "formik";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { useUpdateEffect } from "ahooks";
import { twMerge } from "tailwind-merge";
import MoneyInput from "@devasign/shared/components/Input/MoneyInput";
import Tooltip from "@devasign/shared/components/Tooltip";

type TaskPayload = {
    payload: CreateTaskDto;
    valid: boolean;
}

const createTaskSchema = object({
    bounty: string().required("Required"),
    timeline: number().required("Required")
        .min(1, "Minimum: 1")
        .max(99, "Maximum: 99"),
    timelineType: string().oneOf(["WEEK", "DAY"]).required("Required")
});

type CreateTaskCardProps = {
    issue: IssueDto;
    bountyLabelId: string;
    defaultSelected: TaskPayload | undefined;
    showFields: boolean;
    onToggleCheck: (taskPayload: TaskPayload | null) => void;
    disableFields: boolean;
    uploadStatus?: "PENDING" | "CREATED" | "FAILED";
}

const CreateTaskCard = ({
    issue,
    bountyLabelId,
    defaultSelected,
    showFields,
    onToggleCheck,
    disableFields,
    uploadStatus
}: CreateTaskCardProps) => {
    const { activeInstallation } = useInstallationStore();
    const [selected, setSelected] = useState(Boolean(defaultSelected));

    const formik = useFormik({
        initialValues: {
            bounty: defaultSelected?.payload.bounty || "",
            timeline: defaultSelected?.payload.timeline || undefined,
            timelineType: defaultSelected?.payload.timelineType || "WEEK"
        },
        validationSchema: createTaskSchema,
        validateOnMount: true,
        validateOnBlur: true,
        onSubmit: () => { }
    });

    const handleToggleCheck = (selected: boolean) => {
        if (!selected) {
            onToggleCheck(null);
            return;
        }

        const taskPayload: CreateTaskDto = {
            installationId: activeInstallation!.id,
            issue: {
                ...issue,
                labels: issue.labels.nodes
            },
            bounty: formik.values.bounty.replace(/,/g, ""),
            timeline: formik.values.timeline!,
            timelineType: formik.values.timelineType as TimelineType,
            bountyLabelId
        };
        onToggleCheck({ payload: taskPayload, valid: formik.isValid });
    };

    const toggleSelect = () => {
        let selected = false;

        setSelected(prev => {
            selected = !prev;
            return selected;
        });
        handleToggleCheck(selected);
    };

    useUpdateEffect(() => handleToggleCheck(selected), [formik.isValid, formik.values]);

    return (
        <div className={
            twMerge(`w-full py-3 px-[15px] border ${selected ? "bg-dark-400 border-primary-200" : "border-dark-200 hover:border-light-100"}`,
                uploadStatus === "CREATED" && "border-indicator-100 task-uploaded",
                uploadStatus === "FAILED" && "border-indicator-500 task-uploaded",
                uploadStatus === "PENDING" && "animate-pulse"
            )
        }>
            <div className="flex items-center gap-[15px]">
                <p className="text-body-medium text-primary-400">#{issue.number}</p>
                <p className="text-body-medium text-light-100 truncate">{issue.title}</p>
                <button className="ml-auto" onClick={toggleSelect}>
                    {selected ? (
                        <IoIosCheckbox className="text-[18px] text-primary-100" />
                    ) : (
                        <MdOutlineCheckBoxOutlineBlank className="text-[18px] text-dark-100" />
                    )}
                </button>
            </div>
            <div className="max-w-[90%] flex item-center gap-[5px] mt-1">
                {disableFields ? (
                    <p className="text-body-micro text-light-200 mt-[5px] max-w-[50%] truncate">
                        {issue.url || ""}
                    </p>
                ) : (
                    <Link
                        href={issue.url || ""}
                        target="_blank"
                        className="text-body-micro text-light-200 mt-[5px] max-w-[50%] truncate"
                    >
                        {issue.url || ""}
                    </Link>
                )}
                {issue.labels?.nodes?.length > 0 && (
                    <p className="py-0.5 px-[7px] bg-primary-300 text-primary-100 text-body-tiny font-bold max-w-[50%] truncate">
                        {issue.labels.nodes
                            .map(label => label.name)
                            .map((name, index, array) =>
                                index === array.length - 1 ? name : `${name}, `
                            )
                            .join("")}
                    </p>
                )}
            </div>
            {showFields && (
                <div className="flex items-start gap-5 mt-2.5">
                    <div>
                        <Tooltip message="Bounty amount">
                            <div className="relative">
                                <Image
                                    src="/usdc.svg"
                                    alt="$"
                                    width={16}
                                    height={16}
                                    className="absolute top-1/2 -translate-y-1/2 left-2.5"
                                />
                                <MoneyInput
                                    attributes={{
                                        id: "bounty",
                                        name: "bounty",
                                        placeholder: "0.00",
                                        className: `w-[115px] h-[40px] py-[7px] pl-[36px] pr-[15px] bg-dark-400 border border-dark-200 text-body-tiny text-light-100 
                                        ${formik.touched.bounty && formik.errors.bounty && "border-indicator-500"}`,
                                        value: formik.values.bounty,
                                        onBlur: formik.handleBlur,
                                        disabled: disableFields
                                    }}
                                    setValue={(value) => formik.setFieldValue("bounty", value)}
                                />
                            </div>
                        </Tooltip>
                        {formik.touched.bounty && formik.errors.bounty && (
                            <p className="text-indicator-500 text-body-tiny mt-1">{formik.errors.bounty}</p>
                        )}
                    </div>
                    <div className="relative flex gap-[7px]">
                        <div>
                            <Tooltip message="Number of days/weeks to complete the task">
                                <input
                                    id="timeline"
                                    name="timeline"
                                    type="number"
                                    placeholder="1-99"
                                    step="1"
                                    className={`w-[80px] h-[40px] py-[7px] px-[15px] bg-dark-400 border border-dark-200 text-body-tiny text-light-100 
                                        ${formik.touched.timeline && formik.errors.timeline && "border-indicator-500"}`
                                    }
                                    value={formik.values.timeline}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    disabled={disableFields}
                                />
                            </Tooltip>
                            {formik.touched.timeline && formik.errors.timeline && (
                                <p className="text-indicator-500 text-body-tiny mt-1">{formik.errors.timeline}</p>
                            )}
                        </div>
                        <div>
                            <Tooltip message="Time unit for the timeline">
                                <RegularDropdown
                                    defaultName={
                                        (defaultSelected?.payload.timelineType === "DAY") ? "Day(s)" : "Week(s)"
                                    }
                                    options={[
                                        { label: "Week(s)", value: "WEEK" },
                                        { label: "Day(s)", value: "DAY" }
                                    ]}
                                    fieldName="label"
                                    fieldValue="value"
                                    buttonAttributes={{
                                        style: { height: "40px", fontSize: "12px", lineHeight: "16px" },
                                        disabled: disableFields
                                    }}
                                    onChange={(value) => formik.setFieldValue("timelineType", value)}
                                />
                            </Tooltip>
                            {formik.touched.timelineType && formik.errors.timelineType && (
                                <p className="text-indicator-500 text-body-tiny mt-1">{formik.errors.timelineType}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTaskCard;
