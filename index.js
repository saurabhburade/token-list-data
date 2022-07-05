require("dotenv").config();
const axios = require("axios");
const BSC_MAINNET_TOKEN_LIST = require("./data/bsc_tokens.json");
const _ = require("lodash");
const fs = require("fs");

function sleep(delay) {
  console.log("____SLEEEP___" + delay + "__ms__");
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
  console.log("____SLEEEP___END");
}
const fetchbsctokens = async () => {
  const tokensChunksArray = _.chunk(BSC_MAINNET_TOKEN_LIST.tokens, 1000);
  let processedTokens = [];
  for (let index = 0; index < tokensChunksArray[0].length; index++) {
    const token = tokensChunksArray[0][index];
    try {
      console.time("PRICEFETCH" + index);
      const dexscreener = await axios
        .get(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`)
        .then((res) => res)
        .catch((err) => null);
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
      const paraswap = await axios
        .get(
          `https://apiv5.paraswap.io/prices/?srcToken=${
            token.address
          }&destToken=0x55d398326f99059fF775485246999027B3197955&amount=${10 **
            token.decimals}&srcDecimals=${
            token.decimals
          }&destDecimals=18&side=SELL&network=56`
        )
        .then((res) => res)
        .catch((err) => null);
      console.log(index + "_____FETCHING___DATA__FOR___:" + token.name);
      if (dexscreener.data && dexscreener.data.pairs.length) {
        const tokenData = {
          ...token,
          priceUsd: dexscreener.data.pairs[0].priceUsd,

          dexscreener: {
            priceUsd: dexscreener.data.pairs[0].priceUsd,
            source: "dexscreener",
            liquidity: dexscreener.data.pairs[0].liquidity.usd,
          },
          dexguru:dexguru ? dexguru.data : null,
          paraswap: paraswap ? paraswap.data : null,
        };
        // console.log(tokenData);
        processedTokens.push(tokenData);
        console.timeEnd("PRICEFETCH" + index);
      } else {
        processedTokens.push({
          ...token,
          dexguru: {
            ...dexguru.data,
          },
          paraswap: paraswap ? paraswap.data : null,
        });
        console.timeEnd("PRICEFETCH" + index);
      }
      sleep(900);
    } catch (error) {
      console.log({ error });
    }
  }
  fs.writeFile("./bsc-tokens.json", JSON.stringify(processedTokens), (err) => {
    console.log({ err });
  });
};

fetchbsctokens();
