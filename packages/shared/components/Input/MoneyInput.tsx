/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect } from "react";

type MoneyInputProps = {
    attributes: React.InputHTMLAttributes<HTMLInputElement>;
    setValue: (value: string) => void;
    defaultValue?: number | string;
}

const MoneyInput = ({ attributes, setValue, defaultValue }: MoneyInputProps) => {

    useEffect(() => {
        if (!defaultValue) return;
        
        setValue(new Intl.NumberFormat().format(+defaultValue));
    }, [defaultValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const newValue = value.replace(/,/g, "");
        
        if (/^\d*\.?\d*$/.test(newValue) && (Number(value) !== 0)) {
            if (value.includes(".")) {
                const splittedValues = newValue.split(".");

                if (splittedValues[1]) {
                    const decimalValue = (Number(splittedValues[1]) * Math.pow(10, -(splittedValues[1].length)));
                    const wholeValue = Number(splittedValues[0]) + decimalValue;
                    const formattedValue = new Intl.NumberFormat().format(wholeValue);
                    if (decimalValue === 0) {
                        setValue(`${formattedValue  }.0`);
                    } else {
                        setValue(formattedValue);
                    }
                    return;
                }

                const formattedValue = new Intl.NumberFormat().format(Number(splittedValues[0]));
                setValue(`${formattedValue  }.`);
                return;
            }

            const formattedValue = new Intl.NumberFormat().format(Number(newValue));
            setValue(formattedValue);
            return;
        }

        if (Number(value) == 0 || isDecimal(value)) {
            setValue(value);
        }
    };

    return (
        <input
            type="text"
            onChange={handleChange}
            { ...attributes }
        />
    );
};
 
export default MoneyInput;

function isDecimal(str: string): boolean {
    const regex = /^-?\d+(\.\d+)?$/;
    return !!str.match(regex) && !isNaN(parseFloat(str));
}
