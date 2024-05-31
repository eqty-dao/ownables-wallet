import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Fingerprint } from "@mui/icons-material";
import { TypedMetadata } from "../../interfaces/TypedOwnableInfo";
import { EventChain } from "@ltonetwork/lto";
import shortId from "../../utils/shortId";
import Tooltip from "../Tooltip";
import EventChainService from "../../services/EventChain.service";
import useInterval from "../../utils/useInterval";
import If from "../If";
import { themeColors } from "../../theme/themeColors";
import { ReactComponent as CheckmarkIcon } from "../../assets/checkmark_icon.svg";
import { ReactComponent as CloseDrawerIcon } from "../../assets/close_drawer_icon.svg";
import { themeStyles } from "../../theme/themeStyles";
import InfoEventCard from "./InfoEventCard/InfoEventCard";
import LtoDrawer from "./LtoDrawer";

interface OwnableInfoDrawerProps {
  chain: EventChain;
  metadata?: TypedMetadata;
  open: boolean;
  onClose: () => void;
}

const fingerprintIconStyle = { color: themeColors.secondary };
const fingerprintIconBgStyle = {
  color: themeColors.titleText,
  borderColor: themeColors.secondary,
};

const verifiedIconBgStyle = {
  ml: 1,
  color: themeColors.titleText,
  backgroundColor: themeColors.success,
};

const closeIconStyle = {
  position: "absolute",
  right: 4,
  top: 4,
  color: themeColors.error,
};

const infoBoxStyle = {
  backgroundColor: themeColors.lighterBg,
  overflowY: "auto",
  maxHeight: "calc(100% - 64px)",
  marginLeft: "20px",
  marginRight: "20px",
  paddingInline: "20px",
  borderRadius: "16px",
};

export default function OwnableInfoDrawer(props: OwnableInfoDrawerProps) {
  const { chain, metadata } = props;
  const [verified, setVerified] = useState(false);
  const [anchors, setAnchors] = useState<
    Array<{ tx: string | undefined; verified: boolean } | null>
  >([]);

  const verify = (chain: EventChain, open: boolean) => {
    if (!open) return;

    EventChainService.verify(chain).then(({ verified, anchors, map }) => {
      setVerified(verified);
      setAnchors(
        chain.anchorMap.map(({ key, value }) => ({
          tx: anchors[key.hex],
          verified: map[key.hex] === value.hex,
        }))
      );
    });
  };

  useEffect(() => verify(chain, props.open), [chain, props.open]);
  useInterval(() => verify(chain, props.open), 5 * 1000);

  return (
    <LtoDrawer open={props.open} onClose={props.onClose} height="90%">
      <Box p={2}>
        <Tooltip title={chain.id}>
          <Chip
            label={shortId(chain.id)}
            icon={<Fingerprint style={fingerprintIconStyle} />}
            sx={fingerprintIconBgStyle}
            size="small"
            variant="outlined"
          />
        </Tooltip>
        <If condition={verified}>
          <Chip
            label="Anchors verified"
            icon={<CheckmarkIcon />}
            size="small"
            sx={verifiedIconBgStyle}
          />
        </If>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          sx={closeIconStyle}
        >
          <CloseDrawerIcon />
        </IconButton>
      </Box>

      <Box px={2}>
        <Typography sx={themeStyles.fs24fw600lh29}>{metadata?.name}</Typography>
        <Box height="8px" />
        <Typography sx={themeStyles.fs16fw400lh21}>
          {metadata?.description}
        </Typography>
      </Box>
      <Box height="24px" />

      <Box sx={infoBoxStyle}>
        <List>
          <If condition={chain.events.length === 0}>
            <ListItem>
              <ListItemText
                primary="This is a static ownable. It does not contain any events."
                primaryTypographyProps={{
                  ...themeStyles.fs16fw400lh21,
                  color: themeColors.titleText,
                }}
              />
            </ListItem>
          </If>
          {chain.events.map((event, i) => (
            <InfoEventCard
              key={event.hash.hex}
              event={event}
              anchorTx={anchors[i]?.tx}
              verified={!!anchors[i]?.verified}
              isFirst={i === 0}
            />
          ))}
        </List>
      </Box>
      <Box height={"40px"} />
    </LtoDrawer>
  );
}
