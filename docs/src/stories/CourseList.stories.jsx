import React, {useState, useEffect} from "react";
import CourseList from "../components/main/CourseList.jsx";
import useStatesAndFunctions from "../hooks/useLib.js";

export default {
    title: "components/CourseList",
    component: CourseList
}

const CourseListTemplate = () => {
    const functionsAndUseStates = useStatesAndFunctions();

    useEffect(() => {
        functionsAndUseStates.setPossibleCourses(["EECS 1021", "MATH 1014", "EECS 3311"]);
        functionsAndUseStates.setPinnedCourses(["EECS 3101", "EECS 1021"])
    }, []);

    return (
        <CourseList functionsAndUseStates={functionsAndUseStates} />
    );
}

export const Default = CourseListTemplate.bind({});
Default.args = {};