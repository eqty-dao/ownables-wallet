import React from "react";

export default interface TypedFabItem {
    id: string;
    title: string;
    icon: React.ComponentType;
    backgroundColor?: string;
}