import path from "path";

import { ethers } from "hardhat";
import {BaseContract, Contract, ContractFactory} from "ethers";

import { DeployHelper } from "./helpers/DeployHelper";
import { ERC20Token, IWETH9, TokenStandardConverter } from "../typechain-types";

const contractPath = path.join(__dirname, "../dex223/artifacts");

const artifacts = {
  tether: require("../artifacts/contracts/TestTokens/Tether.sol/Tether.json"),
  berc20: require("../artifacts/contracts/TestTokens/BaseERC20.sol/BaseErc20.json"),
  usdc: require("../artifacts/contracts/TestTokens/Usdcoin.sol/UsdCoin.json"),
  wbtc: require("../artifacts/contracts/TestTokens/WrappedBitcoin.sol/WrappedBitcoin.json"),
  dai: require("../artifacts/contracts/TestTokens/DAI.sol/Dai.json"),
  Test20A: require("../artifacts/contracts/TestTokens/TestERC20A.sol/ERC20Token.json"),
  Test20B: require("../artifacts/contracts/TestTokens/TestERC20B.sol/ERC20Token.json"),
  TestHybridC: require("../artifacts/contracts/TestTokens/TestHybridC.sol/ERC223Token.json"),
  TestHybridD: require("../artifacts/contracts/TestTokens/TestHybridD.sol/ERC223Token.json"),
};

export async function setupTokens() {
  const deployHelper = await DeployHelper.initialize(null, true);
  const [owner, signer2] = await ethers.getSigners();

  await deployHelper.deployState({
    contractName: "Tether",
    contractFactory: new ContractFactory(
      artifacts.tether.abi,
      artifacts.tether.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "USDC",
    contractFactory: new ContractFactory(
      artifacts.usdc.abi,
      artifacts.usdc.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "DAI",
    contractFactory: new ContractFactory(
      artifacts.dai.abi,
      artifacts.dai.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "BER1",
    contractFactory: new ContractFactory(
      artifacts.berc20.abi,
      artifacts.berc20.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "BER2",
    contractFactory: new ContractFactory(
      artifacts.berc20.abi,
      artifacts.berc20.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "testTestHybridC",
    contractFactory: new ContractFactory(
      artifacts.TestHybridC.abi,
      artifacts.TestHybridC.bytecode,
      owner
    ),
  });

  await deployHelper.deployState({
    contractName: "testTestHybridD",
    contractFactory: new ContractFactory(
      artifacts.TestHybridD.abi,
      artifacts.TestHybridD.bytecode,
      owner
    ),
  });

  const erc20a = await deployHelper.deployState({
    contractName: "testErc20A",
    contractFactory: new ContractFactory(
        artifacts.Test20A.abi,
        artifacts.Test20A.bytecode,
        owner
    ),
  });

  const erc20b = await deployHelper.deployState({
    contractName: "testErc20B",
    contractFactory: new ContractFactory(
        artifacts.Test20B.abi,
        artifacts.Test20B.bytecode,
        owner
    ),
  });

  for (const i in deployHelper.cacheContract) {
    const contract = deployHelper.cacheContract[i];
    await (contract as BaseContract as ERC20Token)
      .connect(owner)
      .mint(signer2.address, ethers.MaxUint256 / 2n);
  }

  const WETH9 = require( "../deployments/localhost/dex223/WETH9/result.json");

  const provider = ethers.provider;
  let weth = new Contract(
      WETH9.contractAddress,
      WETH9.abi,
      provider
  ) as BaseContract as IWETH9;

  let balance = 0n;
  try {
    balance = await weth.connect(signer2).balanceOf(signer2.address);
  } catch (e) {}
  
  if (!balance) {
    await weth.connect(signer2).deposit({value: ethers.parseEther("3000")});
    console.log(`Converted 3000 WETH`);
  } else {
    console.log(`Already have ${balance} WETH`);
  }

  // convert ERC20 - ERC223
  const tokenConvertor = require( "../deployments/localhost/dex223/TokenConvertor/result.json");

  let tokenConv = new Contract(
      tokenConvertor.contractAddress,
      tokenConvertor.abi,
      provider
  ) as BaseContract as TokenStandardConverter;

  let tx = await erc20a.connect(signer2).approve(tokenConvertor.contractAddress, ethers.parseEther("0.00000005"));
  await tx.wait();
  tx = await erc20b.connect(signer2).approve(tokenConvertor.contractAddress, ethers.parseEther("0.00000005"));
  await tx.wait();

  await tokenConv.connect(signer2).wrapERC20toERC223(erc20a.target, ethers.parseEther("0.00000005"));
  await tokenConv.connect(signer2).wrapERC20toERC223(erc20b.target, ethers.parseEther("0.00000005"));

  const wrapper223a = await tokenConv.connect(signer2).getERC223WrapperFor(erc20a.target);
  console.log(`ERC223 Wrapper (A): ${wrapper223a}`);
  const wrapper223b = await tokenConv.connect(signer2).getERC223WrapperFor(erc20b.target);
  console.log(`ERC223 Wrapper (B): ${wrapper223b}`);

  await deployHelper.deploysSave("dex223/tokens", contractPath);
}
