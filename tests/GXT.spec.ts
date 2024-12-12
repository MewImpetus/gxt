import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { comment, toNano } from '@ton/core';
import { JettonMasterGXT, loadTakeWalletAddress, loadTep64TokenData } from '../wrappers/GXT';
import '@ton/test-utils';

// import { loadTakeWalletAddress, loadTep64TokenData } from "../build/GXT/tact_JettonMasterGXT";
import { JettonWalletTemplate } from "../build/GXT/tact_JettonWalletTemplate";
import exp from 'constants';


describe('GXT', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let gXT: SandboxContract<JettonMasterGXT>;

    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let responseDestination: SandboxContract<TreasuryContract>;
    let adminJettonWallet: SandboxContract<JettonWalletTemplate>;
    let userJettonWallet: SandboxContract<JettonWalletTemplate>;
    let nJettonOwnerHas: bigint = toNano(Math.random() * 1000);

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');
        deployer = await blockchain.treasury('deployer');
        responseDestination = await blockchain.treasury('responseDestination');

        gXT = blockchain.openContract(await JettonMasterGXT.fromInit(admin.address,
            {
                $$type: "Tep64TokenData",
                flag: BigInt(1),
                content: "https://raw.githubusercontent.com/MewImpetus/gxt/refs/heads/main/gxt.json",
            },
            toNano("210000000000")));

        adminJettonWallet = blockchain.openContract(
            await JettonWalletTemplate.fromInit(
                gXT.address,
                admin.address,
            )
        );

        userJettonWallet = blockchain.openContract(
            await JettonWalletTemplate.fromInit(
                gXT.address,
                user.address,
            )
        );


        console.log(`jettonMasterContract: ${gXT.address}`);
        console.log(`adminJettonWallet: ${adminJettonWallet.address}`);
        console.log(`userJettonWallet: ${userJettonWallet.address}`);
        console.log(`admin: ${admin.address}`);
        console.log(`user: ${user.address}`);
        console.log(`responseDestination: ${responseDestination.address}`);
        console.log(`nJettonOwnerHas: ${nJettonOwnerHas}`)
    });

    it("signature for contracts code", async () => {
        const codeHash1 = adminJettonWallet.init!!.code.hash();
        const codeHash2 = userJettonWallet.init!!.code.hash();
        expect(codeHash1.equals(codeHash2)).toBeTruthy();

        const dataHash1 = adminJettonWallet.init!!.data.hash();
        const dataHash2 = userJettonWallet.init!!.data.hash();
        expect(dataHash1.equals(dataHash2)).toBeFalsy();
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and gXT are ready to use
        const tx = await gXT.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: deployer.address,
            to: gXT.address,
            success: true,
            op: 0x946a98b6,
        });

        const staticTax = await gXT.getStaticTax()
        expect(staticTax).toEqual(toNano("0.001"));

        const jettonData = await gXT.getGetJettonData();
        expect(jettonData.totalSupply).toEqual(BigInt(0));
        expect(jettonData.mintable).toBeTruthy();
        expect(jettonData.owner.equals(admin.address)).toBeTruthy();

        const jettonContent = loadTep64TokenData(jettonData.content.asSlice());
        expect(jettonContent.flag).toEqual(BigInt(1));
        expect(jettonContent.content).toEqual("https://raw.githubusercontent.com/MewImpetus/gxt/refs/heads/main/gxt.json");

    });

    it("tep-89 includeAddress==true", async () => {
        const tx = await gXT.send(
            admin.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "ProvideWalletAddress",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
                ownerAddress: user.address,
                includeAddress: true
            },
        );
        console.log("tep-89 includeAddress==true");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: admin.address,
            to: gXT.address,
            success: true,
            op: 0x2c76b973,  // ProvideWalletAddress
        });
        expect(tx.transactions).toHaveTransaction({
            from: gXT.address,
            to: admin.address,
            success: true,
            op: 0xd1735400,  // TakeWalletAddress
        });

        const body = tx.transactions[1].outMessages.get(0)!!.body
        const resp = loadTakeWalletAddress(body.asSlice());

        expect(resp.ownerAddress!!.equals(user.address)).toBeTruthy();
        expect(resp.walletAddress!!.equals(userJettonWallet.address)).toBeTruthy();
    });

    it("tep-89 includeAddress==false", async () => {
        const tx = await gXT.send(
            admin.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "ProvideWalletAddress",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
                ownerAddress: user.address,
                includeAddress: false
            },
        );
        console.log("tep-89 includeAddress==true");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: admin.address,
            to: gXT.address,
            success: true,
            op: 0x2c76b973,  // ProvideWalletAddress
        });
        expect(tx.transactions).toHaveTransaction({
            from: gXT.address,
            to: admin.address,
            success: true,
            op: 0xd1735400,  // TakeWalletAddress
        });

        const body = tx.transactions[1].outMessages.get(0)!!.body
        const resp = loadTakeWalletAddress(body.asSlice());

        expect(resp.walletAddress!!.equals(userJettonWallet.address)).toBeTruthy();
        expect(resp.ownerAddress).toBeNull();
    });

    it("mint to owner", async () => {
        const tx = await gXT.send(
            admin.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "MintJetton",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
                amount: nJettonOwnerHas,
                receiver: admin.address,
                responseDestination: responseDestination.address,
                forwardAmount: toNano("0.1"),
                forwardPayload: comment("jetton forward msg"),
            },
        );
        console.log("mint to owner");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: admin.address,
            to: gXT.address,
            success: true,
            op: 0xa593886f,  // MintJetton
        });
        expect(tx.transactions).toHaveTransaction({
            from: gXT.address,
            to: adminJettonWallet.address,
            success: true,
            op: 0x178d4519,  // TokenTransferInternal
        });
        expect(tx.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: admin.address,
            success: true,
            op: 0x7362d09c,  // TransferNotification
        });
        expect(tx.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: responseDestination.address,
            success: true,
            op: 0xd53276db,  // Excesses
        });

        const jettonData = await adminJettonWallet.getGetWalletData();
        expect(jettonData.owner.equals(admin.address)).toBeTruthy();
        expect(jettonData.balance).toEqual(nJettonOwnerHas);
        expect(jettonData.master.equals(gXT.address)).toBeTruthy();
    });


    it("transfer to user", async () => {
        const tx = await adminJettonWallet.send(
            admin.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "TokenTransfer",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
                amount: toNano("10"),
                destination: user.address,
                responseDestination: responseDestination.address,
                forwardAmount: toNano("0.01"),
                forwardPayload: comment("jetton forward msg"),
                customPayload: null,
            },
        );
        console.log("transfer to user");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: admin.address,
            to: adminJettonWallet.address,
            success: true,
            op: 0xf8a7ea5,  // TokenTransfer
        });
        expect(tx.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: userJettonWallet.address,
            success: true,
            op: 0x178d4519,  // TokenTransferInternal
        });
        expect(tx.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: user.address,
            success: true,
            op: 0x7362d09c,  // TransferNotification
        });
        expect(tx.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: responseDestination.address,
            success: true,
            op: 0xd53276db,  // Excesses
        });

        const jettonMasterData = await gXT.getGetJettonData();
        expect(jettonMasterData.totalSupply).toEqual(nJettonOwnerHas);

        const ownerJettonData = await adminJettonWallet.getGetWalletData();
        expect(ownerJettonData.balance).toEqual(BigInt(0));

        const jettonData = await userJettonWallet.getGetWalletData();
        expect(jettonData.owner.equals(user.address)).toBeTruthy();
        expect(jettonData.balance).toEqual(nJettonOwnerHas);
        expect(jettonData.master.equals(gXT.address)).toBeTruthy();
    });

    it("user transfer back to admin", async () => {
        const tx = await userJettonWallet.send(
            user.getSender(),
            {
                value: toNano("1"),
                bounce: false,
            },
            {
                $$type: "TokenTransfer",
                queryId: BigInt(Math.floor(Date.now() / 1000)),
                amount: toNano("1"),
                destination: admin.address,
                responseDestination: responseDestination.address,
                forwardAmount: toNano("0.1"),
                forwardPayload: comment("jetton forward msg"),
                customPayload: null,
            },
        );
        console.log("user transfer back to admin");
        printTransactionFees(tx.transactions);

        expect(tx.transactions).toHaveTransaction({
            from: user.address,
            to: userJettonWallet.address,
            success: true,
            op: 0xf8a7ea5,  // TokenTransfer
        });
        expect(tx.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: adminJettonWallet.address,
            success: true,
            op: 0x178d4519,  // TokenTransferInternal
        });
        expect(tx.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: admin.address,
            success: true,
            op: 0x7362d09c,  // TransferNotification
        });
        expect(tx.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: responseDestination.address,
            success: true,
            op: 0xd53276db,  // Excesses
        });

        const jettonMasterData = await gXT.getGetJettonData();
        expect(jettonMasterData.totalSupply).toEqual(nJettonOwnerHas);

        const ownerJettonData = await adminJettonWallet.getGetWalletData();
        expect(ownerJettonData.balance).toEqual(toNano("10"));

        const jettonData = await userJettonWallet.getGetWalletData();
        expect(jettonData.owner.equals(user.address)).toBeTruthy();
        expect(jettonData.balance).toEqual(nJettonOwnerHas - toNano("10"));
        expect(jettonData.master.equals(gXT.address)).toBeTruthy();
    });
});
