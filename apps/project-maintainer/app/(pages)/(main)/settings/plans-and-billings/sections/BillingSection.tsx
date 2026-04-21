"use client";
import { MdOutlineFileDownload } from "react-icons/md";

const BillingSection = () => {
    return (
        <section className="max-h-[calc(100dvh-123px)] w-full p-[30px] sticky top-0 overflow-hidden flex flex-col">
            <h5 className="text-headline-small text-light-100 mb-[30px]">Billing</h5>
            <>
                <thead>
                    <tr className="pb-[7px] border-b border-[#585858] text-table-header text-light-200 flex gap-5">
                        <th className="w-full text-start">Invoice</th>
                        <th className="w-full text-start">Amount</th>
                        <th className="w-full text-start">Date</th>
                        <th className="w-full text-start">Plan</th>
                        <th className="w-full text-start">Status</th>
                        <th className="min-w-[80px]"></th>
                    </tr>
                </thead>
                <tbody className="grow overflow-y-auto">
                    <tr className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5">
                        <td className="w-full text-start">December 2024</td>
                        <td className="w-full text-start">$199</td>
                        <td className="w-full text-start">Dec 5, 2024</td>
                        <td className="w-full text-start">Pro</td>
                        <td className="w-full text-start text-indicator-100">Paid</td>
                        <td className="min-w-[80px]">
                            <button 
                                className="p-[5px] border border-primary-400 text-primary-400 text-2xl hover:border-transparent hover:bg-light-100 hover:text-dark-500"
                                onClick={() => {}}
                            >
                                <MdOutlineFileDownload />
                            </button>
                        </td>
                    </tr>
                    <tr className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5">
                        <td className="w-full text-start">December 2024</td>
                        <td className="w-full text-start">$199</td>
                        <td className="w-full text-start">Dec 5, 2024</td>
                        <td className="w-full text-start">Pro</td>
                        <td className="w-full text-start text-indicator-500">Failed</td>
                        <td className="min-w-[80px]">
                            <button 
                                className="p-[5px] border border-primary-400 text-primary-400 text-2xl hover:border-transparent hover:bg-light-100 hover:text-dark-500"
                                onClick={() => {}}
                            >
                                <MdOutlineFileDownload />
                            </button>
                        </td>
                    </tr>
                    <tr className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5">
                        <td className="w-full text-start">December 2024</td>
                        <td className="w-full text-start">$199</td>
                        <td className="w-full text-start">Dec 5, 2024</td>
                        <td className="w-full text-start">Pro</td>
                        <td className="w-full text-start text-indicator-100">Paid</td>
                        <td className="min-w-[80px]">
                            <button 
                                className="p-[5px] border border-primary-400 text-primary-400 text-2xl hover:border-transparent hover:bg-light-100 hover:text-dark-500"
                                onClick={() => {}}
                            >
                                <MdOutlineFileDownload />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </>
        </section>
    );
};
 
export default BillingSection;
