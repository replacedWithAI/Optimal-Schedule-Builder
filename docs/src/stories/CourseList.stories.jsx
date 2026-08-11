import CourseList from "../components/main/CourseList.jsx"
import React, { useState } from "react";

export default {
    title: "components/CourseList",
    component: CourseList
}

const CourseListTemplate = () => {
    const [possibleCourses, setPossibleCourses] = useState(["EECS 1021", "MATH 1014", 
                                                            "EECS 3311"]);
    const [pinnedCourses, setPinnedCourses] = useState(["EECS 3101", "EECS 1021"]);

    return (
        <CourseList
            possibleCourses={possibleCourses}
            setPossibleCourses={setPossibleCourses}
            pinnedCourses={pinnedCourses}
            setPinnedCourses={setPinnedCourses}
        />
    );
}

export const Default = CourseListTemplate.bind({});
Default.args = {};