import { Event } from "@ltonetwork/lto";
import { Box, Link } from "@mui/material";
import { useState } from "react";
import ReactJson from "react-json-view";
import { Cancel, CheckCircle } from "@mui/icons-material";
import If from "../../If";
import LTOService from "../../../services/LTO.service";
import { themeColors } from "../../../theme/themeColors";
import { themeStyles } from "../../../theme/themeStyles";
import { TitleBodyText } from "./TitleBodyText";
import { SmallSwitch } from "./SmallSwitch";
import { sendRNPostMessage } from "../../../utils/postMessage";

interface InfoEventCardProps {
  event: Event;
  anchorTx: string | undefined;
  verified: boolean;
  isFirst: boolean;
}

enum DataView {
  BASE64,
  JSON,
}

const boxStyle = {
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  maxHeight: "3000px",
};

const iconStyle = {
  verticalAlign: -5,
  ml: 1,
};

const base64DataStyle = {
  ...themeStyles.fs12fw400lh14,
  marginBottom: 0,
  color: themeColors.titleText,
};

export default function InfoEventCard(props: InfoEventCardProps) {
  const [dataView, setDataView] = useState<DataView>(
    props.event.mediaType === "application/json"
      ? DataView.JSON
      : DataView.BASE64
  );
  const { event, anchorTx, verified } = props;

  const jsonToBase64Switch = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setDataView(checked ? DataView.JSON : DataView.BASE64);
  };

  return (
    <Box sx={boxStyle}>
      <If condition={!props.isFirst}>
        <TitleBodyText
          titleText="Previous:"
          bodyText={event.previous?.base58}
        />
      </If>
      <TitleBodyText
        titleText="Timestamp:"
        bodyText={event.timestamp ? new Date(event.timestamp).toString() : ""}
      />
      <TitleBodyText
        titleText="Signed by:"
        bodyText={
          event.signKey ? LTOService.accountOf(event.signKey.publicKey) : ""
        }
      />
      <TitleBodyText
        titleText="Public key:"
        bodyText={event.signKey?.publicKey.base58 ?? "N/A"}
      />
      <TitleBodyText
        titleText="Signature:"
        bodyText={event.signature?.base58 ?? "N/A"}
      />
      <If condition={anchorTx !== null}>
        <TitleBodyText
          titleText="Anchor tx:"
          bodyText={
            <>
              <Link
                onClick={() =>
                  sendRNPostMessage(JSON.stringify({
                    type:"openExplorer",
                    data: `${process.env.REACT_APP_LTO_EXPLORER_URL}/transaction/${anchorTx}`
                  }))
                }
              >
                {anchorTx}
              </Link>
              <If condition={verified}>
                <CheckCircle
                  fontSize="small"
                  sx={{ ...iconStyle, color: themeColors.success }}
                />
              </If>
              <If condition={!verified}>
                <Cancel
                  fontSize="small"
                  sx={{ ...iconStyle, color: themeColors.error }}
                />
              </If>
            </>
          }
        />
      </If>
      <Box height="10px" />
      <TitleBodyText titleText="Media type:" bodyText={event.mediaType} />
      <TitleBodyText
        titleText="Data:"
        bodyText={
          <>
            <span style={{ marginRight: 5 }}>base64</span>{" "}
            <SmallSwitch
              disabled={event.mediaType !== "application/json"}
              checked={dataView === DataView.JSON}
              onChange={jsonToBase64Switch}
              sx={{ display: "inline-flex" }}
            />
            <span style={{ marginLeft: 5 }}>JSON</span>
            <If condition={dataView === DataView.BASE64}>
              <pre className="base64" style={base64DataStyle}>
                {event.data.base64}
              </pre>
            </If>
            <If condition={dataView === DataView.JSON}>
              <ReactJson
                style={{ marginTop: 10 }}
                src={event.parsedData}
                enableClipboard={false}
                theme="ashes"
              />
            </If>
          </>
        }
      />
      <TitleBodyText titleText="Hash:" bodyText={event.hash.base58} />
    </Box>
  );
}
