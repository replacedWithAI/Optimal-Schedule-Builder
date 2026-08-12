import {useState} from "react";
import "./PinCoursePartsButton.css";

/**
 * A small dropdown panel to add courses to pinnedCourseParts
 */
export default function PinCoursePartsButton({label, placeholder, tags, onAdd, onRemove}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");

    const submitDraft = () => {
        if (!draft.trim()) return;
        onAdd(draft);
        setDraft("");
    };

    return (
        <div className="tag-popover-wrapper">
            <button
                type="button"
                className={`tag-popover-trigger ${tags.length > 0 ? 
                                                    "tag-popover-active" : ""}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                {label}
                {tags.length > 0 && 
                <span className="tag-popover-count">    
                    {tags.length}
                </span>}
            </button>

            {open && (
                <div className="tag-popover-panel">
                    <input
                        type="text"
                        className="tag-popover-input"
                        placeholder={placeholder}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key == "Enter") {
                                e.preventDefault();
                                submitDraft();
                            }
                        }}
                    />

                    <div className="tag-popover-chip">
                        {tags.length === 0 && 
                        <p className="tag-popover-empty">None added</p>}
                        {tags.map((tag) => (
                            <span className="tag-popover-chip" key={tag}>
                                {tag}
                                <button 
                                    type="button" 
                                    onClick={() => onRemove(tag)}
                                    aria-label={`Remove ${tag}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}