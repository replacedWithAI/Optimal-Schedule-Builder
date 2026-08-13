import { useState } from "react";
import "./ToggleFieldList.css";

/**
 * This is used to insert modified course data, in case the stored data is wrong 
 * Type a course name, press enter, click the toggle list to expand its fields. 
 * For each course, there can be 4 toggle lists: first for courses, then sections,
 * then classes/modules, then sessions
 */
export default function ToggleFieldList({entries, fields, onAdd, onRemove, 
                                        onFieldChange, addPlaceholder, 
                                        touched, onTouch, onUntouch, validateAdd,
                                        nested, path = []}) {
    const [draft, setDraft] = useState("");
    const [openKeys, setOpenKeys] = useState([]);

    const draftId = [...path, "draft"].join(".");
    const isDraftInvalid = touched[draftId] ;

    const submitDraft = () => {
        const cleanedDraft = draft.trim().toUpperCase();

        if (cleanedDraft && validateAdd && !validateAdd(cleanedDraft)) {
            onTouch?.(draftId);
            return;
        }
        onAdd(path, cleanedDraft);
        setDraft("");
        onUntouch?.(draftId);
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
                    className={isDraftInvalid ? "toggle-field-error" : ""}
                    value={draft}
                    placeholder={addPlaceholder}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        onUntouch?.(draftId);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submitDraft();
                        }
                    }}
                />

                {isDraftInvalid && (
                    <span className="toggle-field-error">
                        Unexpected format
                    </span>
                )}
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
                                {fields.map((field) => {

                                    const fieldId = [...path, key, field.key].join(".");
                                    const value = entries[key][field.key] ?? "";
                                    const error = touched[fieldId] && 
                                        field.validate && !field.validate(value);

                                    return (
                                    <div className="toggle-field-row" key={field.key}>
                                        <label className="toggle-field-label">
                                            {field.label}
                                        </label>

                                        <input
                                            type="text"
                                            className={`toggle-field-input
                                                ${error ? "toggle-field-error" : ""}`}
                                            value={entries[key][field.key] ?? ""}
                                            onChange={(e) => {
                                                onFieldChange(path, key, 
                                                    field.key, e.target.value)
                                                onUntouch?.(draftId)
                                            }}
                                            onBlur={() => onTouch?.(fieldId)}
                                        />

                                        {error && (
                                            <span className="toggle-field-error">
                                                {field.errorMessage ? 
                                                 field.errorMessage : 
                                                 "Unexpected format"}
                                            </span>
                                        )}
                                    </div>
                                    );
                                })}

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
                                            touched={touched}
                                            onTouch={onTouch}
                                            onUntouch={onUntouch}
                                            validateAdd={nested.validateAdd}
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