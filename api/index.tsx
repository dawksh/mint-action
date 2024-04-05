import { Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { neynar as neynarHub } from "frog/hubs";
import { neynar } from "frog/middlewares";
import { handle } from "frog/vercel";
import { CastParamType, NeynarAPIClient } from "@neynar/nodejs-sdk";


const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";
const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY);

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?name=Upthumb&icon=thumbsup&actionType=post&postUrl=";

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // hub: neynarHub({ apiKey: NEYNAR_API_KEY }),
  // browserLocation: ADD_URL,
})

// Cast action handler
app.hono.post("/upthumb", async (c) => {
  const {
    trustedData: { messageBytes },
  } = await c.req.json();

  const result = await neynarClient.validateFrameAction(messageBytes);
  if (result.valid) {
    const { cast } = await neynarClient.lookUpCastByHashOrWarpcastUrl(
      result.action.cast.hash,
      CastParamType.Hash
    );
    const { hash } = cast;

    let message = "Empty cast, try it on a cast with text."
    if (hash) {
      const image = `https://client.warpcast.com/v2/cast-image?castHash=${hash}`
      message = `You minted this cast as NFT on Base`;
    }
    return c.json({ message });
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
