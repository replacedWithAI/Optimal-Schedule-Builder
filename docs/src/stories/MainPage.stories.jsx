import MainPage from "../pages/MainPage.jsx"
import React, { useState } from "react";

export default {
    title: "components/MainPage",
    component: MainPage
}

const MainPageTemplate = () => {
    return (
        <MainPage user={undefined} onLogout={undefined}/>
    );
}

export const Default = MainPageTemplate.bind({});
Default.args = {};