import { useState } from "react";
import "./ToggleFieldList.css";

/**
 * This is used to insert modified course data, in case the stored data is wrong 
 * Type a course name, press enter, click the toggle list to expand its fields. 
 * For each course, there can be 4 toggle lists: first for courses, then sections,
 * then classes/modules, then sessions
 */
export default function ToggleFieldList({entries, fields, onAdd, onRemove, 
                                        onFieldChange, addPlaceholder, nested, 
                                        path = []}) {
    const [draft, setDraft] = useState("");
    const [openKeys, setOpenKeys] = useState([]);


    const submitDraft = () => {
        if (!draft.trim()) return;
        onAdd(path, draft);
        setDraft("");
    };


    const toggleOpen = (key) => {
        setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) :
                    [...prev, key]));
    };


    const keys = Object.keys(entries);

    return (
        <div className="toggle-field-list">
            <div className="toggle-add-row">
                <input
                    type="text"
                    value={draft}
                    placeholder={addPlaceholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submitDraft();
                        }
                    }}
                />
            </div>

            {keys.length === 0 && <p className="toggle-empty">Nothing modified yet</p>}

            {keys.map((key) => {
                const isOpen = openKeys.includes(key);
                const isLeaf = fields.length === 0 && !nested;
                return (
                    <div className="toggle-item" key={key}>
                        <div className="toggle-item-header">
                            {isLeaf ? (
                            <span className="toggle-item-title 
                                             toggle-item-title-static"
                             >
                                {key}
                            </span>)
                            : (
                            <button 
                                type="button" 
                                className="toggle-item-title"
                                onClick={() => toggleOpen(key)}
                            >
                                <span className={`toggle-caret ${isOpen ? 
                                                "toggle-caret-open" : ""}`}>
                                    ›
                                </span>
                                {key}
                            </button>
                            )}

                            <button
                                type="button"
                                className="toggle-item-remove"
                                onClick={() => onRemove(...path, key)}
                                aria-label={`Remove ${key}`}
                            >
                                ×
                            </button>
                        </div>

                        {isOpen && !isLeaf && (
                            <div className="toggle-item-body">
                                {fields.map((field) => (
                                    <div className="toggle-field-row" key={field.key}>
                                        <label className="toggle-field-label">
                                            {field.label}
                                        </label>

                                        <input
                                            type="text"
                                            className="toggle-field-input"
                                            value={entries[key][field.key] ?? ""}
                                            onChange={(e) => onFieldChange(path, key, 
                                                    field.key, e.target.value)}
                                        />
                                    </div>
                                ))}

                                {nested && (
                                    <div className="toggle-nested">
                                        <p className="toggle-nested-label">{nested.label}</p>
                                        <ToggleFieldList
                                            entries={nested.getEntries(entries[key])}
                                            fields={nested.fields}
                                            onAdd={nested.onAdd}
                                            onRemove={nested.onRemove}
                                            onFieldChange={nested.onFieldChange}
                                            addPlaceholder={nested.addPlaceholder}
                                            nested={nested.nested}
                                            path={[...path, key]}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}