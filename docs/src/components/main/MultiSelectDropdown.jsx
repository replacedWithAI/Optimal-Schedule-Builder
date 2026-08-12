import {useState} from "react";
import "./MultiSelectDropdown.css";

export default function MultiSelectDropDown({options, selected, onToggle,
                                            placeholder = "Select", className = ""}){
    const [isOpen, setIsOpen] = useState(false);
    
    const summaryLabel = selected.length === 0 ? placeholder : options.filter(
        (option) => selected.includes(option.value)
    ).map((option) => option.label).join(", ")

    return (
        <div className={`multi-select-dropdown ${className}`}>
            <button
                type="button"
                className="multi-select-dropdown-toggle"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className="multi-select-dropdown-label">{summaryLabel}</span>
                <span className="multi-select-dropdown-caret" aria-hidden="true">▾</span>
            </button>

            {isOpen && (
                <ul
                    className="multi-select-dropdown-menu"
                    role="listbox"
                    aria-multiselectable="true"
                >
                    {options.map((option) => (
                        <li key={option.value} className="multi-select-dropdown-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option.value)}
                                    onChange={() => onToggle(option.value)}
                                />
                                {option.label}
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

}