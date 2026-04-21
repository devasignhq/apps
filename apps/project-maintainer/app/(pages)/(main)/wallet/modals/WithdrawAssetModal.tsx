"use client";
import { FiArrowDownRight, FiHelpCircle } from "react-icons/fi";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { handleApiErrorResponse, handleApiSuccessResponse, moneyFormat } from "@/app/utils/helper";
import { object, string } from "yup";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { useFormik } from "formik";
import MoneyInput from "@devasign/shared/components/Input/MoneyInput";
import { WalletAPI } from "@/app/services/wallet.service";
import { toast } from "react-toastify";
import RegularDropdown from "@devasign/shared/components/Dropdown/Regular";
import Tooltip from "@devasign/shared/components/Tooltip";

const withdrawAssetSchema = object({
    assetType: string().oneOf(["XLM", "USDC"]).required("Required"),
    amount: string().required("Required"),
    memo: string().optional(),
    walletAddress: string().required("Required")
});

type WithdrawAssetModalProps = {
    xlmBalance: string;
    usdcBalance: string;
    toggleModal: () => void;
    reloadTransactions: () => void;
    manualBalanceCheck: () => Promise<void>;
};

const WithdrawAssetModal = ({
    xlmBalance,
    usdcBalance,
    toggleModal,
    reloadTransactions,
    manualBalanceCheck
}: WithdrawAssetModalProps) => {
    const { activeInstallation } = useInstallationStore();

    const formik = useFormik({
        initialValues: {
            assetType: "XLM",
            amount: "",
            memo: "",
            walletAddress: ""
        },
        validationSchema: withdrawAssetSchema,
        onSubmit: async (values) => {
            const withdrawAmount = parseFloat(values.amount.replace(/,/g, ""));
            const balance = values.assetType === "XLM" ? parseFloat(xlmBalance) : parseFloat(usdcBalance);

            if (withdrawAmount > balance) {
                toast.error(`Insufficient ${values.assetType} balance for this withdrawal.`);
                return;
            }

            try {
                const response = await WalletAPI.withdrawAsset({
                    ...values,
                    amount: values.amount.replace(/,/g, ""),
                    installationId: activeInstallation!.id,
                    assetType: values.assetType as "XLM" | "USDC"
                });

                handleApiSuccessResponse(response);
                reloadTransactions();
                manualBalanceCheck();
                toggleModal();
            } catch (error) {
                handleApiErrorResponse(
                    error,
                    "An error occured while withdrawing asset. Please try again."
                );
            }
        }
    });

    const currentBalance = formik.values.assetType === "XLM" ? xlmBalance : usdcBalance;

    return (
        <PopupModalLayout title="Withdraw Asset" toggleModal={toggleModal}>
            <section className="my-[30px] space-y-[5px]">
                <p className="text-body-tiny font-bold text-light-100">{formik.values.assetType} Balance</p>
                <p className="text-primary-400">
                    <span className="text-display-large">{moneyFormat(currentBalance).split(".")[0]}</span>
                    <span className="text-body-medium">.{currentBalance.split(".")[1] || "00"} {formik.values.assetType}</span>
                </p>
            </section>
            <form className="w-full" onSubmit={formik.handleSubmit}>
                <section className="w-full space-y-5">
                    <div className="w-full flex gap-5">
                        <div className="w-full space-y-[5px]">
                            <label htmlFor="" className="text-body-tiny font-bold text-light-100">Select Asset</label>
                            <RegularDropdown
                                defaultName="Lumen (XLM)"
                                options={[
                                    { label: "Lumen (XLM)", value: "XLM" },
                                    { label: "Stablecoin (USDC)", value: "USDC" }
                                ]}
                                fieldName="label"
                                fieldValue="value"
                                extendedButtonClassName="w-full p-2.5 mt-[5px] bg-dark-400 border border-dark-200 
                                    text-body-medium text-light-100 font-bold flex justify-between items-center"
                                buttonAttributes={{
                                    style: { height: "40px", fontSize: "14px", lineHeight: "20px" },
                                    id: "assetType",
                                    name: "assetType",
                                    disabled: formik.isSubmitting
                                }}
                                onChange={(value) => formik.setFieldValue("assetType", value)}
                            />
                        </div>
                        <div className="w-full space-y-[5px]">
                            <label htmlFor="amount" className="text-body-tiny font-bold text-light-100">Amount to Withdraw</label>
                            <MoneyInput
                                attributes={{
                                    id: "amount",
                                    name: "amount",
                                    placeholder: "0.00",
                                    className: `w-full p-2.5 mt-[5px] bg-dark-400 border border-dark-200 text-body-medium text-light-100 font-bold 
                                        flex items-center ${formik.submitCount > 0 && formik.errors.amount && "border-indicator-500"}`,
                                    value: formik.values.amount,
                                    onBlur: formik.handleBlur,
                                    disabled: formik.isSubmitting
                                }}
                                setValue={(value) => formik.setFieldValue("amount", value)}
                            />
                        </div>
                    </div>
                    <div className="w-full space-y-[5px]">
                        <div className="flex items-center gap-1">
                            <label htmlFor="memo" className="text-body-tiny font-bold text-light-100 flex items-center gap-1">
                                Memo <span className="text-body-micro font-normal">(Optional)</span>
                            </label>
                            <Tooltip message={
                                <span>
                                    Please make sure that if MEMO/Tag is required by the recipient, <br />
                                    you provide it here. Otherwise, you may lose your assets.
                                </span>
                            }>
                                <FiHelpCircle className="text-dark-100 text-sm" />
                            </Tooltip>
                        </div>
                        <input
                            type="text"
                            id="memo"
                            name="memo"
                            placeholder="Enter memo"
                            className={`w-full p-2.5 pl-[15px] mt-[5px] bg-dark-400 border border-dark-200 text-body-medium text-light-100 
                                ${formik.submitCount > 0 && formik.errors.memo && "border-indicator-500"}`
                            }
                            value={formik.values.memo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                    </div>
                    <div className="w-full space-y-[5px]">
                        <label htmlFor="walletAddress" className="text-body-tiny font-bold text-light-100">Stellar Wallet Address</label>
                        <input
                            type="text"
                            id="walletAddress"
                            name="walletAddress"
                            placeholder="Enter wallet address"
                            className={`w-full p-2.5 pl-[15px] mt-[5px] bg-dark-400 border border-dark-200 text-body-medium text-light-100 
                                ${formik.submitCount > 0 && formik.errors.walletAddress && "border-indicator-500"}`
                            }
                            value={formik.values.walletAddress}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        <p className="text-body-tiny font-bold text-primary-100">
                            Only withdraw to a valid stellar address. Failure to do so may result in loss of funds FOREVER.
                        </p>
                    </div>
                </section>
                <section className="w-full my-[30px] space-y-[5px]">
                    <div className="flex items-center justify-between text-body-tiny leading-5">
                        <p className="font-medium text-primary-400">Blockchain Network:</p>
                        <p className="text-light-200">Stellar</p>
                    </div>
                    <div className="flex items-center justify-between text-body-tiny leading-5">
                        <p className="font-medium text-primary-400">Asset:</p>
                        <p className="text-light-200">{formik.values.assetType}</p>
                    </div>
                    <div className="flex items-center justify-between text-body-tiny leading-5">
                        <p className="font-medium text-primary-400">Minimum Withdrawal:</p>
                        <p className="text-light-200">1 {formik.values.assetType}</p>
                    </div>
                    <div className="flex items-center justify-between text-body-tiny leading-5">
                        <p className="font-medium text-primary-400">Arrival Time:</p>
                        <p className="text-light-200">30 seconds</p>
                    </div>
                </section>
                <ButtonPrimary
                    format="SOLID"
                    text={formik.isSubmitting ? "Withdrawing..." : "Withdraw"}
                    sideItem={<FiArrowDownRight />}
                    attributes={{
                        type: "submit",
                        disabled: formik.isSubmitting
                    }}
                    extendedClassName="w-fit"
                />
            </form>
        </PopupModalLayout>
    );
};

export default WithdrawAssetModal;
