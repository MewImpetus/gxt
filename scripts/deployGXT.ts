import { toNano, Address } from '@ton/core';
import { JettonMasterGXT } from '../wrappers/GXT';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {

    const admin = Address.parse("0QAVWJbfEIGvKOht-utclCtzpnitbaWm70HwRa24NoTpUCTI")
    const gXT = provider.open(await JettonMasterGXT.fromInit(admin,
                {
                    $$type: "Tep64TokenData",
                    flag: BigInt(1),
                    content: "https://raw.githubusercontent.com/MewImpetus/gxt/refs/heads/main/gxt.json",
                },
                toNano("210000000000")));

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

    // address EQBlEmR6RCwLNu5Lfpq8hh91DCMsGq3aO5kucNQHTAM3g54R
    // ===========================
    //mint all
    // await gXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.03'),
    //     },
    //     {
    //         $$type: 'MintAll',
    //         targetAddress: admin
    //     }
    // )
}
