import React, { useState, useEffect } from "react";
import ConfigPanel from "../components/main/ConfigPanel.jsx";
import useStatesAndFunctions from "../hooks/useLib.js";

export default {
    title: "components/ConfigPanel",
    component: ConfigPanel
}

const ConfigPanelTemplate = () => {
    const functionsAndUseStates = useStatesAndFunctions();

    useEffect(() => {
        functionsAndUseStates.setPossibleCourses(["EECS 1021", "MATH 1014"]);
        functionsAndUseStates.setPinnedCourses(["EECS 3101"]);
        functionsAndUseStates.setPinnedCampuses(["Keele"])
        functionsAndUseStates.setMaxCoursesPerTerm(5);
        functionsAndUseStates.setRequiredNumReviews(3);
        functionsAndUseStates.setDefaultRMPScore(3.0);
        functionsAndUseStates.setObjectivePriority(["minimal dead times"]);
        functionsAndUseStates.setCommuteTimes(15);
        functionsAndUseStates.setScheduleError(
            "Reallllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll"
            +"lllllllllllllllllllllllllllllllllllllllly long testing error");
    }, []);

    return (
        <div style={{ width: "400px", height: "100vh", background: "#f5f5f5" }}>
            <ConfigPanel functionsAndUseStates={functionsAndUseStates} />
        </div>
    );
};

export const Default = ConfigPanelTemplate.bind({});
Default.args={}; // saying there's no properties from parent HTML 