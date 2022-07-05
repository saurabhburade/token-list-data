import { ChainId } from "../constants/chainId";
import { Interface } from "@ethersproject/abi";
import Web3 from "web3";
import multiAbi from "../config/abis/multicall.json";
import contracts from "../constants/contracts";
import RPC from "../constants/rpc";

export const multicall = async <T = any>(
  abi: any[],
  calls: Call[]
): Promise<T> => {
  const web3Client = new Web3("https://bscrpc.com/");

  const multi = new web3Client.eth.Contract(multiAbi, contracts.multicall[56]);
  const itf = new Interface(abi);

  const calldata = calls.map((call) => {
    return {
      target: call.address.toLowerCase(),
      callData: itf.encodeFunctionData(call.name, call.params),
    };
  });
  const { returnData } = await multi.methods.aggregate(calldata).call();

  const res = returnData.map((call, i) => {
    return itf.decodeFunctionResult(calls[i].name, call);
  });

  return res;
};

export const genericMulticall = async <T = any>(
  abi: any[],
  calls: Call[],
  chainId: ChainId
): Promise<T> => {
  const web3Client = new Web3(RPC[chainId]);

  const multi = new web3Client.eth.Contract(
    multiAbi,
    contracts.multicall[chainId]
  );
  const itf = new Interface(abi);

  const calldata = calls.map((call) => {
    return {
      target: call.address.toLowerCase(),
      callData: itf.encodeFunctionData(call.name, call.params),
    };
  });
  const { returnData } = await multi.methods.aggregate(calldata).call();

  const res = returnData.map((call, i) => {
    return itf.decodeFunctionResult(calls[i].name, call);
  });

  return res;
};
