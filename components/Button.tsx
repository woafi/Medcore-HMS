"use client";

const icons = {
    add: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
    )
};

const Button = ({
    text,
    iconType = null,
    onClick,
    type = "button",
    disabled = false,
    className = ""
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm ${className}`}
        >
            {iconType && icons[iconType]}
            {text}
        </button>
    );
};

export default Button;