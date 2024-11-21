import { Box, Button, IconButton, Table, Typography, useMediaQuery } from "@mui/material";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import styled from "@emotion/styled";
import { themeStyles } from "../theme/themeStyles";
import { themeColors } from "../theme/themeColors";
import { LtoInputRefMethods } from "./common/LtoInput";
import { useEffect, useRef, useState } from "react";
import { ActivityLog, activityLogService } from "../services/ActivityLog.service";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  isPersistent?: boolean;
}

interface StyledButtonProps {
  transparent: boolean;
}

const StyledButton = styled(Button) <StyledButtonProps>`
  text-transform: none;
  height: 48px;
  color: #ffffff;
  ${(props) =>
    props.transparent === false &&
    `
        background-color: #510094;
    `}
`;

const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };

const closeModalBtnStyle = {
  padding: 0,
  color: themeColors.error,
};

const ActivityLogDrawer = (props: Props) => {
  const { open, onClose } = props;
  const [activityLogs, setActivityLogs] = useState<Array<ActivityLog>>(activityLogService.getAllLogs());
  const isMobile = useMediaQuery('(max-width:600px)');
  const nameCollectionRef = useRef<LtoInputRefMethods>(null);
  const onCancel = () => onClose();

  useEffect(() => {
    setActivityLogs(activityLogService.getAllLogs());
  }, [open]);

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={props.isPersistent}
      height="100%"
    >
      <Box
        display={"flex"}
        p={2}
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography sx={titleStyle}>{props.title}</Typography>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          sx={closeModalBtnStyle}
        >
          <CloseDrawerIcon />
        </IconButton>
      </Box>
      <Box p={2} sx={{ overflowX: 'auto' }}>
        <Table
          sx={{
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            width: "100%",
            "& th, & td": {
              maxWidth: isMobile ? "100px" : "200px",
              wordWrap: "break-word",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            "& th": {
              ...themeStyles.fs12fw400lh14,
              color: themeColors.subText,
              padding: isMobile ? "4px 0" : "8px 0",
              textAlign: "left",
              fontSize: isMobile ? '12px' : '14px',
            },
            "& td": {
              ...themeStyles.fs14fw400lh18,
              color: themeColors.titleText,
              padding: isMobile ? "4px 0" : "8px 0",
              textAlign: "left",
              fontSize: isMobile ? '12px' : '14px',
            },
            whiteSpace: isMobile ? "normal" : "nowrap",
          }}
        >
          <thead
            style={{
              borderBottom: "1px solid #E4E4E4",
            }}
          >
            <tr>
              <th>Activity</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map((activityLog, index) => (
              <tr key={index}>
                <td>{activityLog.activity}</td>
                <td>{activityLog.timestamp ? new Date(activityLog.timestamp).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
    </LtoDrawer>
  );
};

export default ActivityLogDrawer;
