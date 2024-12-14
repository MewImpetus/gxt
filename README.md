# gxt

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use
将该项目clone到本地，进入项目根目录
### Install Dependencies
`npm install`

### Build

`npm run build`

### Test

`npm run test`

### Deploy or run another script

`npm run start` 

### Add a new contract

`npx blueprint create ContractName`


### 具体相关操作
参考scripts中的代码

1. 部署GTX Token
```js
const admin = Address.parse("0QAVWJbfEIGvKOht-utclCtzpnitbaWm70HwRa24NoTpUCTI")  // 管理员的钱包地址
const gXT = provider.open(await JettonMasterGXT.fromInit(admin,
            {
                $$type: "Tep64TokenData",
                flag: BigInt(1),
                content: "https://raw.githubusercontent.com/MewImpetus/gxt/refs/heads/main/gxt.json",  // Token基本信息
            },
            toNano("210000000000")));  // Token 发行上限

await gXT.send(
    provider.sender(),
    {
        value: toNano('0.05'),
    },
    {
        $$type: 'Deploy',
        queryId: 0n,
    }
);
```

2. 挖出所有到指定钱包，并设置不再可挖矿
```js
await gXT.send(
    provider.sender(),
    {
        value: toNano('0.03'),
    },
    {
        $$type: 'MintAll',
        targetAddress: admin  // 接收钱包地址
    }
)
```

3. 部署锁仓合约
```js
// admin 是管理员地址
// JettonMasterAddress 是上述部署的 GTX token 合约的地址，锁仓开始时间从部署合约的时候开始计算
 const escrowGXT = provider.open(await EscrowGXT.fromInit(admin, JettonMasterAddress));

await escrowGXT.send(
    provider.sender(),
    {
        value: toNano('0.05'),
    },
    {
        $$type: 'Deploy',
        queryId: 0n,
    }
);
```

4. 可以将GTX打入到步骤3中部署的锁仓合约中，直接钱包操作即可

5. 添加释放分配, 可自定义配置或删除，以下是添加示例：
```js
//1. Private Investors
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.02"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Private Investors",
            allocation: toNano("21000000000"),
            cliff_duration: BigInt(3600*24*30*6),
            vesting_duration: BigInt(3600*24*30*18),
            admin: admin,   
        }
    );


    //2. Community
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Community",
            allocation: toNano("2100000000"),
            cliff_duration: BigInt(3600*24*30*2),
            vesting_duration: BigInt(3600*24*30*10),
            admin: admin,   
        }
    );


    //3. Foundation Treasury
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Foundation Treasury",
            allocation: toNano("8400000000"),
            cliff_duration: BigInt(3600*24*30*0),
            vesting_duration: BigInt(3600*24*30*36),
            admin: admin,   
        }
    );


    //4. Team & Advisors
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Team & Advisors",
            allocation: toNano("2100000000"),
            cliff_duration: BigInt(3600*24*30*12),
            vesting_duration: BigInt(3600*24*30*12),
            admin: admin,   
        }
    );

    //5. Operations Marketing
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Operations Marketing",
            allocation: toNano("2100000000"),
            cliff_duration: BigInt(3600*24*30*0),
            vesting_duration: BigInt(3600*24*30*36),
            admin: admin,   
        }
    );

    //6. Launch Partners
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Launch Partners",
            allocation: toNano("21000000000"),
            cliff_duration: BigInt(3600*24*30*6),
            vesting_duration: BigInt(3600*24*30*18),
            admin: admin,   
        }
    );


    //7. Airdrop
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Airdrop",
            allocation: toNano("420000000"),
            cliff_duration: BigInt(3600*24*30*0),
            vesting_duration: BigInt(3600*24*30*24),
            admin: admin,   
        }
    );


    //8. Airdrop
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "Ecosystem Liquidity",
            allocation: toNano("31500000000"),
            cliff_duration: BigInt(3600*24*30*0),
            vesting_duration: BigInt(3600*24*30*48),
            admin: admin,   
        }
    );

    9. others
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.005"),
            bounce: false,
        },
        {
            $$type: "AddDistribution",
            name: "others",
            allocation: toNano("94500000000"),
            cliff_duration: BigInt(3600*24*30*30),
            vesting_duration: BigInt(1),
            admin: admin,   
        }
    );
```

6. 提币，通过选择相应的分配额,将指定数量的GTX提到指定钱包
```js
    // 比如我们提取 Foundation Treasury  的 10个GTX 到 user 的地址
    await escrowGXT.send(
        provider.sender(),
        {
            value: toNano("0.05"),
            bounce: false,
        },
        {
            $$type: "ExtractingToken",
            queryId: 0n,
            name: "Foundation Treasury",
            amount: toNano("10"),
            to: user
        }
    )
```