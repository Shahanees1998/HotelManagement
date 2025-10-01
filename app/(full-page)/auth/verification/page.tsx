"use client";
import type { Page } from "@/types/index";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import React, { useContext, useState } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";

const Verification: Page = () => {
    const [value1, setValue1] = useState<number | null>();
    const [value2, setValue2] = useState<number | null>();
    const [value3, setValue3] = useState<number | null>();
    const [value4, setValue4] = useState<number | null>();
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    const dark = layoutConfig.colorScheme !== "light";

    const onDigitInput = (
        event: React.KeyboardEvent<HTMLSpanElement>,
        currentInputId: number
    ) => {
        const isDigit =
            event.code.includes("Numpad") || event.code.includes("Digit");
        const isBackspace = event.code === "Backspace";
        let nextInputId: number | null = null;

        if (isDigit) {
            nextInputId = currentInputId + 1;
        } else if (isBackspace) {
            nextInputId = currentInputId - 1;
        }

        const element =
            nextInputId !== null
                ? document.getElementById("val" + nextInputId)
                : null;

        if (element) {
            element.focus();
        }
    };

    return (
        <div style={{ backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            
            {/* Header */}
            <AuthHeader />

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4">
                        <div className="text-900 text-xl font-bold mb-2">
                            Verification
                        </div>
                        <span className="text-600 font-medium">
                            We have sent code to you email:
                        </span>
                        <div className="flex align-items-center mt-1">
                            <i className="pi pi-envelope text-600"></i>
                            <span className="text-900 font-bold ml-2">
                                dm**@gmail.com
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-column">
                        <div className="flex justify-content-between w-full align-items-center mb-4 gap-3">
                            <InputNumber
                                id="input1"
                                inputId="val1"
                                value={value1}
                                onValueChange={(e) => setValue1(e.value)}
                                inputClassName="w-3rem text-center"
                                maxLength={1}
                                onKeyUp={(e) => onDigitInput(e, 1)}
                            ></InputNumber>
                            <InputNumber
                                id="input2"
                                inputId="val2"
                                value={value2}
                                onValueChange={(e) => setValue2(e.value)}
                                inputClassName="w-3rem text-center"
                                maxLength={1}
                                onKeyUp={(e) => onDigitInput(e, 2)}
                            ></InputNumber>
                            <InputNumber
                                id="input3"
                                inputId="val3"
                                value={value3}
                                onValueChange={(e) => setValue3(e.value)}
                                inputClassName="w-3rem text-center"
                                maxLength={1}
                                onKeyUp={(e) => onDigitInput(e, 3)}
                            ></InputNumber>
                            <InputNumber
                                id="input4"
                                inputId="val4"
                                value={value4}
                                onValueChange={(e) => setValue4(e.value)}
                                inputClassName="w-3rem text-center"
                                maxLength={1}
                                onKeyUp={(e) => onDigitInput(e, 4)}
                            ></InputNumber>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-content-between">
                            <Button
                                label="Cancel"
                                outlined
                                className="flex-auto"
                                onClick={() => router.push("/")}
                            ></Button>
                            <Button
                                label="Verify"
                                className="flex-auto"
                                style={{
                                    backgroundColor: "#1e3a5f",
                                    border: "none"
                                }}
                                onClick={() => router.push("/")}
                            ></Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

export default Verification;
