import { useState } from "react";
import ConfigPanel from "../components/main/ConfigPanel";
import CourseList from "../components/main/CourseList.jsx";
import useStatesAndFunctions from "../hooks/useLib.js";
import FetchSchedule from "../components/main/timetable.jsx";
import "./MainPage.css";


export default function MainPage({user, onLogout}) {
    const functionsAndUseStates = useStatesAndFunctions();

    return (
        <div className="page-wrapper">
            <header className="top-menu">
                <span>
                    {user !== undefined ? user.email : "Undefined email"}
                </span>
                <button className="signout-button" onClick={onLogout}>
                    Sign out
                </button>
            </header>

            <main className="main-content">
                <aside className="left-panel">
                    <ConfigPanel functionsAndUseStates={functionsAndUseStates} />
                </aside>

                <aside className="right-panel">
                    <div className="top-right">
                        <FetchSchedule
                            functionsAndUseStates={functionsAndUseStates}
                        />
                    </div>

                    <div className="bottom-right">
                        <CourseList
                            functionsAndUseStates={functionsAndUseStates}
                        />
                    </div>
                </aside>
            </main>
        </div>
    );
}