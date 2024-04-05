import { Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";
import { CastParamType, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { mintNFT } from "../lib/mint.js"

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_FROG_FM";
const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY);

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // hub: neynarHub({ apiKey: NEYNAR_API_KEY }),
  // browserLocation: ADD_URL,
})

// Cast action handler
app.hono.post("/mint", async (c) => {
  const {
    trustedData: { messageBytes },
  } = await c.req.json();

  const result = await neynarClient.validateFrameAction(messageBytes);
  const { interactor } = result.action;
  if (result.valid) {
    const { cast } = await neynarClient.lookUpCastByHashOrWarpcastUrl(
      result.action.cast.hash,
      CastParamType.Hash
    );
    const { hash, author: { display_name } } = cast;

    let message = "Empty cast, try it on a cast with text."
    if (hash) {
      const image = `https://client.warpcast.com/v2/cast-image?castHash=${hash}`

      mintNFT(interactor.verified_addresses.eth_addresses[0], image, display_name, interactor.display_name);

      message = `Cast minted on Base`;
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
