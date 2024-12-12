import { toNano } from '@ton/core';
import { GXT } from '../wrappers/GXT';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const gXT = provider.open(await GXT.fromInit());

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

    await provider.waitForDeploy(gXT.address);

    // run methods on `gXT`
}
