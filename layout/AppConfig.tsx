"use client";
import type { AppConfigProps, ColorScheme } from "@/types/index";
import { PrimeReactContext } from "primereact/api";
import { Button } from "primereact/button";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";
import { RadioButtonChangeEvent } from "primereact/radiobutton";
import { Sidebar } from "primereact/sidebar";
import { classNames } from "primereact/utils";
import { useContext, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";

const AppConfig = (props: AppConfigProps) => {
    const {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        isSlim,
        isSlimPlus,
        isHorizontal,
    } = useContext(LayoutContext);
    const { changeTheme } = useContext(PrimeReactContext);
    const scales = [12, 13, 14, 15, 16];
    const componentThemes = [
        { name: "indigo", color: "#6366F1" },
        { name: "blue", color: "#3B82F6" },
        { name: "purple", color: "#8B5CF6" },
        { name: "teal", color: "#14B8A6" },
        { name: "cyan", color: "#06b6d4" },
        { name: "green", color: "#10b981" },
        { name: "orange", color: "#f59e0b" },
        { name: "pink", color: "#d946ef" },
    ];

    useEffect(() => {
        if (isSlim() || isSlimPlus() || isHorizontal()) {
            setLayoutState((prevState) => ({ ...prevState, resetMenu: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutConfig.menuMode]);

    const onConfigButtonClick = () => {
        setLayoutState((prevState) => ({
            ...prevState,
            configSidebarVisible: true,
        }));
    };

    const onConfigSidebarHide = () => {
        setLayoutState((prevState) => ({
            ...prevState,
            configSidebarVisible: false,
        }));
    };

    const changeInputStyle = (e: RadioButtonChangeEvent) => {
        setLayoutConfig((prevState) => ({ ...prevState, inputStyle: e.value }));
    };

    const changeRipple = (e: InputSwitchChangeEvent) => {
        setLayoutConfig((prevState) => ({
            ...prevState,
            ripple: e.value as boolean,
        }));
    };

    const changeMenuMode = (e: RadioButtonChangeEvent) => {
        setLayoutConfig((prevState) => ({ ...prevState, menuMode: e.value }));
    };

    const changeMenuTheme = (e: RadioButtonChangeEvent) => {
        setLayoutConfig((prevState) => ({ ...prevState, menuTheme: e.value }));
    };

    const changeColorScheme = (colorScheme: ColorScheme) => {
        changeTheme?.(
            layoutConfig.colorScheme,
            colorScheme,
            "theme-link",
            () => {
                setLayoutConfig((prevState) => ({ ...prevState, colorScheme }));
            }
        );
    };

    const _changeTheme = (theme: string) => {
        changeTheme?.(layoutConfig.theme, theme, "theme-link", () => {
            setLayoutConfig((prevState) => ({ ...prevState, theme }));
        });
    };

    const decrementScale = () => {
        setLayoutConfig((prevState) => ({
            ...prevState,
            scale: prevState.scale - 1,
        }));
    };

    const incrementScale = () => {
        setLayoutConfig((prevState) => ({
            ...prevState,
            scale: prevState.scale + 1,
        }));
    };

    const applyScale = () => {
        document.documentElement.style.fontSize = layoutConfig.scale + "px";
    };

    useEffect(() => {
        applyScale();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutConfig.scale]);

    return (
        <>
            {/* <button
                className="layout-config-button config-link"
                type="button"
                onClick={onConfigButtonClick}
            >
                <i className="pi pi-cog"></i>
            </button> */}

            <Sidebar
                visible={layoutState.configSidebarVisible}
                onHide={onConfigSidebarHide}
                position="right"
                className="layout-config-sidebar w-18rem"
            >
                <h5>Themes</h5>
                <div className="flex flex-wrap row-gap-3">
                    {componentThemes.map((theme, i) => {
                        return (
                            <div key={i} className="w-3">
                                <button
                                    type="button"
                                    className="cursor-pointer p-link w-2rem h-2rem border-circle flex-shrink-0 flex align-items-center justify-content-center"
                                    onClick={() => _changeTheme(theme.name)}
                                    style={{ backgroundColor: theme.color }}
                                >
                                    {theme.name == layoutConfig.theme && (
                                        <i className="pi pi-check text-white"></i>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <h5>Scale</h5>
                <div className="flex align-items-center">
                    <Button
                        icon="pi pi-minus"
                        type="button"
                        onClick={decrementScale}
                        className="w-2rem h-2rem mr-2"
                        rounded
                        text
                        disabled={layoutConfig.scale === scales[0]}
                    ></Button>
                    <div className="flex gap-2 align-items-center">
                        {scales.map((s, i) => {
                            return (
                                <i
                                    key={i}
                                    className={classNames(
                                        "pi pi-circle-fill text-300",
                                        {
                                            "text-primary-500":
                                                s === layoutConfig.scale,
                                        }
                                    )}
                                ></i>
                            );
                        })}
                    </div>
                    <Button
                        icon="pi pi-plus"
                        type="button"
                        onClick={incrementScale}
                        className="w-2rem h-2rem ml-2"
                        rounded
                        text
                        disabled={
                            layoutConfig.scale === scales[scales.length - 1]
                        }
                    ></Button>
                </div>

                {!props.minimal && (
                    <>
                        <h5>Menu Type</h5>
                        <div className="flex flex-wrap row-gap-3">
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="static"
                                    checked={layoutConfig.menuMode === "static"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode1"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode1">Static</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="overlay"
                                    checked={layoutConfig.menuMode === "overlay"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode2"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode2">Overlay</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="slim"
                                    checked={layoutConfig.menuMode === "slim"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode3"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode3">Slim</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="slim-plus"
                                    checked={layoutConfig.menuMode === "slim-plus"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode4"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode4">Slim +</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="drawer"
                                    checked={layoutConfig.menuMode === "drawer"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode7"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode7">Drawer</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="reveal"
                                    checked={layoutConfig.menuMode === "reveal"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode5"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode6">Reveal</label>
                            </div>
                            <div className="flex align-items-center gap-2 w-6">
                                <input
                                    type="radio"
                                    name="menuMode"
                                    value="horizontal"
                                    checked={layoutConfig.menuMode === "horizontal"}
                                    onChange={(e) => changeMenuMode({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="mode5"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="mode5">Horizontal</label>
                            </div>
                        </div>

                        <h5>Menu Theme</h5>
                        <div className="field-radiobutton">
                            <input
                                type="radio"
                                name="menuTheme"
                                value="colorScheme"
                                checked={layoutConfig.menuTheme === "colorScheme"}
                                onChange={(e) => changeMenuTheme({ value: e.target.value } as RadioButtonChangeEvent)}
                                id="menutheme-colorscheme"
                                style={{ 
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#007bff"
                                }}
                            />
                            <label htmlFor="menutheme-colorscheme">
                                Color Scheme
                            </label>
                        </div>
                        <div className="field-radiobutton">
                            <input
                                type="radio"
                                name="menuTheme"
                                value="primaryColor"
                                checked={layoutConfig.menuTheme === "primaryColor"}
                                onChange={(e) => changeMenuTheme({ value: e.target.value } as RadioButtonChangeEvent)}
                                id="menutheme-primarycolor"
                                style={{ 
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#007bff"
                                }}
                            />
                            <label htmlFor="menutheme-primarycolor">
                                Primary Color
                            </label>
                        </div>
                        <div className="field-radiobutton">
                            <input
                                type="radio"
                                name="menuTheme"
                                value="transparent"
                                checked={layoutConfig.menuTheme === "transparent"}
                                onChange={(e) => changeMenuTheme({ value: e.target.value } as RadioButtonChangeEvent)}
                                id="menutheme-transparent"
                                style={{ 
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#007bff"
                                }}
                            />
                            <label htmlFor="menutheme-transparent">
                                Transparent
                            </label>
                        </div>
                    </>
                )}

                <h5>Color Scheme</h5>
                <div className="field-radiobutton">
                    <input
                        type="radio"
                        name="colorScheme"
                        value="light"
                        checked={layoutConfig.colorScheme === "light"}
                        onChange={(e) => changeColorScheme(e.target.value as ColorScheme)}
                        id="mode-light"
                        style={{ 
                            width: "16px",
                            height: "16px",
                            accentColor: "#007bff"
                        }}
                    />
                    <label htmlFor="mode-light">Light</label>
                </div>
                <div className="field-radiobutton">
                    <input
                        type="radio"
                        name="colorScheme"
                        value="dim"
                        checked={layoutConfig.colorScheme === "dim"}
                        onChange={(e) => changeColorScheme(e.target.value as ColorScheme)}
                        id="mode-dim"
                        style={{ 
                            width: "16px",
                            height: "16px",
                            accentColor: "#007bff"
                        }}
                    />
                    <label htmlFor="mode-dim">Dim</label>
                </div>
                <div className="field-radiobutton">
                    <input
                        type="radio"
                        name="colorScheme"
                        value="dark"
                        checked={layoutConfig.colorScheme === "dark"}
                        onChange={(e) => changeColorScheme(e.target.value as ColorScheme)}
                        id="mode-dark"
                        style={{ 
                            width: "16px",
                            height: "16px",
                            accentColor: "#007bff"
                        }}
                    />
                    <label htmlFor="mode-dark">Dark</label>
                </div>

                {!props.minimal && (
                    <>
                        <h5>Input Style</h5>
                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <input
                                    type="radio"
                                    name="inputStyle"
                                    value="outlined"
                                    checked={layoutConfig.inputStyle === "outlined"}
                                    onChange={(e) => changeInputStyle({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="outlined_input"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="outlined_input">Outlined</label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <input
                                    type="radio"
                                    name="inputStyle"
                                    value="filled"
                                    checked={layoutConfig.inputStyle === "filled"}
                                    onChange={(e) => changeInputStyle({ value: e.target.value } as RadioButtonChangeEvent)}
                                    id="filled_input"
                                    style={{ 
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#007bff"
                                    }}
                                />
                                <label htmlFor="filled_input">Filled</label>
                            </div>
                        </div>

                        <h5>Ripple Effect</h5>
                        <InputSwitch
                            checked={layoutConfig.ripple}
                            onChange={changeRipple}
                        ></InputSwitch>
                    </>
                )}
            </Sidebar>
        </>
    );
};

export default AppConfig;
