import SearchFilterIcon from "../../assets/search_filter_icon.svg"; // Adjust the import path as necessary
import SearchIcon from "../../assets/search_icon.svg"; // Adjust the import path as necessary
import { themeStyles } from "../../theme/themeStyles";
import { themeColors } from "../../theme/themeColors";
import ClearSearchIcon from "../../assets/clear_search_icon.svg";
import { useRef } from "react";

const styles = {
  closeIcon: {
    width: "10px",
    height: "10px",
    marginRight: "10px",
  },
  searchBarRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "19px",
  },
  searchBarContainer: {
    background: themeColors.actionBtn,
    padding: "10px 15px",
    borderRadius: "25px",
    display: "flex",
    alignItems: "center",
    width: "calc(100% - 30px)",
    marginLeft: "16px",
  },
  input: {
    ...themeStyles.fs16fw400lh21,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    marginLeft: "10px",
    width: "100%",
  },
  searchIcon: {
    width: "22px",
    height: "22px",
  },
  filterIcon: {
    cursor: "pointer",
    width: "30px",
    height: "30px",
    marginLeft: "16px",
    marginRight: "16px",
  },
};

type SearchBarProps = {
  query: string;
  onSearch: (query: string) => void;
  onFilterClick: () => void;
  onClear: () => void;
};

function LtoSearchBar({
  query,
  onSearch,
  onFilterClick,
  onClear,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onSearch(e.target.value);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputRef.current) inputRef.current.blur();
  };

  return (
    <>
      <style>
        {`
          .search-input::placeholder {
            color: ${themeColors.subText}; 
          }
        `}
      </style>
      <div style={styles.searchBarRow}>
        <form style={styles.searchBarContainer} onSubmit={handleSubmit}>
          <img src={SearchIcon} alt="Search" style={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search collections..."
            className="search-input"
            style={styles.input}
            value={query}
            onChange={handleChange}
          />
          {query && (
            <img
              src={ClearSearchIcon}
              alt="Clear"
              style={styles.closeIcon}
              onClick={onClear}
            />
          )}
        </form>
        <img
          src={SearchFilterIcon}
          alt="Filter"
          style={styles.filterIcon}
          onClick={onFilterClick}
        />
      </div>
    </>
  );
}

export default LtoSearchBar;
