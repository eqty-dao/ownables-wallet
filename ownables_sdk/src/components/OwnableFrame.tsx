import allInline from "all-inline";
import PackageService from "../services/Package.service";
import { Component, RefObject } from "react";

// This was left here for reference
// const baseUrl = window.location.href.replace(/\/*$/, "");
// const trustedUrls = [`${baseUrl}/ownable.js`];

const initialUrl = window.location.href.split("?")[0];
const baseUrl = initialUrl.replace(/\/*$/, "");
const trustedUrls = [`${baseUrl}/ownable.js`];

async function generateWidgetHTML(
  id: string,
  packageCid: string
): Promise<string> {
  const html = await PackageService.getAssetAsText(packageCid, "index.html");
  const doc = new DOMParser().parseFromString(html, "text/html");

  await allInline(
    doc,
    async (filename: string, encoding: "data-uri" | "text") => {
      filename = filename.replace(/^.\//, "");

      return encoding === "data-uri"
        ? PackageService.getAssetAsDataUri(packageCid, filename)
        : PackageService.getAssetAsText(packageCid, filename);
    }
  );

  // Inject custom CSS for #audioPlayer
  const customStyle = doc.createElement("style");
  customStyle.textContent = `
    #audioPlayer {
      background: transparent;
      border-radius: 18px;
        padding: 28px 36px 24px 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #fff;
      font-family: 'Inter', sans-serif;
      min-width: 320px;
      max-width: 420px;
    }
    #audioPlayer .controls {
      display: flex;
      align-items: center;
      gap: 18px;
      width: 100%;
      margin-top: 8px;
    }
    #audioPlayer button {
      border: 2.5px solid #23262F;
      box-shadow: 0 2px 8px rgba(79,140,255,0.10);
      border-radius: 50%;
      width: 56px;
      height: 56px;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #audioPlayer button:hover {
      box-shadow: 0 4px 16px rgba(110,231,183,0.15);
    }
    #audioPlayer input[type="range"] {
      width: 180px;
      background: #23262F;
      border-radius: 8px;
      height: 6px;
      margin: 0 8px;
      outline: none;
      box-shadow: 0 1px 4px rgba(79,140,255,0.08);
    }
    #audioPlayer input[type="range"]::-webkit-slider-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4f8cff;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(79,140,255,0.15);
      cursor: pointer;
      transition: background 0.2s;
    }
    #audioPlayer input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4f8cff;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(79,140,255,0.15);
      cursor: pointer;
      transition: background 0.2s;
    }
    #audioPlayer .time {
      min-width: 54px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      color: #B0B6BE;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.12);
    }
  `;
  if (doc.head) {
    doc.head.appendChild(customStyle);
  } else if (doc.body) {
    // fallback if no <head>
    doc.body.insertBefore(customStyle, doc.body.firstChild);
  }

  return doc.documentElement.outerHTML;
}

async function generate(
  id: string,
  packageCid: string,
  isDynamic: boolean
): Promise<string> {
  const doc = new DOMParser().parseFromString(
    "<html><head></head><body></body></html>",
    "text/html"
  );
  const head = doc.head;
  const body = doc.body;

  const meta = doc.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = `default-src ${trustedUrls.join(
    " "
  )} data: blob: 'unsafe-inline' 'unsafe-eval'`;
  head.appendChild(meta);

  const style = doc.createElement("style");
  style.textContent = `
    html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; }
    iframe { height: 100%; width: 100%; border: none; }
  `;
  head.appendChild(style);

  const widget = doc.createElement("iframe");
  widget.setAttribute("sandbox", "allow-scripts");
  widget.srcdoc = await generateWidgetHTML(id, packageCid);
  body.appendChild(widget);

  if (isDynamic) {
    const script = doc.createElement("script");
    script.src = "./ownable.js";
    body.appendChild(script);
  }


  return doc.documentElement.outerHTML;
}

export interface OwnableFrameProps {
  id: string;
  packageCid: string;
  isDynamic: boolean;
  iframeRef: RefObject<HTMLIFrameElement>;
  onLoad: () => void;
}

export default class OwnableFrame extends Component<OwnableFrameProps> {
  async componentDidMount(): Promise<void> {
    this.props.iframeRef.current!.srcdoc = await generate(
      this.props.id,
      this.props.packageCid,
      this.props.isDynamic
    );
  }

  shouldComponentUpdate(): boolean {
    return false; // Never update this component. We rely on the iframe not to be replaced.
  }

  render() {
    return (
      <iframe
        id={this.props.id}
        title={`Ownable ${this.props.id}`}
        ref={this.props.iframeRef}
        onLoad={() => this.props.onLoad()}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "hidden"
        }}
      />
    );
  }
}
