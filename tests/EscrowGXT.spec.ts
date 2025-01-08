import {
    Blockchain,
    printTransactionFees,
    SandboxContract,
    TreasuryContract
} from '@ton/sandbox';
import { toNano } from '@ton/core';
import { EscrowGXT } from '../wrappers/EscrowGXT';
import { JettonMasterGXT, loadTakeWalletAddress, loadTep64TokenData } from '../build/GXT/tact_JettonMasterGXT';
import { JettonWalletTemplate } from '../build/GXT/tact_JettonWalletTemplate';
import '@ton/test-utils';

describe('EscrowGXT', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let escrowGXT: SandboxContract<EscrowGXT>;

    let jettonMasterContract: SandboxContract<JettonMasterGXT>;
    let escrowJettonWallet: SandboxContract<JettonWalletTemplate>;
    let adminJettonWallet: SandboxContract<JettonWalletTemplate>;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        jettonMasterContract = blockchain.openContract(
            await JettonMasterGXT.fromInit(
                deployer.address,
                {
                    $$type: "Tep64TokenData",
                    flag: BigInt(1),
                    content: "https://github.com/MewImpetus/gxt/blob/main/gxt.json",
                },
                toNano("210000000000")
            )
        );


        escrowGXT = blockchain.openContract(await EscrowGXT.fromInit(deployer.address, jettonMasterContract.address));

        escrowJettonWallet = blockchain.openContract(
            await JettonWalletTemplate.fromInit(
                jettonMasterContract.address,
                escrowGXT.address,
            )
        );

        adminJettonWallet = blockchain.openContract(
            await JettonWalletTemplate.fromInit(
                jettonMasterContract.address,
                deployer.address,
            )
        );
        
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and escrowGXT are ready to use

        const tx = await jettonMasterContract.send(
            deployer.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "Deploy",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
            },
        );
        console.log("deploy master contract");

        const deployResult = await escrowGXT.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        console.log("deploy escrowGXT contract");

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowGXT.address,
            deploy: true,
            success: true,
        });

        const wallet_address_from_master = await jettonMasterContract.getGetWalletAddress(escrowGXT.address);
        const wallet_address_from_escrow = await escrowGXT.getWalletAddress();

        // check wallet 
        expect(wallet_address_from_master.equals(wallet_address_from_escrow)).toBeTruthy();

    });


    it('store token and add distribution and withdraw', async () => {
        // the check is done inside beforeEach
        // blockchain and escrowGXT are ready to use

        // activate
        await escrowGXT.send(
            deployer.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            "activate"
        )

        const tx = await jettonMasterContract.send(
            deployer.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "MintAll",
                targetAddress: escrowGXT.address
            }
        );

        console.log("escrowGXT mint all");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMasterContract.address,
            success: true,
            op: 0x888041c3,  // MintAll
        });

        expect(tx.transactions).toHaveTransaction({
            from: jettonMasterContract.address,
            to: escrowJettonWallet.address,
            success: true,
            op: 0x178d4519,  // TokenTransferInternal
        });

        // expect(tx.transactions).toHaveTransaction({
        //     from: escrowJettonWallet.address,
        //     to: deployer.address,
        //     success: true,
        //     op: 0xd53276db,  // Excesses
        // });

        const jettonData = await escrowJettonWallet.getGetWalletData();
        expect(jettonData.balance).toEqual(210000000000000000000n);

        // 从里面提币出去
        // await escrowGXT.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano("1"),
        //         bounce: false,
        //     },
        //     {
        //         $$type: "ExtractingAnything",
        //         queryId: 0n,
        //         amount: toNano("10000"),
        //         to: deployer.address
        //     }
        // )

        // const jettonData2 = await adminJettonWallet.getGetWalletData();
        // expect(jettonData2.balance).toEqual(toNano("10000"));

    });


    it('should add a distribution', async () => {
        const addDistributionMsg = {
            name: "TestDistribution",
            allocation: toNano("1000000"), // 1,000,000 tokens
            cliff_duration: 60 * 60 * 24 * 7, // 1 week in seconds
            vesting_duration: 60 * 60 * 24 * 30, // 30 days in seconds
            admin: deployer.address
        };

        const addTx = await escrowGXT.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
                bounce: false,
            },
            {
                $$type: "AddDistribution",
                name: "TestDistribution",
                allocation: toNano("1000000"),
                cliff_duration: 0n,
                vesting_duration: 1n,
                admin: deployer.address,   
            }
        );

        // 检查交易是否成功
        expect(addTx.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowGXT.address,
            success: true,
        });

        // 检查分配是否被正确添加
        const distribution = await escrowGXT.getGetDistributionOfName("TestDistribution");
        expect(distribution).not.toBeNull();
        expect(distribution?.name).toEqual("TestDistribution");
        expect(distribution?.allocation).toEqual(toNano("1000000"));
        expect(distribution?.cliff_duration).toEqual(0n);
        expect(distribution?.vesting_duration).toEqual(1n);
        expect(distribution?.release_speed).toEqual(toNano("1000000"));
        expect(distribution?.extracted).toEqual(0n);
        expect(distribution?.admin.equals(deployer.address)).toBeTruthy();


        // 检查是否可以正常取出
        // const exTx = await escrowGXT.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano("1"),
        //         bounce: false,
        //     },
        //     {
        //         $$type: "ExtractingAnything",
        //         queryId: 0n,
        //         amount: toNano("10000"),
        //         to: deployer.address
        //     }
        // )


        // expect(exTx.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: escrowGXT.address,
        //     success: true,
        // });
        
        // expect(exTx.transactions).toHaveTransaction({
        //     from: escrowGXT.address,
        //     to: escrowJettonWallet.address,
        //     success: true,
        // });


        // expect(exTx.transactions).toHaveTransaction({
        //     from: escrowJettonWallet.address,
        //     to: adminJettonWallet.address,
        //     success: true,
        // });

        // expect(exTx.transactions).toHaveTransaction({
        //     from: adminJettonWallet.address,
        //     to: deployer.address,
        //     success: true,
        // });

       
    });

    

    

    
});
