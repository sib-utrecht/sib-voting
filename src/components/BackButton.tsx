export const BackButton = ({ onBack }: { onBack: () => void }) => {
    return <button
        onClick={onBack}
        aria-label="Back"
        className="text-gray-500 hover:text-gray-700 transition-colors"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-5 w-5"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 19l-7-7 7-7" />
        </svg>
    </button>
}