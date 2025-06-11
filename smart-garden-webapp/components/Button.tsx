import React from "react";

export type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
}

export const Button: React.FC<ButtonProps> =({children,onClick})=>{
    return (<button onClick={onClick} className="px-4 py-2 rounded font-medium transition duration-150 bg-blue-600 text-white hover:bg-blue-700">{children}</button>)
}