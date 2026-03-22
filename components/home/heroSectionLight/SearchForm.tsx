import { FormEvent, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

const SearchForm: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const { styles } = theme;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = searchQuery.trim();
    if (!message) return;
    window.dispatchEvent(new CustomEvent("queryless:open", { detail: { message } }));
    setSearchQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="items-center flex flex-row gap-4"
    >
      <input
        id="search-form-input"
        type="text"
        name="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Ask about investment data..."
        aria-label="Ask AI assistant"
        className={`w-3/4 rounded-[10px] border-1 bg-white py-3 px-4 md:py-4 md:px-4 border leading-none placeholder-gray-500 ${styles.shadowMd}`}
      />
      <button
        type="submit"
        className={`text-lg border-b-[4px] border-accent rounded-[10px] ${styles.bgDark} uppercase font-medium px-3 py-3 md:px-10 md:py-4 leading-none lg:mt-0 ${styles.textLight}`}
      >
        <MagnifyingGlassIcon width={24} className="sm:hidden" />
        <span className="hidden sm:block">Ask</span>
      </button>
    </form>
  );
};

export default SearchForm;
