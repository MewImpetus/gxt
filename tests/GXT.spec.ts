import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { GXT } from '../wrappers/GXT';
import '@ton/test-utils';

describe('GXT', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let gXT: SandboxContract<GXT>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        gXT = blockchain.openContract(await GXT.fromInit());

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
