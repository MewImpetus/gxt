import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { comment, toNano } from '@ton/core';
import { GXT } from '../wrappers/GXT';
import '@ton/test-utils';

import { loadTakeWalletAddress, loadTep64TokenData } from "../build/GXT/tact_GXT";
import { JettonWalletTemplate } from "../build/GXT/tact_JettonWalletTemplate";
import exp from 'constants';
import { JettonMasterGXT } from '../build/GXT/tact_JettonMasterGXT';

describe('GXT', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let gXT: SandboxContract<GXT>;

    let admin: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let responseDestination: SandboxContract<TreasuryContract>;
    let jettonMasterContract: SandboxContract<JettonMasterGXT>;
    let adminJettonWallet: SandboxContract<JettonWalletTemplate>;
    let userJettonWallet: SandboxContract<JettonWalletTemplate>;
    let nJettonOwnerHas: bigint = toNano(Math.random() * 1000);

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        admin = await blockchain.treasury('admin');
        user = await blockchain.treasury('user');
        responseDestination = await blockchain.treasury('responseDestination');

        gXT = blockchain.openContract(await GXT.fromInit( admin.address,
            {
                $$type: "Tep64TokenData",
                flag: BigInt(1),
                content: "https://s3.laisky.com/uploads/2024/09/jetton-sample.json",
            }, 
            toNano("210000000000")));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await gXT.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: gXT.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and gXT are ready to use
    });
});
