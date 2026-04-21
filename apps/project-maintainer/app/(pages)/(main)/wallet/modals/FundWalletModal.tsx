"use client";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { QRCodeCanvas } from "qrcode.react";
import CopyButton from "@devasign/shared/components/CopyButton";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { useEffect, useState } from "react";
import { moneyFormat } from "@/app/utils/helper";
import { useXLMUSDCFromStellarDEX } from "@/app/services/horizon.service";
import { LiaExchangeAltSolid } from "react-icons/lia";

type FundWalletModalProps = {
    toggleModal: () => void;
    displayTopUpAmount?: {
        totalBountiesInUSDC: string;
        xlmBalance: string;
    };
}

const FundWalletModal = ({ toggleModal, displayTopUpAmount }: FundWalletModalProps) => {
    const { activeInstallation } = useInstallationStore();
    const [totalBountiesInXLM, setTotalBountiesInXLM] = useState("");
    const [topUpAmount, setTopUpAmount] = useState("");
    const {
        xlmPriceInUsdc,
        isLoading: priceLoading,
        error: priceError
    } = useXLMUSDCFromStellarDEX(5000, !displayTopUpAmount);

    useEffect(() => {
        if (!displayTopUpAmount) return;

        if (xlmPriceInUsdc && Number(xlmPriceInUsdc) > 0) {
            const xlmToSend = (Number(displayTopUpAmount.totalBountiesInUSDC) / Number(xlmPriceInUsdc)).toFixed(2);
            setTotalBountiesInXLM(xlmToSend);
        } else {
            setTotalBountiesInXLM("");
        }
    }, [displayTopUpAmount, xlmPriceInUsdc]);

    useEffect(() => {
        if (!totalBountiesInXLM || !displayTopUpAmount) return;

        setTopUpAmount((Number(totalBountiesInXLM) - Number(displayTopUpAmount?.xlmBalance)).toFixed(2));
    }, [displayTopUpAmount, totalBountiesInXLM]);

    return (
        <PopupModalLayout title="Fund Wallet" toggleModal={toggleModal}>
            <p className="text-body-medium text-dark-100 mt-2.5">
                Kindly deposit only XLM to the wallet below as any other token sent will be lost FOREVER.
            </p>
            {displayTopUpAmount ? (
                <section className="w-full space-y-5">
                    <p className="text-body-tiny flex items-center gap-2.5">
                        <span className="font-bold text-light-100">Total Bounties:</span>
                        <span className="text-primary-400">
                            {displayTopUpAmount.xlmBalance.split(".")[0]}.{displayTopUpAmount.xlmBalance.split(".")[1] || "00"} USDC
                        </span>
                        <LiaExchangeAltSolid className="text-xl text-primary-400" />
                        <span className="text-primary-400">
                            {(priceLoading && !xlmPriceInUsdc) ? (
                                <span className="h-4 w-12 rounded bg-dark-300 animate-pulse" />
                            ) : priceError ? (
                                <span>--</span>
                            ) : (
                                <span>{moneyFormat(totalBountiesInXLM).split(".")[0]}.{totalBountiesInXLM.split(".")[1] || "00"}</span>
                            )}
                            <span> XLM</span>
                        </span>
                    </p>
                    <div className="w-full py-2.5 px-[15px] text-light-100 border border-dark-200">
                        <p className="text-body-tiny mb-2.5">Top Up Amount (XLM)</p>
                        {(priceLoading && !xlmPriceInUsdc) ? (
                            <p className="text-display-small font-normal">-- XLM</p>
                        ) : (
                            <p>
                                <span className="text-display-small font-normal">{topUpAmount.split(".")[0]}</span>
                                <span className="text-body-medium">.{topUpAmount.split(".")[1]}{" "}XLM</span>
                            </p>
                        )}
                    </div>
                </section>
            ) : null}
            <section className="w-full flex items-center gap-5 mt-5">
                <div className="py-2.5">
                    <QRCodeCanvas
                        value={activeInstallation!.wallet.address}
                        width={116}
                        height={112}
                        bgColor="#FEF3C7"
                    />
                </div>
                <div className="w-full space-y-2.5">
                    <div className="w-full p-2.5 wallet-info relative bg-dark-400 flex items-center justify-between">
                        <p className="text-body-small">
                            <span className="font-bold text-light-200">Network:</span>
                            <span className="text-light-100">{" "}Stellar Blockchain</span>
                        </p>
                    </div>
                    <div className="w-full p-2.5 wallet-info relative bg-dark-400 flex items-center justify-between">
                        <p className="text-body-small">
                            <span className="font-bold text-light-200">Address:</span>
                            <span className="text-light-100 truncate">{" "}{activeInstallation!.wallet.address}</span>
                        </p>
                        <CopyButton text={activeInstallation!.wallet.address} />
                    </div>
                </div>
            </section>
            <section className="w-full my-5 space-y-[5px]">
                <div className="flex items-center justify-between">
                    <p className="text-body-tiny font-bold text-primary-400">Minimum Deposit:</p>
                    <p className="text-body-tiny text-light-200">1 XLM</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-body-tiny font-bold text-primary-400">Arrival Time:</p>
                    <p className="text-body-tiny text-light-200">30 seconds</p>
                </div>
                {/* <div className="flex items-center justify-between">
                    <p className="text-body-tiny font-bold text-primary-400">Contract Address:</p>
                    <div className="flex items-center gap-[5px]">
                        <p className="max-w-[145px] text-body-tiny text-light-200 truncate">CBJE2GX5BTM4VWE7R2Q7AOCLMMYFPK722QTHWCRFUPSFPC5XGNMHOR6N</p>
                        <CopyButton 
                            text="GDMLXK2WH3G456UUXVZPV5Y2KIHN2ZXXIJVKT7ZWPKGVFDQKFFRQL7HK" 
                            extendedClassName="text-base"
                        />
                    </div>
                </div> */}
            </section>
        </PopupModalLayout>
    );
};

export default FundWalletModal;
