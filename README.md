# DEX223.io additional utility scripts

## 1 Setup CORE

1.1
Initialization
```bash
yarn install
```
1.2
Open new terminal and run local node for local scripts to work
```bash
yarn run hardhat:node
```

1.3
Open new terminal and run one of next commands

Compile contracts:
```bash
yarn run hardhat:compile
```

Local contracts deployment:
```bash
yarn run hardhat:deploy:local
```

Contracts test swaps on local deployment:
```bash
yarn run hardhat:setup:local
```

Test swap with test contracts on local deployment:
```bash
yarn run hardhat:swap:local
```

If some test failing - this could be caused by wrong `pool_hash` constant value. 
Try cleaning cache files, start local node and run command `hardhat:deploy:local`

Generate json files to pass contract verification (for ex. TestBNB explorer):
```bash
yarn run hardhat:verify
```

1.4. 
Generate pools in batch and mint liquidity (`sepolia`):
- under deployments folder copy folder localhost and rename it to sepolia
- edit files in this sepolia folder and set their real contracts address (as they deployed on real net)
- runs script 

```bash
yarn run hardhat:pools:sepolia
```

Command may be called with additional param - setting pools FEE (for example, `3000`)
```bash
yarn run hardhat:pools:sepolia:3000
```

1.5.
Collect gas consumption for major list of operations 
(change `local` to `sepolia` or other supported network to run on that network)
To test on local - local hardhat node should be running and `deploy` script executed
```bash
yarn run hardhat:gastest:local
```
