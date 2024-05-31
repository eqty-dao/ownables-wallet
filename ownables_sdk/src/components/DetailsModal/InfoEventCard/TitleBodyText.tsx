import { Box, Typography } from "@mui/material";
import { themeStyles } from "../../../theme/themeStyles";
import { themeColors } from "../../../theme/themeColors";

interface TitleBodyTextProps {
  titleText: string;
  bodyText: React.ReactNode;
}
export const TitleBodyText: React.FC<TitleBodyTextProps> = ({
  titleText,
  bodyText,
}) => {
  return (
    <>
      <Typography sx={themeStyles.fs14fw400lh18}>
        <strong>{titleText}</strong>
        <br />
        <span
          style={{
            color: themeColors.titleText,
            wordWrap: "break-word",
          }}
        >
          {bodyText}
        </span>
      </Typography>
      <Box height="8px" />
    </>
  );
};
