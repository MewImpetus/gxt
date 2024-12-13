import { toNano } from '@ton/core';
import { EscrowGXT } from '../wrappers/EscrowGXT';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const escrowGXT = provider.open(await EscrowGXT.fromInit());

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

    await provider.waitForDeploy(escrowGXT.address);

    // run methods on `escrowGXT`
}
