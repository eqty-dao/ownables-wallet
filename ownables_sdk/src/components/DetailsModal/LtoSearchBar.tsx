import SearchIcon from "../../assets/search_icon.svg";
import { themeStyles } from "../../theme/themeStyles";
import { themeColors } from "../../theme/themeColors";
import ClearSearchIcon from "../../assets/clear_search_icon.svg";
import { useRef } from "react";
import { useFilters } from "../../context/FilterContext";
import styled from "@emotion/styled";

const FilterIconContainer = styled.div`
  cursor: pointer;
  width: 30px;
  height: 30px;
  margin-left: 16px;
  margin-right: 16px;
`;

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
  const { isFiltering } = useFilters();

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

        <FilterIconContainer onClick={onFilterClick}>
          <FilterIcon color={isFiltering ? "#B770FF" : "#ffffff"} />
        </FilterIconContainer>
      </div>
    </>
  );
}

interface FilterIconProps {
  color: string;
}

const FilterIcon = (props: FilterIconProps) => {
  return (
    <svg
      width="32"
      height="32"
      fill={"transparent"}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.7735 22.1234H5.37256"
        stroke={props.color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M17.5205 9.20056H25.9215"
        stroke={props.color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.635 9.12834C11.635 7.4008 10.2241 6 8.48411 6C6.74413 6 5.33325 7.4008 5.33325 9.12834C5.33325 10.8559 6.74413 12.2567 8.48411 12.2567C10.2241 12.2567 11.635 10.8559 11.635 9.12834Z"
        stroke={props.color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M26.6665 22.0717C26.6665 20.3442 25.2567 18.9434 23.5167 18.9434C21.7756 18.9434 20.3647 20.3442 20.3647 22.0717C20.3647 23.7992 21.7756 25.2 23.5167 25.2C25.2567 25.2 26.6665 23.7992 26.6665 22.0717Z"
        stroke={props.color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default LtoSearchBar;
