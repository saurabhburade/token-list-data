require("dotenv").config();
const axios = require("axios");
const _ = require("lodash");
const fs = require("fs");

function sleep(delay) {
  console.log("____SLEEEP___" + delay + "__ms__");
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
  console.log("____SLEEEP___END");
}
const fetchtokens = async () => {
  const TOKEN_LIST = await axios
    .get("https://tokens.coingecko.com/fantom/all.json")
    .then((res) => res.data)
    .catch((err) => []);
  let processedTokens = [];
  console.time("TOTAL_TIME");
  for (let index = 0; index < TOKEN_LIST.tokens.length; index++) {
    const token = TOKEN_LIST.tokens[index];
    try {
      console.time("PRICEFETCH" + index);

      const dexguru = await axios
        .get(
          `https://api.dev.dex.guru/v1/chain/${token.chainId}/tokens/${token.address}/market`,
          {
            headers: {
              "api-key": process.env.DEX_GURU_KEY,
            },
            params: {},
          }
        )
        .then((res) => res)
        .catch((err) => null);

      console.log(index + "_____FETCHING___DATA__FOR___:" + token.name);
      if (dexguru && dexguru.data.liquidity_usd > 10000) {
        const dexscreener = await axios
          .get(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`)
          .then((res) => res)
          .catch((err) => null);
        const paraswap = await axios
          .get(
            `https://apiv5.paraswap.io/prices/?srcToken=${
              token.address
            }&destToken=0x049d68029688eabf473097a2fc38ef61633a3c7a&amount=${10 **
              token.decimals}&srcDecimals=${
              token.decimals
            }&destDecimals=6&side=SELL&network=${token.chainId}`
          )
          .then((res) => res)
          .catch((err) => null);

        const tokenData = {
          ...token,
          dexscreener: dexscreener.data.pairs.length
            ? {
                priceUsd: dexscreener.data.pairs[0].priceUsd,
                source: "dexscreener",
                liquidity: dexscreener.data.pairs[0].liquidity.usd,
              }
            : null,
          dexguru: dexguru ? dexguru.data : null,
          paraswap: paraswap
            ? {
                srcToken: paraswap.data.priceRoute.srcToken,
                network: paraswap.data.priceRoute.network,
                destToken: paraswap.data.priceRoute.destToken,
                destDecimals: paraswap.data.priceRoute.destDecimals,
                srcDecimals: paraswap.data.priceRoute.srcDecimals,
                destAmount: paraswap.data.priceRoute.destAmount,
                srcAmount: paraswap.data.priceRoute.srcAmount,
                srcUSD: paraswap.data.priceRoute.srcUSD,
                maxImpactReached: paraswap.data.priceRoute.maxImpactReached,

                priceUsd: paraswap.data.priceRoute.destUSD,
              }
            : null,
        };
        // console.log(tokenData);
        processedTokens.push(tokenData);
      } else {
        processedTokens.push({
          ...token,
          dexguru: dexguru ? dexguru.data : null,
          issue: "Inconsitent Liquidity",
        });
        console.log("###__NO_LIQUIDITY_DEXGURU__##");
      }

      sleep(500);
      console.timeEnd("PRICEFETCH" + index);
    } catch (error) {
      console.log({ error });
    }
  }
  fs.writeFile(
    "./fantom-tokens.json",
    JSON.stringify(processedTokens),
    (err) => {
      console.log({ err });
    }
  );
  console.timeEnd("TOTAL_TIME");
};

fetchtokens();
