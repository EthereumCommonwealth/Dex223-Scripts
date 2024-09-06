import { ethers } from "hardhat";
import { BaseContract, Contract } from "ethers";

import { deployPool, encodePriceSqrt } from "./createPool";  // calculateSqrtPriceX96
import { addLiquidity } from "./addLiquidity";
import { makeRouteMultiSwap223, makeRouteSwap223, makeRouteSwap20 } from "./makeSwap223";
import { ERC20Token, IERC223, TokenStandardConverter } from "../typechain-types";

import USDT from "../deployments/localhost/dex223/tokens/Tether/result.json";
import USDC from "../deployments/localhost/dex223/tokens/USDC/result.json";
import DAI from "../deployments/localhost/dex223/tokens/DAI/result.json";
import TEST_HYBRID_ERC223_C from "../deployments/localhost/dex223/tokens/testTestHybridC/result.json";
import TEST_HYBRID_ERC223_D from "../deployments/localhost/dex223/tokens/testTestHybridD/result.json";
import WETH9 from "../deployments/localhost/dex223/WETH9/result.json";
import CONVERTER from "../deployments/localhost/dex223/TokenConvertor/result.json";

const provider = ethers.provider;

async function main() {
  const convertContract = new Contract(
      CONVERTER.contractAddress,
      CONVERTER.abi,
      provider) as BaseContract as TokenStandardConverter;

  let usdt = new Contract(
    USDT.contractAddress,
    USDT.abi,
    provider
  ) as BaseContract as ERC20Token;

  let usdc = new Contract(
    USDC.contractAddress,
    USDC.abi,
    provider
  ) as BaseContract  as ERC20Token;

  let testERC223_C = new Contract(
    TEST_HYBRID_ERC223_C.contractAddress,
    TEST_HYBRID_ERC223_C.abi,
    provider
  ) as BaseContract as IERC223;

  let testERC223_D = new Contract(
    TEST_HYBRID_ERC223_D.contractAddress,
    TEST_HYBRID_ERC223_D.abi,
    provider
  ) as BaseContract;

  let weth = new Contract(
    WETH9.contractAddress,
    WETH9.abi,
    provider
  ) as BaseContract as ERC20Token;

  let dai = new Contract(
      DAI.contractAddress,
      DAI.abi,
      provider
  ) as BaseContract as ERC20Token;

  /** weth-usdt pool 500 / 3000 */
  let wethPair1 = weth;
  let wethPair2 = dai;
  let val2 = 3500n;
  let dec1 = await wethPair1.decimals();
  let dec2 = await wethPair2.decimals();
  let decDelta = dec1 - dec2;
  let val1 = 10n ** decDelta;
  if (wethPair1.target > wethPair2.target) {
    console.log("Warning: Swapping weth and usdc");
    const temp = wethPair2;
    wethPair2 = wethPair1;
    wethPair1 = temp;
    const valt = val1;
    val2 = val1;
    val1 = valt;
    // wethRatio = 1/3500;
  }


  // let priceRatio = wethRatio * BigInt(10 ** (decimalsB - decimalsA)));
  let sqrtPrice = encodePriceSqrt(val2, val1);
  // let sqrtPrice = calculateSqrtPriceX96(Number(dec1) ,Number(dec2), wethRatio);
  // console.log(`sqrtPrice: ${sqrtPrice}`);

  // add ERC223 addresses
  const [_owner, signer2] = await ethers.getSigners();
  // try {
  //   await convertContract.connect(signer2).createERC223Wrapper(wethPair1.target);
  //   await convertContract.connect(signer2).createERC223Wrapper(wethPair2.target);
  // } catch (e) {
  //   //
  // }
  const wethPair2ERC223 = await convertContract.predictWrapperAddress(wethPair2.target, true);
  const wethPair1ERC223 = await convertContract.predictWrapperAddress(wethPair1.target, true);
  console.log("wethPair1ERC223:", wethPair1ERC223);
  console.log("wethPair2ERC223:", wethPair2ERC223);

  // const wethUsdc3000 = await deployPool(
  //     String(wethPair1.target),
  //     String(wethPair2.target),
  //     wethPair1ERC223,
  //     wethPair2ERC223,
  //     3000,
  //     sqrtPrice
  // );

  // const wethUsdc3000 = await deployPool(
  //     String(wethPair1.target),
  //     String(wethPair2.target),
  //     3000,
  //     sqrtPrice
  // );

  /** usdt-usdc pool 3000 */
  val2 = 1n;
  dec1 = await usdt.decimals();
  dec2 = await usdc.decimals();
  decDelta = dec1 - dec2;
  val1 = 10n ** decDelta;
  if (usdt.target > usdc.target) {
    console.log("Warning: Swapping usdc and usdt");
    const temp = usdc;
    usdc = usdt;
    usdt = temp;
    const valt = val1;
    val2 = val1;
    val1 = valt;
  }
  sqrtPrice = encodePriceSqrt(val2, val1);
  // sqrtPrice = calculateSqrtPriceX96(Number(dec1) ,Number(dec2), 1);
  // console.log(`sqrtPrice: ${sqrtPrice}`);

  const uPair2ERC223 = await convertContract.predictWrapperAddress(usdc.target, true);
  const uPair1ERC223 = await convertContract.predictWrapperAddress(usdt.target, true);

  const usdtUsdc3000 = await deployPool(
      String(usdt.target),
      String(usdc.target),
      String(uPair1ERC223),
      String(uPair2ERC223),
      3000,
      sqrtPrice
  );

  /** usdc-dai pool 3000 */

  // NOTE we need to take second token from prev pool to create new pool with DAI
  let usdc2 = new Contract(
      usdc.target,
      USDC.abi,
      provider
  ) as BaseContract  as ERC20Token;

  val2 = 1n;
  dec1 = await dai.decimals();
  dec2 = await usdc2.decimals();
  decDelta = dec1 - dec2;
  val1 = 10n ** decDelta;
  if (dai.target > usdc2.target) {
    console.log("Warning: Swapping usdc and dai");
    const temp = usdc2;
    usdc2 = dai;
    dai = temp;
    const valt = val1;
    val2 = val1;
    val1 = valt;
  }
  sqrtPrice = encodePriceSqrt(val2, val1);

  const u2Pair2ERC223 = await convertContract.predictWrapperAddress(usdc2.target, true);
  const u2Pair1ERC223 = await convertContract.predictWrapperAddress(dai.target, true);

  const daiUsdc3000 = await deployPool(
      String(dai.target),
      String(usdc2.target),
      String(u2Pair1ERC223),
      String(u2Pair2ERC223),
      3000,
      sqrtPrice
  );


  // let usdcERC223 = await convertContract.predictWrapperAddress(dai.target, true);
  // let testD_ERC20 = await convertContract.predictWrapperAddress(testERC223_D.target, false);
  // console.log(`usdcERC223: ${usdcERC223}`);
  // console.log(`testD_ERC20: ${testD_ERC20}`);
  // console.log(`testERC223_D: ${testERC223_D.target}`);
  //
  // /** USDT-ERC223_D pool */
  // let pool20_23_erc20_0 : ERC20Token;
  // let pool20_23_erc20_1 : ERC20Token;
  // let pool20_23_erc223_0 : IERC223;
  // let pool20_23_erc223_1 : IERC223;
  // let swapped = false;
  // if (String(dai.target) > testD_ERC20) {
  //   console.log("Warning: Swapping usdt and testERC223_D");
  //   pool20_23_erc20_0 = {target: testD_ERC20} as ERC20Token;
  //   pool20_23_erc20_1 = dai as ERC20Token;
  //   pool20_23_erc223_0 = testERC223_D as IERC223;
  //   pool20_23_erc223_1 = {target: usdcERC223} as IERC223;
  //   dec1 = await (testERC223_D as IERC223).decimals();
  //   dec2 = await (dai as ERC20Token).decimals();
  //   swapped = true;
  // } else {
  //   pool20_23_erc20_0 = dai as ERC20Token;
  //   pool20_23_erc20_1 = {target: testD_ERC20} as ERC20Token;
  //   pool20_23_erc223_0 = {target: usdcERC223} as IERC223;
  //   pool20_23_erc223_1 = testERC223_D as IERC223;
  //   dec1 = await (dai as ERC20Token).decimals();
  //   dec2 = await (testERC223_D as IERC223).decimals();
  // }

  // sqrtPrice = calculateSqrtPriceX96(Number(dec1) ,Number(dec2), 1);
  // console.log(`sqrtPrice: ${sqrtPrice}`);
  //
  // const erc223_erc20 = await deployPool(
  //     String(pool20_23_erc20_0.target),
  //     String(pool20_23_erc20_1.target),
  //     String(pool20_23_erc223_0.target),
  //     String(pool20_23_erc223_1.target),
  //     500,  // 500
  //     sqrtPrice
  // );
  // console.log(`Pool: ERC223 and ERC20 = ${erc223_erc20}`);
  // console.log(`Pool: USDT and USDC = ${usdtUsdc500}`);

  // console.log(`Pool: WETH and USDT = ${wethUsdc3000}`);
  console.log(`Pool: USDC and USDT = ${usdtUsdc3000}`);
  console.log(`Pool: USDC and DAI = ${daiUsdc3000}`);

  // await addLiquidity(wethUsdc500, wethPair1, wethPair2, "ERC20", 2);
  // await addLiquidity(wethUsdc3000, wethPair1, wethPair2, "ERC20", 0.001, "ERC20");
  await addLiquidity(usdtUsdc3000, usdt, usdc, "ERC20", 1000, "ERC20");
  await addLiquidity(usdtUsdc3000, dai, usdc2, "ERC20", 1000, "ERC20");
  // await addLiquidity(usdtUsdc500, usdt, usdc, "ERC20",0.002);
  // await addLiquidity(erc223_c_erc20_d, testERC223_C, testERC223_D, "ERC223", 30000);
  // if (swapped) {
  //   await addLiquidity(erc223_erc20, pool20_23_erc223_0, pool20_23_erc20_1, "ERC223", 0.1, "ERC20");
  // } else {
  //   await addLiquidity(erc223_erc20, pool20_23_erc20_0, pool20_23_erc223_1, "ERC20", 0.1, "ERC223");
  // }

  // await makeQuote(wethPair1, wethPair2, 3000, 10000000000);
  await usdt.connect(signer2).approve(convertContract.target.toString(), ethers.MaxUint256 / 4n);
  await convertContract.connect(signer2).wrapERC20toERC223(usdt.target, ethers.MaxUint256 / 4n);
  await usdc.connect(signer2).approve(convertContract.target.toString(), ethers.MaxUint256 / 4n);
  await convertContract.connect(signer2).wrapERC20toERC223(usdc.target, 1);

  await makeRouteSwap223(usdt, usdc, 3000, 10000000000, false);
  await makeRouteSwap223(usdt, usdc, 3000, 10000000000, true);
  await makeRouteSwap20(usdt, usdc, 3000, 10000000000, false);
  await makeRouteSwap20(usdt, usdc, 3000, 10000000000, true);

  const lastToken = usdc2.target === usdc.target ? dai : usdc2;
  await lastToken.connect(signer2).approve(convertContract.target.toString(), ethers.MaxUint256 / 4n);
  await convertContract.connect(signer2).wrapERC20toERC223(lastToken.target, 1);

  await makeRouteMultiSwap223(usdt, usdc, lastToken,3000, 3000, 10000000000, false);
  await makeRouteMultiSwap223(usdt, usdc, lastToken,3000, 3000, 10000000000, true);

  // await makeQuote({target: wethPair1ERC223} as IERC223, wethPair2, 3000, 10000000000);
  // await makeQuote({target: wethPair1ERC223} as IERC223, {target: wethPair2ERC223} as IERC223, 3000, 10000000000);
  // await makeQuote({target: wethPair2ERC223} as IERC223, wethPair1, 3000, 10);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
